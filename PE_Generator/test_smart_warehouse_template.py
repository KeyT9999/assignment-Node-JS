import unittest
from pathlib import Path


TEMPLATE_DIR = Path(__file__).parent / "templates" / "smart_warehouse"


class SmartWarehouseTemplateTests(unittest.TestCase):
    def test_postman_guide_contains_all_detailed_cases(self):
        guide = (TEMPLATE_DIR / "POSTMAN_GUIDE.md").read_text(encoding="utf-8")
        headings = [line for line in guide.splitlines() if line.startswith("### Test ")]
        self.assertEqual(21, len(headings))
        for number in range(1, 22):
            self.assertTrue(any(line.startswith(f"### Test {number} ") for line in headings))

    def test_seed_contains_deactivated_login_fixture(self):
        seed = (TEMPLATE_DIR / "utils" / "seedData.js").read_text(encoding="utf-8")
        self.assertIn("username:'deactivated1'", seed)
        self.assertIn("isActive:false", seed)


if __name__ == "__main__":
    unittest.main()
