"""Conservative, domain-neutral parser for SDN302 exam specifications."""
import re

TYPE_MAP = {
    "string": "String", "number": "Number", "date": "Date",
    "boolean": "Boolean", "objectid": "ObjectId", "array": "[String]",
}


def _pascal(value):
    return value[:1].upper() + value[1:] if value else value


def _model_occurrences(text):
    pattern = re.compile(r"\b([A-Za-z][A-Za-z0-9_]*)Model\s*\.\s*js\b", re.I)
    found = []
    for match in pattern.finditer(text):
        name = re.sub(r"model$", "", match.group(1), flags=re.I)
        key = name[:1].lower() + name[1:]
        if not any(item[0].lower() == key.lower() for item in found):
            found.append((key, match.start()))
    return found


def _infer_type(line, field):
    low = line.lower()
    # Explicit exam types always win over naming conventions such as *Id.
    if "array" in low or "list of" in low:
        return "[String]"
    for token, result in TYPE_MAP.items():
        if token in low:
            return result
    if "enum" in low:
        return "String"
    if "objectid" in low or "ref:" in low or field.lower().endswith("id"):
        return "ObjectId"
    if any(x in field.lower() for x in ("price", "amount", "quantity", "capacity", "fee", "stock", "balance", "level")):
        return "Number"
    if any(x in field.lower() for x in ("date", "time", "createdat", "updatedat", "completedat")):
        return "Date"
    return None


def _parse_fields(block, known_models):
    fields = []
    blacklist = {"file", "fields", "model", "schema", "example", "function", "functionality", "logic", "constraint", "api", "requirement"}
    field_re = re.compile(r"^\s*(?:[*+\-•o]|\d+[.)])?\s*\*{0,2}([A-Za-z][A-Za-z0-9_]*)\*{0,2}\s*(?:—|–|-|:|\()");
    for raw in block.splitlines():
        line = raw.strip()
        match = field_re.match(line)
        if not match:
            continue
        name = match.group(1)
        if name.lower() in blacklist:
            continue
        field_type = _infer_type(line, name)
        if not field_type:
            continue
        low = line.lower()
        enum = []
        enum_match = re.search(r"enum\s*:?\s*\[([^\]]+)\]", line, re.I)
        if enum_match:
            enum = re.findall(r"['\"]([^'\"]+)['\"]", enum_match.group(1))
        ref = None
        if field_type == "ObjectId":
            ref_match = re.search(r"\bref(?:erence|erenced)?\b\s*(?:to|from|:)?\s*(?:the\s+)?['\"]?([A-Za-z][A-Za-z0-9_]*)", line, re.I)
            guessed = re.sub(r"id$", "", name, flags=re.I)
            ref = _pascal(ref_match.group(1) if ref_match else guessed)
            for model in known_models:
                if model.lower() == guessed.lower():
                    ref = _pascal(model)
            if ref.lower() in ("user", "student", "customer", "admin"):
                user_model_name = next((m for m in known_models if m.lower() in ("user", "student", "customer")), "User")
                ref = _pascal(user_model_name)
        default = None
        default_match = re.search(r"default\s*(?::|=|is)?\s*['\"]?([A-Za-z0-9_.-]+)", line, re.I)
        if default_match:
            default = default_match.group(1)
        fields.append({
            "name": name, "type": field_type,
            "required": "required" in low and "not required" not in low,
            "unique": "unique" in low,
            "enum": enum, "ref": ref, "default": default,
        })
    unique = {}
    for field in fields:
        unique.setdefault(field["name"].lower(), field)
    return list(unique.values())


def parse_dynamic_spec(text):
    occurrences = _model_occurrences(text)
    model_names = [item[0] for item in occurrences]
    models = []
    for index, (name, start) in enumerate(occurrences):
        end = occurrences[index + 1][1] if index + 1 < len(occurrences) else len(text)
        block = text[start:end]
        # Do not let a model consume the API/structure sections that follow it.
        stop = re.search(r"\n\s*(?:#{0,4}\s*)?(?:\d+(?:\.\d+)*[.)]?\s*)?(?:RESTful APIs|Build APIs|Implement the following|Project Structure|Submission Requirements|.*\bAPI\b)", block, re.I)
        if stop:
            block = block[:stop.start()]
        models.append({"name": name, "className": _pascal(name), "fields": _parse_fields(block, model_names)})

    apis = []
    for match in re.finditer(r"\b(GET|POST|PUT|PATCH|DELETE)\s+(`?/[A-Za-z0-9_?&=./:\-{}]+`?)", text, re.I):
        item = {"method": match.group(1).upper(), "path": match.group(2).strip("`").rstrip(".,:")}
        if item not in apis:
            apis.append(item)

    roles = []
    role_enum = re.search(r"role[^\n]*enum\s*:?\s*\[([^\]]+)\]", text, re.I)
    if role_enum:
        roles = re.findall(r"['\"]([^'\"]+)['\"]", role_enum.group(1))
    if not roles:
        candidates = ["warehouse_manager", "stock_keeper", "auditor", "admin", "customer", "student", "manager"]
        roles = [role for role in candidates if re.search(rf"\b{re.escape(role)}\b", text, re.I)]

    low = text.lower()
    no_auth = bool(re.search(r"authentication\s+is\s+not\s+required|authentication\s*:\s*not\s+required", low, re.I))
    auth_signals = bool(re.search(r"\bauthentication\b|\bauthorization\b|\bjwt\b|/auth/login|\brbac\b", low, re.I))
    auth_required = auth_signals and not no_auth
    signals = {
        "overlap": "overlap" in low,
        "inventory": any(x in low for x in ("stockquantity", "stock ledger", "available stock")),
        "payment": any(x in low for x in ("totalamount", "totalfee", "totalcost", "payment calculation")),
        "views": "ejs" in low or "model-view-controller" in low or "mvcr" in low,
        "atomic": "atomic" in low or "all writes or none" in low,
        "date_range": "date range" in low,
    }
    return {"models": models, "apis": apis, "roles": roles, "authRequired": auth_required, "signals": signals}
