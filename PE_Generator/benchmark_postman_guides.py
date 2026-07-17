"""Generate and audit Postman guides for the local SDN302 Markdown corpus."""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

import pe_generator as pg
from dynamic_exam_parser import parse_dynamic_spec


ROOT = Path(__file__).resolve().parent
WORKSPACE = ROOT.parent
OUTPUT = WORKSPACE / "PE_Postman_Guide_Benchmark"
EXAMS = [
    "DePE2.docx.md",
    "Done Car Rental Management System.docx.md",
    "Done Equipment Rental.docx.md",
    "Done Hospital Appointment.docx.md",
    "DONE Movie Theaters Management System.docx.md",
    "Done p1_Event management.docx.md",
    "PE.docx.md",
    "peprojectbooking.md",
]


def collection_requests(items):
    for item in items:
        if isinstance(item.get("item"), list):
            yield from collection_requests(item["item"])
        elif isinstance(item.get("request"), dict):
            yield item


def normalize_endpoint(path):
    path = path.replace("{{base_url}}", "").split("?", 1)[0]
    path = re.sub(r"\{\{[^}]+\}\}", ":id", path)
    path = re.sub(r":[A-Za-z][A-Za-z0-9_]*", ":id", path)
    return path.rstrip("/") or "/"


def audit(files, project_name, exam_spec):
    guide = files.get("POSTMAN_GUIDE.md", "")
    collection_names = [name for name in files if name.endswith(".postman_collection.json")]
    errors = []
    request_count = 0
    if len(collection_names) != 1:
        errors.append(f"expected one collection, got {len(collection_names)}")
    else:
        collection = json.loads(files[collection_names[0]])
        requests = list(collection_requests(collection.get("item", [])))
        request_count = len(requests)
        collection_endpoints = set()
        for item in requests:
            request = item["request"]
            url = request.get("url", "")
            url = url if isinstance(url, str) else url.get("raw", "")
            if url and f"`{url}`" not in guide:
                errors.append(f"guide missing URL: {url}")
            collection_endpoints.add((request.get("method", "GET").upper(), normalize_endpoint(url)))
        required_endpoints = {
            (api["method"].upper(), normalize_endpoint(api["path"]))
            for api in exam_spec.get("apis", [])
        }
        for method, path in sorted(required_endpoints - collection_endpoints):
            errors.append(f"collection missing required endpoint: {method} {path}")
    heading_count = len(re.findall(r"(?m)^### Test \d+", guide))
    if heading_count != request_count:
        errors.append(f"guide tests {heading_count} != collection requests {request_count}")
    for required in ("npm run dev", "Collection Variables", "Mong đợi", "Thứ tự chạy"):
        if required not in guide:
            errors.append(f"guide missing section/text: {required}")
    if "__PROJECT_NAME__" in guide:
        errors.append("unresolved __PROJECT_NAME__ placeholder")
    return request_count, heading_count, errors


def main():
    OUTPUT.mkdir(exist_ok=True)
    results = []
    for index, exam_name in enumerate(EXAMS, 1):
        text = (WORKSPACE / exam_name).read_text(encoding="utf-8-sig")
        parsed = pg.ExamParser.parse(text)
        parsed["dynamic_spec"] = parse_dynamic_spec(text)
        config = pg.build_config_from_exam(text, parsed, {"user": [], "resource": [], "booking": []})
        config["output_dir"] = str(OUTPUT)
        config["project_name"] = f"GuideBench_{index:02d}_{config['project_name']}"
        target = OUTPUT / config["project_name"]
        if target.exists():
            shutil.rmtree(target)
        files, output_path, _ = pg.generate_project(config, dry_run=False)
        checked_js, verify_errors = pg.verify_generated_output(output_path)
        request_count, heading_count, guide_errors = audit(files, config["project_name"], parsed["dynamic_spec"])
        results.append({
            "exam": exam_name,
            "domain": parsed.get("domain"),
            "project": config["project_name"],
            "requests": request_count,
            "guideTests": heading_count,
            "checkedJs": checked_js,
            "verifyErrors": verify_errors,
            "guideErrors": guide_errors,
        })
    (OUTPUT / "benchmark_results.json").write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    lines = [
        "# Postman guide benchmark",
        "",
        "| Exam | Domain | Requests | Guide tests | JS/route errors | Guide errors |",
        "|---|---|---:|---:|---:|---:|",
    ]
    for result in results:
        lines.append(
            f"| {result['exam']} | {result['domain']} | {result['requests']} | "
            f"{result['guideTests']} | {len(result['verifyErrors'])} | {len(result['guideErrors'])} |"
        )
    report = "\n".join(lines) + "\n"
    (OUTPUT / "BENCHMARK_REPORT.md").write_text(report, encoding="utf-8")
    print(report)
    for result in results:
        for error in result["verifyErrors"] + result["guideErrors"]:
            print(f"[{result['exam']}] {error}")
    return 1 if any(r["verifyErrors"] or r["guideErrors"] for r in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
