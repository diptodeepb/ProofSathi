"""Deterministic bill comparison service using Python Decimal arithmetic."""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Any, List, Optional

from app.schemas.common import AppLanguage
from app.schemas.bill import (
    AmountComparison,
    ConsumptionComparison,
    DueDateComparison,
    LineItemDiff,
    BillComparisonResponse,
)
from app.utils.numbers import (
    to_decimal,
    calculate_amount_difference,
    normalize_consumption_unit,
)
from app.utils.dates import calculate_period_days


class BillComparisonService:
    @staticmethod
    def compare_bills(
        current_doc: Dict[str, Any],
        previous_doc: Dict[str, Any],
        language: AppLanguage = AppLanguage.EN,
    ) -> BillComparisonResponse:
        """
        Deterministically compare two bills.
        Neither amounts nor percentages are calculated by the LLM.
        """
        warnings: List[str] = []

        # 1. Extract fields by key helper
        def get_field(doc: Dict[str, Any], key: str) -> Optional[Dict[str, Any]]:
            fields = doc.get("fields", [])
            for f in fields:
                if isinstance(f, dict) and f.get("key") == key:
                    return f
            return None

        # 2. Amount Due Comparison
        curr_amt_field = get_field(current_doc, "amount_due")
        prev_amt_field = get_field(previous_doc, "amount_due")

        curr_amt_dec = to_decimal(curr_amt_field.get("normalized_value") if curr_amt_field else None)
        prev_amt_dec = to_decimal(prev_amt_field.get("normalized_value") if prev_amt_field else None)

        diff_amt, pct_change, amt_status = calculate_amount_difference(curr_amt_dec, prev_amt_dec)

        if curr_amt_dec is None or prev_amt_dec is None:
            warnings.append("Could not compare amounts: one or both bills are missing a verified amount payable.")
        elif prev_amt_dec == Decimal("0.00"):
            warnings.append("Previous bill amount was ₹0.00; percentage change is mathematically undefined.")

        amount_comp = AmountComparison(
            previous=float(prev_amt_dec) if prev_amt_dec is not None else None,
            current=float(curr_amt_dec) if curr_amt_dec is not None else None,
            difference=float(diff_amt) if diff_amt is not None else None,
            percentage_change=float(pct_change) if pct_change is not None else None,
            status=amt_status,
            currency="INR",
        )

        # 3. Consumption Comparison
        curr_cons_field = get_field(current_doc, "consumption")
        prev_cons_field = get_field(previous_doc, "consumption")

        cons_comp_warnings: List[str] = []
        curr_cons_val = curr_cons_field.get("normalized_value") if curr_cons_field else None
        prev_cons_val = prev_cons_field.get("normalized_value") if prev_cons_field else None
        curr_unit = normalize_consumption_unit(curr_cons_field.get("unit") if curr_cons_field else None)
        prev_unit = normalize_consumption_unit(prev_cons_field.get("unit") if prev_cons_field else None)

        comparable_cons = False
        cons_diff = None
        cons_status = "not_comparable"

        if curr_cons_val is not None and prev_cons_val is not None:
            if curr_unit and prev_unit and curr_unit.lower() == prev_unit.lower():
                comparable_cons = True
                try:
                    c_dec = Decimal(str(curr_cons_val))
                    p_dec = Decimal(str(prev_cons_val))
                    diff_c = c_dec - p_dec
                    cons_diff = float(diff_c)
                    if diff_c > 0:
                        cons_status = "increased"
                    elif diff_c < 0:
                        cons_status = "decreased"
                    else:
                        cons_status = "unchanged"
                except Exception:
                    cons_comp_warnings.append("Error calculating consumption difference.")
            else:
                cons_comp_warnings.append(
                    f"Consumption units differ or are not recognized ('{curr_unit}' vs '{prev_unit}'); direct comparison omitted."
                )
        else:
            cons_comp_warnings.append("One or both bills do not record a readable consumption figure.")

        consumption_comp = ConsumptionComparison(
            previous=float(prev_cons_val) if prev_cons_val is not None else None,
            current=float(curr_cons_val) if curr_cons_val is not None else None,
            difference=cons_diff,
            unit=curr_unit or prev_unit,
            status=cons_status,
            comparable=comparable_cons,
            warnings=cons_comp_warnings,
        )

        # 4. Due Date Comparison
        curr_due_field = get_field(current_doc, "due_date")
        prev_due_field = get_field(previous_doc, "due_date")

        curr_due = curr_due_field.get("normalized_value") if curr_due_field else None
        prev_due = prev_due_field.get("normalized_value") if prev_due_field else None

        due_status = "uncertain"
        if curr_due and prev_due:
            due_status = "same" if curr_due == prev_due else "changed"
        elif curr_due or prev_due:
            due_status = "changed"

        due_date_comp = DueDateComparison(
            previous=str(prev_due) if prev_due else None,
            current=str(curr_due) if curr_due else None,
            status=due_status,
        )

        # 5. Billing Period Check (e.g. 28 days vs 35 days)
        curr_period = get_field(current_doc, "billing_period")
        prev_period = get_field(previous_doc, "billing_period")
        if curr_period and prev_period:
            c_norm = curr_period.get("normalized_value") or {}
            p_norm = prev_period.get("normalized_value") or {}
            if isinstance(c_norm, dict) and isinstance(p_norm, dict):
                c_start, c_end = c_norm.get("start"), c_norm.get("end")
                p_start, p_end = p_norm.get("start"), p_norm.get("end")
                if c_start and c_end and p_start and p_end:
                    c_days = calculate_period_days(c_start, c_end)
                    p_days = calculate_period_days(p_start, p_end)
                    if c_days and p_days and abs(c_days - p_days) > 3:
                        warnings.append(
                            f"Billing periods differ in length ({c_days} days current vs {p_days} days earlier), which naturally affects usage totals."
                        )

        # 6. Line Item Comparison
        line_item_diffs: List[LineItemDiff] = []
        curr_line_items = [f for f in current_doc.get("fields", []) if f.get("key", "").startswith("line_item_")]
        prev_line_items = [f for f in previous_doc.get("fields", []) if f.get("key", "").startswith("line_item_")]

        curr_map = {item.get("label", "").lower().strip(): item for item in curr_line_items}
        prev_map = {item.get("label", "").lower().strip(): item for item in prev_line_items}

        for label, curr_item in curr_map.items():
            prev_item = prev_map.get(label)
            c_val = curr_item.get("normalized_value")
            p_val = prev_item.get("normalized_value") if prev_item else None
            status = "same"
            if prev_item is None:
                status = "added"
            elif c_val != p_val:
                status = "changed"
            line_item_diffs.append(
                LineItemDiff(
                    label=curr_item.get("label", label),
                    current_amount=c_val,
                    previous_amount=p_val,
                    status=status,
                )
            )

        for label, prev_item in prev_map.items():
            if label not in curr_map:
                line_item_diffs.append(
                    LineItemDiff(
                        label=prev_item.get("label", label),
                        current_amount=None,
                        previous_amount=prev_item.get("normalized_value"),
                        status="removed",
                    )
                )

        # 7. Generate Honest, Grounded Interpretation
        interpretation = BillComparisonService._generate_interpretation(
            amount_comp, consumption_comp, language
        )

        return BillComparisonResponse(
            comparison_id=f"comp_{uuid.uuid4().hex[:12]}",
            current_document_id=str(current_doc.get("id") or current_doc.get("_id") or ""),
            previous_document_id=str(previous_doc.get("id") or previous_doc.get("_id") or ""),
            amount=amount_comp,
            consumption=consumption_comp,
            due_date=due_date_comp,
            line_item_diffs=line_item_diffs,
            interpretation=interpretation,
            warnings=warnings,
            created_at=datetime.now(timezone.utc).isoformat(),
        )

    @staticmethod
    def _generate_interpretation(
        amount: AmountComparison,
        consumption: ConsumptionComparison,
        language: AppLanguage,
    ) -> str:
        """Construct grounded, safe interpretation without claiming fraud or error."""
        if language == AppLanguage.BN:
            if amount.difference is not None:
                action_word = "বেড়েছে" if amount.status == "increased" else ("কমেছে" if amount.status == "decreased" else "অপরিবর্তিত রয়েছে")
                amt_text = f"আপনার বর্তমান বিলে আগের চেয়ে ₹{abs(amount.difference):,.2f} {action_word}"
                if amount.percentage_change is not None:
                    amt_text += f" (প্রায় {abs(amount.percentage_change):.1f}%)"
                amt_text += "।"
            else:
                amt_text = "বিল দুটির টাকার পরিমাণের সরাসরি তুলনা করা সম্ভব হয়নি।"

            if consumption.comparable and consumption.difference is not None:
                c_action = "বেশি" if consumption.status == "increased" else ("কম" if consumption.status == "decreased" else "একই")
                cons_text = f" বিদ্যুৎ ব্যবহারের পরিমাণ আগের তুলনায় {abs(consumption.difference)} {consumption.unit or 'kWh'} {c_action} রেকর্ড করা হয়েছে।"
            else:
                cons_text = ""

            disclaimer = " এই পরিবর্তনগুলো নথির রেকর্ড নির্দেশ করে, তবে কী কারণে পরিবর্তন ঘটেছে তা বিলের উপর ভিত্তি করে নিশ্চিত করে বলা যায় না।"
            return amt_text + cons_text + disclaimer

        elif language == AppLanguage.HI:
            if amount.difference is not None:
                action_word = "बढ़ा है" if amount.status == "increased" else ("घटा है" if amount.status == "decreased" else "समान रहा है")
                amt_text = f"आपके वर्तमान बिल की राशि पिछले बिल की तुलना में ₹{abs(amount.difference):,.2f} {action_word}"
                if amount.percentage_change is not None:
                    amt_text += f" (लगभग {abs(amount.percentage_change):.1f}%)"
                amt_text += "।"
            else:
                amt_text = "बिलों की देय राशि की सीधे तुलना नहीं की जा सकी।"

            if consumption.comparable and consumption.difference is not None:
                c_action = "अधिक" if consumption.status == "increased" else ("कम" if consumption.status == "decreased" else "बराबर")
                cons_text = f" बिजली की खपत में पिछले बिल से {abs(consumption.difference)} {consumption.unit or 'kWh'} {c_action} दर्ज हुई है।"
            else:
                cons_text = ""

            disclaimer = " यह आंकड़े केवल दर्ज किए गए बदलाव को दर्शाते हैं। बदलाव का सटीक कारण केवल इस अंतर से निर्धारित नहीं किया जा सकता।"
            return amt_text + cons_text + disclaimer

        else:
            if amount.difference is not None:
                action_word = "increase" if amount.status == "increased" else ("decrease" if amount.status == "decreased" else "no change")
                pct_str = f" (about {abs(amount.percentage_change):.1f}%)" if amount.percentage_change is not None else ""
                amt_text = f"Your current bill shows a total due of ₹{amount.current:,.2f} compared with ₹{amount.previous:,.2f} earlier. That is an {action_word} of ₹{abs(amount.difference):,.2f}{pct_str}."
            else:
                amt_text = "Amounts between the two bills could not be conclusively compared."

            if consumption.comparable and consumption.difference is not None:
                cons_text = f" Recorded consumption changed by {consumption.difference:+.1f} {consumption.unit or 'kWh'}."
            else:
                cons_text = ""

            disclaimer = " These figures show what changed, but they do not by themselves explain why the total increased or decreased."
            return amt_text + cons_text + disclaimer


comparison_service = BillComparisonService()
