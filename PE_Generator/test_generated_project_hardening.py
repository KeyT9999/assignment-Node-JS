import json
import unittest

from generated_project_hardening import harden_generated_project


class GeneratedProjectHardeningTests(unittest.TestCase):
    def test_adds_collection_and_collision_safe_dev_launcher(self):
        files = {
            "package.json": json.dumps({"scripts": {}, "dependencies": {}}),
            "server.js": "const app=require('express')();app.use('/orders',require('./routes/orderRoutes'));",
            "routes/orderRoutes.js": "const r=require('express').Router();r.post('/',()=>{});module.exports=r;",
        }
        config = {
            "project_name": "Demo",
            "exam_spec": {"models": [], "apis": [{"method": "GET", "path": "/orders"}]},
        }
        changes = harden_generated_project(files, config)
        collection = json.loads(files["Demo.postman_collection.json"])
        urls = [item["request"]["url"] for item in collection["item"]]
        package = json.loads(files["package.json"])

        self.assertIn("{{base_url}}/orders", urls)
        self.assertFalse(any("{{{{" in url for url in urls))
        self.assertEqual("nodemon utils/startDev.js", package["scripts"]["dev"])
        self.assertIn("Port ${preferred} is busy", files["utils/startDev.js"])
        self.assertTrue(changes)

    def test_merges_missing_routes_into_existing_collection(self):
        existing = {
            "info": {"name": "Demo", "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"},
            "variable": [],
            "item": [{"name": "List", "request": {"method": "GET", "url": "{{base_url}}/orders"}}],
        }
        files = {
            "package.json": json.dumps({"scripts": {}}),
            "server.js": "const app=require('express')();app.use('/orders',require('./routes/orderRoutes'));",
            "routes/orderRoutes.js": "const r=require('express').Router();r.get('/',()=>{});r.post('/',()=>{});module.exports=r;",
            "Demo.postman_collection.json": json.dumps(existing),
        }
        config = {"project_name": "Demo", "exam_spec": {"models": [], "apis": []}}
        harden_generated_project(files, config)
        merged = json.loads(files["Demo.postman_collection.json"])
        requests = list(item for group in merged["item"] for item in (group.get("item") or [group]))
        self.assertEqual(2, len(requests))


if __name__ == "__main__":
    unittest.main()
