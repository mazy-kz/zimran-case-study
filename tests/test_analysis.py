import unittest
from pathlib import Path

from src.analysis import add_features, audit_data, load_click_data, summarize_campaigns


class AnalysisTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        data = add_features(load_click_data(Path("data/raw/zimran_source.xlsx")))
        cls.audit = audit_data(data)
        cls.metrics = summarize_campaigns(data)

    def test_source_data_integrity(self):
        self.assertEqual(self.audit.rows, 14_966)
        self.assertEqual(self.audit.duplicate_click_ids, 0)
        self.assertEqual(self.audit.duplicate_profile_ids, 0)
        self.assertEqual(self.audit.invalid_registered_demographics, 0)
        self.assertEqual(self.audit.unknown_partner_rows, 0)

    def test_campaign_counts(self):
        self.assertEqual(
            self.metrics["clicks"].to_dict(),
            {"1_desktop": 3_467, "1_mobile": 4_020, "2_cpc": 7_479},
        )
        self.assertEqual(
            self.metrics["registrations"].to_dict(),
            {"1_desktop": 353, "1_mobile": 333, "2_cpc": 1_127},
        )
        self.assertEqual(
            self.metrics["leads"].to_dict(),
            {"1_desktop": 326, "1_mobile": 317, "2_cpc": 911},
        )

    def test_roi_reconciles_to_expected_values(self):
        self.assertAlmostEqual(self.metrics.loc["1_desktop", "client_roi"], -0.1112, delta=0.0002)
        self.assertAlmostEqual(self.metrics.loc["1_mobile", "client_roi"], 1.1730, delta=0.0002)
        self.assertAlmostEqual(self.metrics.loc["2_cpc", "client_roi"], 0.0242, delta=0.0002)
        self.assertAlmostEqual(self.metrics.loc["1_desktop", "partner_roi"], 0.1084, delta=0.0002)
        self.assertAlmostEqual(self.metrics.loc["1_mobile", "partner_roi"], -0.2112, delta=0.0002)
        self.assertAlmostEqual(self.metrics.loc["2_cpc", "partner_roi"], 0.4348, delta=0.0002)


if __name__ == "__main__":
    unittest.main()
