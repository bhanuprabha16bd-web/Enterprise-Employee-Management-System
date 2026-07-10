import unittest
from app.controllers.skills_certification_controller import validate_skill_payload, validate_certification_payload


class SkillsCertificationValidationTests(unittest.TestCase):
    def test_skill_validation_rejects_duplicate_names(self):
        existing = [{"name": "Python"}]
        with self.assertRaises(ValueError):
            validate_skill_payload({"name": "Python", "proficiency_level": "Advanced", "years_experience": 3}, existing)

    def test_skill_validation_requires_name_and_positive_experience(self):
        with self.assertRaises(ValueError):
            validate_skill_payload({"name": "", "years_experience": -1}, [])

    def test_certification_validation_rejects_invalid_date_range(self):
        with self.assertRaises(ValueError):
            validate_certification_payload({
                "name": "AWS",
                "issuing_organization": "Amazon",
                "issue_date": "2024-12-01",
                "expiry_date": "2024-11-01"
            }, [])

    def test_certification_validation_rejects_duplicate_name_and_issuer(self):
        existing = [{"name": "AWS", "issuing_organization": "Amazon"}]
        with self.assertRaises(ValueError):
            validate_certification_payload({
                "name": "AWS",
                "issuing_organization": "Amazon"
            }, existing)


if __name__ == "__main__":
    unittest.main()
