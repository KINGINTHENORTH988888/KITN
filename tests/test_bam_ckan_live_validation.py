import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import validate_bam_ckan_live as validator


class TestBamCkanLiveValidation(unittest.TestCase):
    def _sandbox(self, directory):
        root = Path(directory)
        sources = root / "sources.json"
        output = root / "bam-ckan-preview.json"
        sources.write_text(json.dumps([{
            "id": "bank_al_maghrib_ckan",
            "name": "Bank Al-Maghrib — CKAN",
        }]), encoding="utf-8")
        return sources, output

    def test_transient_catalogue_failure_retries_then_writes_unavailable_preview(self):
        with tempfile.TemporaryDirectory() as directory:
            sources, output = self._sandbox(directory)
            with (
                patch.object(validator, "SOURCES_FILE", sources),
                patch.object(validator, "OUTPUT_FILE", output),
                patch.object(validator, "collect_bank_al_maghrib_ckan", side_effect=TimeoutError("catalogue timeout")) as collect,
                patch.object(validator.time, "sleep") as sleep,
            ):
                result = validator.main()

            payload = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(result, 0)
            self.assertEqual(collect.call_count, 2)
            sleep.assert_called_once_with(5)
            self.assertEqual(payload["status"], "unavailable")
            self.assertEqual(payload["source_id"], "bank_al_maghrib_ckan")
            self.assertEqual(payload["indicators"], [])
            self.assertIn("timeout", payload["error"])

    def test_transient_failure_followed_by_success_produces_normal_preview(self):
        series = {
            "indicator_code": "BAM_TEST_SERIES",
            "unit_fr": "MDH",
            "dataset_name": "Dataset test",
            "history": [
                {"year": "2025", "value": 10},
                {"year": "2026", "value": 12},
            ],
            "latest": {"year": "2026", "value": 12},
        }
        raw_items = [{"statistics_series": series}]
        with tempfile.TemporaryDirectory() as directory:
            sources, output = self._sandbox(directory)
            with (
                patch.object(validator, "SOURCES_FILE", sources),
                patch.object(validator, "OUTPUT_FILE", output),
                patch.object(validator, "collect_bank_al_maghrib_ckan", side_effect=[TimeoutError("temporary timeout"), raw_items]) as collect,
                patch.object(validator, "_is_valid_statistics_series", return_value=True),
                patch.object(validator.time, "sleep"),
            ):
                result = validator.main()

            payload = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(result, 0)
            self.assertEqual(collect.call_count, 2)
            self.assertNotEqual(payload.get("status"), "unavailable")
            self.assertEqual(payload["summary"]["candidate_series"], 1)
            self.assertEqual(payload["summary"]["valid_series"], 1)
            self.assertEqual(payload["indicators"][0]["validation_status"], "valid")


if __name__ == "__main__":
    unittest.main()
