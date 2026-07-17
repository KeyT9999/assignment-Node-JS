import unittest

from js_formatter import format_javascript


class JavaScriptFormatterTests(unittest.TestCase):
    def test_preserves_router_factory_and_destructured_require(self):
        source = (
            "const r=require('express').Router(),"
            "c=require('../controllers/authController'),"
            "{verifyToken,requireRole}=require('../middleware/authMiddleware');"
            "r.post('/login',c.login);"
        )

        formatted = format_javascript(source)

        self.assertIn("require('express').Router()", formatted)
        self.assertIn("verifyToken", formatted)
        self.assertIn("requireRole", formatted)
        self.assertIn("require('../middleware/authMiddleware')", formatted)


if __name__ == '__main__':
    unittest.main()
