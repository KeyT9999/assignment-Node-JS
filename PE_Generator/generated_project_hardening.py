"""Cross-template output hardening for dev startup and Postman artifacts."""
from __future__ import annotations

import json
import re
from typing import Any


DEV_LAUNCHER = """require('dotenv').config();
const net = require('net');

function portAvailable(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.unref();
    probe.once('error', () => resolve(false));
    probe.listen(port, () => probe.close(() => resolve(true)));
  });
}

(async () => {
  const preferred = Number(process.env.PORT) || 9999;
  let selected = preferred;
  while (selected < preferred + 50 && !(await portAvailable(selected))) selected += 1;
  if (selected >= preferred + 50) throw new Error(`No free development port in ${preferred}-${preferred + 49}`);
  process.env.PORT = String(selected);
  if (selected !== preferred) console.warn(`[dev] Port ${preferred} is busy; using ${selected}. Update Postman base_url.`);
  console.log(`[dev] Starting on http://localhost:${selected}`);
  require('../server');
})().catch((error) => {
  console.error(`[dev] Startup failed: ${error.message}`);
  process.exit(1);
});
"""


def _discover_endpoints(files: dict[str, str]) -> set[tuple[str, str]]:
    server = files.get("server.js", "")
    mounts: dict[str, str] = {}
    for base, route_file in re.findall(
        r"app\.use\(\s*['\"]([^'\"]+)['\"]\s*,\s*require\(\s*['\"]\./routes/([^'\"]+)['\"]\s*\)\s*\)",
        server,
    ):
        mounts[route_file if route_file.endswith(".js") else route_file + ".js"] = base
    endpoints: set[tuple[str, str]] = set()
    for route_file, base in mounts.items():
        source = files.get(f"routes/{route_file}", "")
        for method, subpath in re.findall(r"\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]*)['\"]", source, re.I):
            path = (base.rstrip("/") + "/" + subpath.lstrip("/")).rstrip("/") or "/"
            endpoints.add((method.upper(), path))
    return endpoints


def _sample_value(field: dict[str, Any]):
    name = field.get("name", "field")
    kind = str(field.get("type", "String"))
    enum = field.get("enum") or []
    if enum:
        return enum[0]
    if field.get("ref") or name.lower().endswith("id"):
        return "{{" + re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower() + "}}"
    if "Date" in kind:
        return "2027-08-01T09:00:00.000Z"
    if "Boolean" in kind:
        return True
    if "Number" in kind:
        return 1
    if "[" in kind or "Array" in kind:
        return []
    lowered = name.lower()
    if "email" in lowered:
        return "test@example.com"
    if "code" in lowered or "number" in lowered:
        return "TEST-001"
    if "status" in lowered:
        return "active"
    if "name" in lowered or "title" in lowered:
        return "Test record"
    if "note" in lowered or "reason" in lowered:
        return "Postman test"
    return "test-value"


def _model_for_path(models: list[dict[str, Any]], path: str):
    segment = path.strip("/").split("/", 1)[0]
    target = re.sub(r"[^a-z0-9]", "", segment.lower()).rstrip("s")
    candidates = []
    for model in models:
        name = re.sub(r"[^a-z0-9]", "", model.get("name", "").lower()).rstrip("s")
        score = len(name) if name and (name in target or target in name) else 0
        candidates.append((score, model))
    best = max(candidates, key=lambda item: item[0], default=(0, None))
    return best[1] if best[0] else None


ADVANCED_AUTH = {
    "procureflow": ("procurement_manager", "purchasing_officer", "assignedDepartment"),
    "portops": ("yard_manager", "gate_operator", "assignedYard"),
    "powerbill": ("billing_manager", "meter_reader", "assignedZone"),
    "safecampus": ("security_manager", "security_officer", "assignedFacility"),
    "granttrack": ("grant_manager", "project_officer", "assignedProject"),
}


def _action_body(path: str):
    action = path.rstrip("/").split("/")[-1]
    samples = {
        "review": {"action": "approve"},
        "receive": {"receivedItems": [], "note": "Postman receipt test"},
        "payments": {"amount": 1, "method": "cash"},
        "process": {"action": "approve", "approvedAmount": 1},
        "submit": {"completionPercent": 100, "evidence": "Postman test"},
        "complete": {"score": 8, "endStation": "Station B"},
        "cancel": {"reason": "Postman test"},
        "status": {"status": "confirmed"},
    }
    return samples.get(action)


def _sample_body(method: str, path: str, spec: dict[str, Any], config: dict[str, Any]) -> dict[str, Any] | None:
    if method not in {"POST", "PUT", "PATCH"}:
        return None
    if path == "/auth/register":
        advanced = ADVANCED_AUTH.get(config.get("recognized_domain"))
        if advanced:
            _, worker, assigned = advanced
            return {"username": "worker1", "password": "123456", "fullName": "Test Worker", "role": worker, assigned: "{{assigned_id}}"}
        return {"username": "testuser", "password": "123456", "fullName": "Test User"}
    if path == "/auth/login":
        if config.get("recognized_domain") in ADVANCED_AUTH:
            return {"username": "manager1", "password": "123456"}
        return {"username": "testuser", "password": "123456"}
    action_body = _action_body(path)
    if action_body is not None:
        return action_body
    model = _model_for_path(spec.get("models", []), path)
    if not model:
        return {}
    skipped = {"_id", "createdAt", "updatedAt", "performedBy", "createdBy", "userId", "studentId"}
    fields = [f for f in model.get("fields", []) if f.get("name") not in skipped and (f.get("required") or f.get("unique"))]
    return {field["name"]: _sample_value(field) for field in fields[:12]}


