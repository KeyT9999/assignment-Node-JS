"""Generic fallback generator used only when no verified domain template matches.
Adds standard JWT Authentication and bcrypt hashing by default to pass core SDN302 requirements.
"""
import json
import os
import re


def _js_value(value, field_type):
    if value is None:
        return None
    low = str(value).lower()
    if low in ("true", "false", "null"):
        return low
    if low in ("now", "date.now"):
        return "Date.now"
    if field_type == "Number" and re.fullmatch(r"-?\d+(?:\.\d+)?", str(value)):
        return str(value)
    return json.dumps(value)


def _model_code(model):
    is_user_model = model["name"].lower() in ("user", "student", "customer")
    lines = ["const mongoose = require('mongoose');"]
    if is_user_model:
        lines.append("const bcrypt = require('bcryptjs');")
    lines.extend(["", "const schema = new mongoose.Schema({"])
    for field in model["fields"]:
        if field["type"] == "ObjectId":
            js_type = "mongoose.Schema.Types.ObjectId"
        elif field["type"] == "[String]":
            js_type = "[String]"
        else:
            js_type = field["type"]
        options = [f"type: {js_type}"]
        if field.get("required"):
            options.append("required: true")
        if field.get("unique"):
            options.append("unique: true")
        if field.get("ref"):
            options.append(f"ref: {json.dumps(field['ref'])}")
        if field.get("enum"):
            options.append(f"enum: {json.dumps(field['enum'])}")
        default = _js_value(field.get("default"), field["type"])
        if default is not None:
            options.append(f"default: {default}")
        lines.append(f"  {field['name']}: {{ {', '.join(options)} }},")
    lines.append("});")
    if is_user_model:
        lines.extend([
            "",
            "schema.pre('save', async function(next) {",
            "  if (!this.isModified('password')) return next();",
            "  const salt = await bcrypt.genSalt(10);",
            "  this.password = await bcrypt.hash(this.password, salt);",
            "  next();",
            "});",
            "",
            "schema.methods.comparePassword = async function(enteredPassword) {",
            "  return await bcrypt.compare(enteredPassword, this.password);",
            "};"
        ])
    lines.extend(["", f"module.exports = mongoose.model('{model['className']}', schema);", ""])
    return "\n".join(lines)


def _controller_code(model):
    cls = model["className"]
    return f"""const {cls} = require('../models/{model['name']}Model');

exports.list = async (_req, res) => {{ try {{ res.json(await {cls}.find()); }} catch (e) {{ res.status(500).json({{ message: e.message }}); }} }};
exports.create = async (req, res) => {{ try {{ res.status(201).json(await {cls}.create(req.body)); }} catch (e) {{ res.status(400).json({{ message: e.message }}); }} }};
exports.update = async (req, res) => {{ try {{ const item = await {cls}.findByIdAndUpdate(req.params.id || req.params.{model['name']}Id, req.body, {{ new: true, runValidators: true }}); return item ? res.json(item) : res.status(404).json({{ message: '{cls} not found' }}); }} catch (e) {{ res.status(400).json({{ message: e.message }}); }} }};
exports.remove = async (req, res) => {{ try {{ const item = await {cls}.findByIdAndDelete(req.params.id || req.params.{model['name']}Id); return item ? res.json({{ message: '{cls} deleted' }}) : res.status(404).json({{ message: '{cls} not found' }}); }} catch (e) {{ res.status(400).json({{ message: e.message }}); }} }};
"""


def _model_for_path(path, models):
    first = path.strip("/").split("/")[0].split("?")[0].lower()
    singular = first[:-1] if first.endswith("s") else first
    for model in models:
        name = model["name"].lower()
        if name == singular or name == first or first.startswith(name):
            return model
    return None


