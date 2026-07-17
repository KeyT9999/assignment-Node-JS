"""End-to-end generation, startup, and Postman-guide benchmark for three DOCX corpora."""
from __future__ import annotations

import json
import os
import re
import shutil
import socket
import subprocess
import time
from pathlib import Path

import pe_generator as pg
from benchmark_demo import docx_text
from dynamic_exam_parser import parse_dynamic_spec


ROOT = Path(__file__).resolve().parent
WORKSPACE = ROOT.parent
OUTPUT = WORKSPACE / "PE_Full_Corpus_Benchmark"
SOURCES = ("DEGIONGTAI", "DEMOI", "DeMoi2")


def requests(items):
    for item in items:
        if isinstance(item.get("item"), list):
            yield from requests(item["item"])
        elif isinstance(item.get("request"), dict):
            yield item


def normalize(path):
    path = path.replace("{{base_url}}", "").split("?", 1)[0]
    path = re.sub(r"\{\{[^}]+\}\}", ":id", path)
    path = re.sub(r":[A-Za-z][A-Za-z0-9_]*", ":id", path)
    return path.rstrip("/") or "/"


def guide_audit(files, spec):
    errors = []
    guide = files.get("POSTMAN_GUIDE.md", "")
    names = [name for name in files if name.endswith(".postman_collection.json")]
    if len(names) != 1:
        return 0, 0, [f"expected one collection, got {len(names)}"]
    collection = json.loads(files[names[0]])
    collection_requests = list(requests(collection.get("item", [])))
    actual = set()
    for item in collection_requests:
        request = item["request"]
        url = request.get("url", "")
        url = url if isinstance(url, str) else url.get("raw", "")
        actual.add((request.get("method", "GET").upper(), normalize(url)))
        if f"`{url}`" not in guide:
            errors.append(f"guide missing URL {url}")
    required = {(api["method"].upper(), normalize(api["path"])) for api in spec.get("apis", [])}
    for method, path in sorted(required - actual):
        errors.append(f"collection missing exam endpoint {method} {path}")
    headings = len(re.findall(r"(?m)^### Test \d+", guide))
    if headings != len(collection_requests):
        errors.append(f"guide tests {headings} != requests {len(collection_requests)}")
    for marker in ("Collection Variables", "Mong đợi", "npm run dev"):
        if marker not in guide:
            errors.append(f"guide missing {marker}")
    return len(collection_requests), headings, errors


def startup_probe(project):
    occupied = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    occupied.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    occupied.bind(("127.0.0.1", 0))
    preferred = occupied.getsockname()[1]
    occupied.listen(1)
    env = os.environ.copy()
    env["PORT"] = str(preferred)
    env["NODE_PATH"] = str(WORKSPACE / "SUOCPE" / "node_modules")
    env["MONGODB_URI"] = f"mongodb://127.0.0.1:27017/probe_{preferred}?serverSelectionTimeoutMS=500"
    process = subprocess.Popen(
        ["node", "utils/startDev.js"], cwd=project, env=env,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
    )
    selected = preferred + 1
    listening = False
    deadline = time.time() + 3
    while time.time() < deadline and process.poll() is None:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            probe.settimeout(.15)
            if probe.connect_ex(("127.0.0.1", selected)) == 0:
                listening = True
                break
        time.sleep(.1)
    alive = process.poll() is None
    if alive:
        process.terminate()
    try:
        stdout, stderr = process.communicate(timeout=3)
    except subprocess.TimeoutExpired:
        process.kill()
        stdout, stderr = process.communicate()
    occupied.close()
    output = stdout + stderr
    fallback_message = f"Port {preferred} is busy; using {selected}" in output
    return {
        "started": listening,
        "fallbackMessage": fallback_message,
        "eadrInUse": "EADDRINUSE" in output,
        "detail": output[-1000:],
    }


def main():
    OUTPUT.mkdir(exist_ok=True)
    results = []
    index = 0
    for folder in SOURCES:
        for exam in sorted((WORKSPACE / folder).glob("*.docx")):
            index += 1
            text = docx_text(exam)
            parsed = pg.ExamParser.parse(text)
            parsed["dynamic_spec"] = parse_dynamic_spec(text)
            config = pg.build_config_from_exam(text, parsed, {"user": [], "resource": [], "booking": []})
            config["output_dir"] = str(OUTPUT)
            config["project_name"] = f"Corpus_{index:02d}_{parsed['domain']}"
            target = OUTPUT / config["project_name"]
            if target.exists():
                shutil.rmtree(target)
            files, output, _ = pg.generate_project(config, False)
            checked, verify_errors = pg.verify_generated_output(output)
            request_count, guide_tests, guide_errors = guide_audit(files, parsed["dynamic_spec"])
            startup = startup_probe(target)
            package = json.loads(files["package.json"])
            if package.get("scripts", {}).get("dev") != "nodemon utils/startDev.js":
                verify_errors.append("npm run dev does not use collision-safe launcher")
            results.append({
                "folder": folder, "exam": exam.name, "domain": parsed["domain"],
                "checkedJs": checked, "verifyErrors": verify_errors,
                "requests": request_count, "guideTests": guide_tests, "guideErrors": guide_errors,
                "startup": startup, "output": str(target),
            })
    (OUTPUT / "benchmark_results.json").write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    lines = [
        "# Full corpus startup and Postman benchmark", "",
        "| Folder | Exam | Domain | Startup with occupied port | EADDRINUSE | Requests/Guide | Errors |",
        "|---|---|---|---:|---:|---:|---:|",
    ]
    for result in results:
        errors = len(result["verifyErrors"]) + len(result["guideErrors"])
        startup_ok = result["startup"]["started"] and not result["startup"]["eadrInUse"]
        lines.append(
            f"| {result['folder']} | {result['exam']} | {result['domain']} | "
            f"{'PASS' if startup_ok else 'FAIL'} | {'YES' if result['startup']['eadrInUse'] else 'NO'} | "
            f"{result['requests']}/{result['guideTests']} | {errors} |"
        )
    report = "\n".join(lines) + "\n"
    (OUTPUT / "BENCHMARK_REPORT.md").write_text(report, encoding="utf-8")
    print(report)
    failures = []
    for result in results:
        startup_ok = result["startup"]["started"] and not result["startup"]["eadrInUse"]
        if result["verifyErrors"] or result["guideErrors"] or not startup_ok:
            failures.append(result)
            print(f"[{result['exam']}] verify={result['verifyErrors']} guide={result['guideErrors']} startup={result['startup']}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