def _collection_from_output(files: dict[str, str], config: dict[str, Any]) -> str:
    spec = config.get("exam_spec", {})
    endpoints = _discover_endpoints(files)
    endpoints.update((api["method"].upper(), api["path"].split("?", 1)[0]) for api in spec.get("apis", []))
    variables = {"base_url": "http://localhost:9999", "token": ""}
    items = []
    order = {"POST": 0, "GET": 1, "PUT": 2, "PATCH": 3, "DELETE": 4}
    endpoints = sorted(endpoints, key=lambda item: (0 if item[1].startswith("/auth") else 1, item[1], order.get(item[0], 9)))
    for index, (method, path) in enumerate(endpoints, 1):
        rendered_path = path
        for param in re.findall(r":([A-Za-z][A-Za-z0-9_]*)", path):
            snake = re.sub(r"(?<!^)(?=[A-Z])", "_", param).lower()
            key = "record_id" if snake == "id" else (snake if snake.endswith("_id") else f"{snake}_id")
            variables.setdefault(key, "")
            rendered_path = rendered_path.replace(f":{param}", "{{" + key + "}}")
        headers = [{"key": "Content-Type", "value": "application/json"}]
        advanced_register = path == "/auth/register" and config.get("recognized_domain") in ADVANCED_AUTH
        if not path.startswith("/auth/") or advanced_register:
            headers.append({"key": "Authorization", "value": "Bearer {{token}}"})
        body = _sample_body(method, path, spec, config)
        request: dict[str, Any] = {"method": method, "header": headers, "url": "{{base_url}}" + rendered_path}
        if body is not None:
            raw_body = json.dumps(body, ensure_ascii=False)
            request["body"] = {"mode": "raw", "raw": raw_body}
            for variable in re.findall(r"\{\{([^}]+)\}\}", raw_body):
                variables.setdefault(variable, "")
        expected = 201 if method == "POST" and path != "/auth/login" else 200
        scripts = [f"pm.test('Status {expected}', () => pm.response.to.have.status({expected}));"]
        if path == "/auth/login":
            scripts.append("if (pm.response.json().token) pm.collectionVariables.set('token', pm.response.json().token);")
        items.append({
            "name": f"{index:02d} {method} {path}",
            "request": request,
            "event": [{"listen": "test", "script": {"exec": scripts, "type": "text/javascript"}}],
        })
    collection = {
        "info": {"name": config["project_name"], "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"},
        "variable": [{"key": key, "value": value} for key, value in variables.items()],
        "item": items,
    }
    return json.dumps(collection, indent=2, ensure_ascii=False)


def _collection_requests(items):
    for item in items:
        if isinstance(item.get("item"), list):
            yield from _collection_requests(item["item"])
        elif isinstance(item.get("request"), dict):
            yield item


def _request_key(item):
    request = item["request"]
    url = request.get("url", "")
    url = url if isinstance(url, str) else url.get("raw", "")
    path = url.replace("{{base_url}}", "").split("?", 1)[0]
    path = re.sub(r"\{\{[^}]+\}\}", ":id", path)
    path = re.sub(r":[A-Za-z][A-Za-z0-9_]*", ":id", path)
    return request.get("method", "GET").upper(), path.rstrip("/") or "/"


def _merge_collection_coverage(existing_text: str, fallback_text: str) -> tuple[str, int]:
    existing = json.loads(existing_text)
    fallback = json.loads(fallback_text)
    current = {_request_key(item) for item in _collection_requests(existing.get("item", []))}
    missing = [item for item in _collection_requests(fallback.get("item", [])) if _request_key(item) not in current]
    if missing:
        existing.setdefault("item", []).append({"name": "Generated endpoint coverage", "item": missing})
    variables = {item.get("key") for item in existing.get("variable", [])}
    for variable in fallback.get("variable", []):
        if variable.get("key") not in variables:
            existing.setdefault("variable", []).append(variable)
    return json.dumps(existing, indent=2, ensure_ascii=False), len(missing)


def harden_generated_project(files: dict[str, str], config: dict[str, Any]) -> list[str]:
    changes = []
    collection_name = f"{config['project_name']}.postman_collection.json"
    fallback_collection = _collection_from_output(files, config)
    existing_names = [name for name in files if name.endswith(".postman_collection.json")]
    if not existing_names:
        files[collection_name] = fallback_collection
        changes.append("Generated Postman collection from routes and exam spec")
    else:
        existing_name = existing_names[0]
        try:
            files[existing_name], added = _merge_collection_coverage(files[existing_name], fallback_collection)
            if added:
                changes.append(f"Added {added} missing endpoints to Postman collection")
        except (TypeError, json.JSONDecodeError):
            files[existing_name] = fallback_collection
            changes.append("Replaced invalid Postman collection")
    try:
        package = json.loads(files.get("package.json", "{}"))
        scripts = package.setdefault("scripts", {})
        scripts["dev"] = "nodemon utils/startDev.js"
        package.setdefault("devDependencies", {}).setdefault("nodemon", "^3.1.4")
        files["package.json"] = json.dumps(package, indent=2, ensure_ascii=False) + "\n"
        files["utils/startDev.js"] = DEV_LAUNCHER
        changes.append("Added collision-safe npm run dev launcher")
    except (TypeError, json.JSONDecodeError):
        changes.append("Skipped dev launcher: invalid package.json")
    return changes