def generate_generic_project(config, spec, dry_run=False):
    project = config["project_name"]
    output_path = os.path.join(config["output_dir"], project)
    files = {}
    dependencies = {
        "dotenv": "^16.4.5",
        "express": "^4.19.2",
        "mongoose": "^8.2.1",
        "bcryptjs": "^2.4.3",
        "jsonwebtoken": "^9.0.2"
    }
    if spec["signals"].get("views"):
        dependencies["ejs"] = "^3.1.10"
    
    package = {
        "name": config["db_name"],
        "version": "1.0.0",
        "main": "server.js",
        "scripts": {"start": "node server.js", "dev": "nodemon server.js"},
        "dependencies": dependencies,
        "devDependencies": {"nodemon": "^3.1.0"}
    }
    files["package.json"] = json.dumps(package, indent=2)
    files[".env"] = f"PORT=9999\nMONGODB_URI=mongodb://127.0.0.1:27017/{config['db_name']}\nJWT_SECRET=replace_with_a_long_random_secret\n"
    files["config/db.js"] = "const mongoose=require('mongoose');module.exports=async()=>{try{await mongoose.connect(process.env.MONGODB_URI);console.log('MongoDB connected')}catch(e){console.error(e.message);process.exit(1)}};\n"
    files["exam_spec.json"] = json.dumps(spec, indent=2, ensure_ascii=False)

    # Detect user model
    has_user = any(m["name"].lower() in ("user", "student", "customer") for m in spec["models"])
    if not has_user:
        spec["models"].append({
            "name": "user",
            "className": "User",
            "fields": [
                {"name": "username", "type": "String", "required": True, "unique": True},
                {"name": "password", "type": "String", "required": True},
                {"name": "role", "type": "String", "default": "student", "enum": ["admin", "student", "customer"]},
                {"name": "createdAt", "type": "Date", "default": "now"}
            ]
        })

    user_model = next(m for m in spec["models"] if m["name"].lower() in ("user", "student", "customer"))
    user_name = user_model["name"]
    user_class = user_model["className"]

    for model in spec["models"]:
        files[f"models/{model['name']}Model.js"] = _model_code(model)
        files[f"controllers/{model['name']}Controller.js"] = _controller_code(model)

    files["controllers/authController.js"] = f"""const User = require('../models/{user_name}Model');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {{
  try {{
    const {{ username, password, role }} = req.body;
    if (await User.exists({{ username }})) {{
      return res.status(400).json({{ message: 'Username already exists' }});
    }}
    const user = await User.create({{
      username,
      password,
      role: role || 'student'
    }});
    res.status(201).json({{ id: user._id, username: user.username, role: user.role }});
  }} catch (error) {{
    res.status(500).json({{ message: error.message }});
  }}
}};

exports.login = async (req, res) => {{
  try {{
    const {{ username, password }} = req.body;
    const user = await User.findOne({{ username }});
    if (!user || !(await user.comparePassword(password))) {{
      return res.status(401).json({{ message: 'Invalid username or password' }});
    }}
    const token = jwt.sign(
      {{ id: user._id, username: user.username, role: user.role }},
      process.env.JWT_SECRET || 'replace_with_a_long_random_secret',
      {{ expiresIn: '1d' }}
    );
    res.json({{ token, user: {{ id: user._id, username: user.username, role: user.role }} }});
  }} catch (error) {{
    res.status(500).json({{ message: error.message }});
  }}
}};
"""

    files["routes/authRoutes.js"] = """const router = require('express').Router();
const controller = require('../controllers/authController');
router.post('/register', controller.register);
router.post('/login', controller.login);
module.exports = router;
"""

    files["middlewares/authMiddleware.js"] = """const jwt = require('jsonwebtoken');
exports.protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'replace_with_a_long_random_secret');
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
"""

    grouped = {}
    unsupported = []
    for api in spec["apis"]:
        model = _model_for_path(api["path"], spec["models"])
        if not model:
            unsupported.append(f"{api['method']} {api['path']}: no model mapping")
            continue
        method_map = {"GET": "list", "POST": "create", "PUT": "update", "PATCH": "update", "DELETE": "remove"}
        action = method_map[api["method"]]
        segments = [x for x in api["path"].split("/") if x]
        if any(not x.startswith(":") and x.lower() in ("book", "complete", "return", "transfer", "import", "export", "search") for x in segments[1:]):
            unsupported.append(f"{api['method']} {api['path']}: generated CRUD baseline; business rule needs a verified domain module")
        grouped.setdefault(model["name"], []).append((api, action))

    mounts = []
    mounts.append("app.use('/auth', require('./routes/authRoutes'));")

    for name, entries in grouped.items():
        if name == user_name:
            express_path_prefix = "/users"
        else:
            express_path_prefix = ""
        rows = ["const router=require('express').Router();", f"const controller=require('../controllers/{name}Controller');"]
        for api, action in entries:
            express_path = re.sub(r"^/", "", api["path"])
            if name == user_name and express_path.startswith("users"):
                express_path = re.sub(r"^users/?", "", express_path)
            rows.append(f"router.{api['method'].lower()}('/{express_path}', controller.{action});")
        rows.append("module.exports=router;")
        files[f"routes/{name}Routes.js"] = "\n".join(rows) + "\n"
        mounts.append(f"app.use('{express_path_prefix}',require('./routes/{name}Routes'));" )

    files["server.js"] = "\n".join(["require('dotenv').config();", "const express=require('express');", "const connectDB=require('./config/db');", "const app=express();app.use(express.json());connectDB();", *mounts, "app.get('/',(_q,s)=>s.json({message:'Generic PE API',status:'Running'}));", "app.use((q,s)=>s.status(404).json({message:`Route not found - ${q.originalUrl}`}));", "const PORT=process.env.PORT||9999;app.listen(PORT,()=>console.log(`Server running on ${PORT}`));", ""])

    coverage = ["# Generation coverage report", "", "No verified domain template matched. A conservative schema/CRUD baseline was generated with standard Authentication/RBAC support.", "", f"- Models parsed: {len(spec['models'])}", f"- APIs parsed: {len(spec['apis'])}", f"- Authentication requested: {spec['authRequired']}", f"- Roles found: {', '.join(spec['roles']) or 'none'}", "", "## Manual review required"]
    if spec["signals"].get("payment"):
        unsupported.append("Payment calculation detected; formula must be verified.")
    if spec["signals"].get("atomic"):
        unsupported.append("Atomic multi-document writes detected; MongoDB transaction design must be verified.")
    coverage.extend([f"- {item}" for item in unsupported] or ["- No special rule detected; still review generated validation."])
    files["GENERATION_REPORT.md"] = "\n".join(coverage) + "\n"

    files[".pe_generator_manifest.json"] = json.dumps(sorted(files.keys()) + [".pe_generator_manifest.json"], indent=2)
    if dry_run:
        return files, output_path, ["Generic dynamic fallback used"]
    os.makedirs(output_path, exist_ok=True)
    old_manifest = os.path.join(output_path, ".pe_generator_manifest.json")
    if os.path.isfile(old_manifest):
        try:
            with open(old_manifest, "r", encoding="utf-8") as fh:
                for relative in json.load(fh):
                    old_path = os.path.abspath(os.path.join(output_path, relative))
                    if os.path.commonpath([os.path.abspath(output_path), old_path]) == os.path.abspath(output_path) and os.path.isfile(old_path):
                        os.remove(old_path)
        except (OSError, ValueError, json.JSONDecodeError):
            pass
    for relative, content in files.items():
        target = os.path.join(output_path, relative); os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8") as fh: fh.write(content)
    return files, output_path, ["Generic dynamic fallback used; inspect GENERATION_REPORT.md"]
