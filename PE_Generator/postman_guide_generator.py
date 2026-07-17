"""Build detailed, reproducible Markdown guides from Postman collections."""
from __future__ import annotations

import json
import re
from typing import Any, Iterable


def _requests(items: Iterable[dict[str, Any]]):
    for item in items:
        if isinstance(item.get("item"), list):
            yield from _requests(item["item"])
        elif isinstance(item.get("request"), dict):
            yield item


def _url(request: dict[str, Any]) -> str:
    value = request.get("url", "")
    return value if isinstance(value, str) else value.get("raw", "")


def _script_lines(item: dict[str, Any]) -> list[str]:
    lines: list[str] = []
    for event in item.get("event", []):
        script = event.get("script", {}).get("exec", [])
        lines.extend(script if isinstance(script, list) else [str(script)])
    return lines


def _expected_status(item: dict[str, Any]) -> int:
    name = item.get("name", "")
    scripts = "\n".join(_script_lines(item))
    for text in (name, scripts):
        match = re.search(r"(?:expect|status\s*\(?|have\.status\s*\()\s*(\d{3})", text, re.I)
        if match:
            return int(match.group(1))
    lowered = name.lower()
    keyword_status = {
        "forbidden": 403,
        "unauthorized": 401,
        "duplicate": 409,
        "conflict": 409,
        "insufficient": 409,
        "not found": 404,
        "invalid": 400,
        "complete again": 400,
    }
    for keyword, status in keyword_status.items():
        if keyword in lowered:
            return status
    method = item.get("request", {}).get("method", "GET").upper()
    return 201 if method == "POST" and not any(x in lowered for x in ("login", "search", "list", "get")) else 200


def _pretty_body(request: dict[str, Any]) -> tuple[str, str] | None:
    body = request.get("body") or {}
    if body.get("mode") != "raw" or not body.get("raw"):
        return None
    raw = body["raw"]
    try:
        raw = json.dumps(json.loads(raw), indent=2, ensure_ascii=False)
        return "json", raw
    except (TypeError, json.JSONDecodeError):
        return "text", str(raw)


def _saved_variables(item: dict[str, Any]) -> list[str]:
    scripts = "\n".join(_script_lines(item))
    return sorted(set(re.findall(r"(?:collectionVariables|environment)\.set\(['\"]([^'\"]+)", scripts)))


def generate_detailed_postman_guide(
    collection: dict[str, Any],
    project_name: str,
    original_notes: str = "",
    has_seed: bool = True,
) -> str:
    requests = list(_requests(collection.get("item", [])))
    variables = collection.get("variable", [])
    collection_file = f"{project_name}.postman_collection.json"
    lines = [
        f"# Hướng dẫn kiểm thử Postman — {project_name}",
        "",
        f"Guide này được sinh đồng bộ từ `{collection_file}`. Có **{len(requests)} test cases**; mỗi test ghi rõ request và kết quả tối thiểu cần kiểm tra.",
        "",
        "## 1. Chuẩn bị",
        "",
        "```bash",
        "npm install",
        *( ["npm run seed"] if has_seed else [] ),
        "npm run dev",
        "```",
        "",
        f"Import `{collection_file}` vào Postman. Chạy request theo đúng thứ tự bên dưới vì các script có thể lưu token hoặc ID cho bước sau.",
        "",
        "### Collection Variables",
        "",
        "| Variable | Giá trị ban đầu | Cách lấy |",
        "|---|---|---|",
    ]
    if variables:
        saved = {value for item in requests for value in _saved_variables(item)}
        for variable in variables:
            key = str(variable.get("key", ""))
            value = str(variable.get("value", "")) or "_để trống_"
            source = "Script tự lưu từ response" if key in saved else "Điền thủ công nếu request yêu cầu"
            if key == "base_url":
                source = "URL server"
            lines.append(f"| `{key}` | `{value}` | {source} |")
    else:
        lines.append("| `base_url` | `http://localhost:9999` | URL server |")

    lines.extend([
        "",
        "### Quy tắc chụp kết quả",
        "",
        "Mỗi ảnh nên hiển thị tên request, method, URL, Authorization/body, HTTP status và response. Với test lỗi, chụp cả message lỗi.",
        "",
        "## 2. Test cases",
        "",
    ])

    for number, item in enumerate(requests, 1):
        request = item["request"]
        method = request.get("method", "GET").upper()
        url = _url(request)
        expected = _expected_status(item)
        lines.extend([
            f"### Test {number} — {item.get('name', f'Request {number}')}",
            "",
            f"- Method: `{method}`",
            f"- URL: `{url}`",
        ])
        headers = request.get("header", [])
        if headers:
            lines.append("- Headers:")
            for header in headers:
                if not header.get("disabled"):
                    lines.append(f"  - `{header.get('key')}: {header.get('value', '')}`")
        body = _pretty_body(request)
        if body:
            language, raw = body
            lines.extend(["- Body:", "", f"```{language}", raw, "```"])
        saved_variables = _saved_variables(item)
        if saved_variables:
            rendered = ", ".join(f"`{value}`" for value in saved_variables)
            lines.append(f"- Script sau response tự lưu: {rendered}.")
        lines.append(f"- Mong đợi: HTTP `{expected}` và response đúng nghiệp vụ của request `{item.get('name', '')}`.")
        lines.append("")

    lines.extend([
        "## 3. Thứ tự chạy và reset dữ liệu",
        "",
        "1. " + ("Chạy `npm run seed` trước một lượt test mới." if has_seed else "Chuẩn bị dữ liệu mẫu/ID theo đề trước một lượt test mới."),
        "2. Chạy các request login/register trước để có token.",
        "3. Chạy request lấy hoặc tạo resource để collection lưu ID.",
        "4. Chạy các request nghiệp vụ và trường hợp lỗi theo thứ tự Test 1 → Test cuối.",
        "5. Nếu kết quả phụ thuộc dữ liệu của lần chạy trước, seed lại rồi chạy lại toàn bộ thứ tự.",
    ])

    notes = original_notes.strip()
    if notes and "được sinh đồng bộ" not in notes:
        lines.extend(["", "## 4. Ghi chú nghiệp vụ từ template", "", notes])
    return "\n".join(lines).rstrip() + "\n"


def enrich_generated_guide(files: dict[str, str], project_name: str) -> bool:
    collections = sorted(key for key in files if key.endswith(".postman_collection.json"))
    if not collections:
        return False
    try:
        collection = json.loads(files[collections[0]])
    except (TypeError, json.JSONDecodeError):
        return False
    original = files.get("POSTMAN_GUIDE.md", "")
    has_seed = False
    try:
        package = json.loads(files.get("package.json", "{}"))
        has_seed = "seed" in package.get("scripts", {})
    except (TypeError, json.JSONDecodeError):
        pass
    files["POSTMAN_GUIDE.md"] = generate_detailed_postman_guide(collection, project_name, original, has_seed)
    return True
