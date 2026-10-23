"""Deterministic bill comparison unit and integration tests."""
from decimal import Decimal
import pytest
from app.services.comparison_service import comparison_service
from app.schemas.common import AppLanguage
from app.utils.numbers import calculate_amount_difference


def test_calculate_amount_difference_increase():
    diff, pct, status = calculate_amount_difference(Decimal("1240.00"), Decimal("980.00"))
    assert status == "increased"
    assert diff == Decimal("260.00")
    assert pct == Decimal("26.53")


def test_calculate_amount_difference_decrease():
    diff, pct, status = calculate_amount_difference(Decimal("800.00"), Decimal("1000.00"))
    assert status == "decreased"
    assert diff == Decimal("-200.00")
    assert pct == Decimal("-20.00")


def test_calculate_amount_difference_zero_previous():
    diff, pct, status = calculate_amount_difference(Decimal("500.00"), Decimal("0.00"))
    assert status == "increased"
    assert diff == Decimal("500.00")
    assert pct is None  # Mathematically undefined, never divide by zero


def test_calculate_amount_difference_none():
    diff, pct, status = calculate_amount_difference(None, Decimal("100.00"))
    assert diff is None
    assert pct is None
    assert status == "uncertain"


def test_comparison_service_full_deterministic_flow():
    curr_doc = {
        "id": "curr_1",
        "fields": [
            {"key": "amount_due", "normalized_value": 1240.0, "unit": "INR"},
            {"key": "consumption", "normalized_value": 205.0, "unit": "kWh"},
            {"key": "due_date", "normalized_value": "2026-11-12"},
            {"key": "billing_period", "normalized_value": {"start": "2026-09-01", "end": "2026-09-30"}},
            {"key": "line_item_0", "label": "Energy Charges", "normalized_value": 820.0},
        ],
    }
    prev_doc = {
        "id": "prev_1",
        "fields": [
            {"key": "amount_due", "normalized_value": 980.0, "unit": "INR"},
            {"key": "consumption", "normalized_value": 180.0, "unit": "kWh"},
            {"key": "due_date", "normalized_value": "2026-10-12"},
            {"key": "billing_period", "normalized_value": {"start": "2026-08-01", "end": "2026-08-31"}},
            {"key": "line_item_0", "label": "Energy Charges", "normalized_value": 640.0},
        ],
    }

    res = comparison_service.compare_bills(curr_doc, prev_doc, AppLanguage.EN)
    assert res.amount.difference == 260.0
    assert res.amount.percentage_change == 26.53
    assert res.amount.status == "increased"
    assert res.consumption.comparable is True
    assert res.consumption.difference == 25.0
    assert res.consumption.status == "increased"
    assert res.due_date.status == "changed"
    # Never claim overcharged in interpretation
    assert "overcharged" not in res.interpretation.lower()
    assert "show what changed" in res.interpretation.lower()


def test_comparison_service_different_units_warning():
    curr_doc = {
        "id": "curr_2",
        "fields": [
            {"key": "amount_due", "normalized_value": 1500.0},
            {"key": "consumption", "normalized_value": 50.0, "unit": "kL"},
        ],
    }
    prev_doc = {
        "id": "prev_2",
        "fields": [
            {"key": "amount_due", "normalized_value": 1200.0},
            {"key": "consumption", "normalized_value": 200.0, "unit": "kWh"},
        ],
    }

    res = comparison_service.compare_bills(curr_doc, prev_doc, AppLanguage.EN)
    assert res.consumption.comparable is False
    assert res.consumption.status == "not_comparable"
    assert any("units differ" in w.lower() for w in res.consumption.warnings)
