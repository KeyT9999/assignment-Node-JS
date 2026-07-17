import json
import unittest

from postman_guide_generator import generate_detailed_postman_guide


class PostmanGuideGeneratorTests(unittest.TestCase):
    def test_renders_nested_requests_body_variables_and_status(self):
        collection = {
            "variable": [{"key": "base_url", "value": "http://localhost:9999"}, {"key": "token", "value": ""}],
            "item": [{"name": "Auth", "item": [{
                "name": "Login",
                "request": {
                    "method": "POST",
                    "header": [{"key": "Content-Type", "value": "application/json"}],
                    "body": {"mode": "raw", "raw": json.dumps({"username": "admin1"})},
                    "url": "{{base_url}}/auth/login",
                },
                "event": [{"script": {"exec": ["pm.collectionVariables.set('token', pm.response.json().token)"]}}],
            }, {
                "name": "Duplicate - expect 409",
                "request": {"method": "POST", "url": "{{base_url}}/items"},
            }]}],
        }
        guide = generate_detailed_postman_guide(collection, "Demo")
        self.assertIn("Có **2 test cases**", guide)
        self.assertIn("### Test 1 — Login", guide)
        self.assertIn('"username": "admin1"', guide)
        self.assertIn("Script sau response tự lưu: `token`", guide)
        self.assertIn("HTTP `409`", guide)


if __name__ == "__main__":
    unittest.main()
