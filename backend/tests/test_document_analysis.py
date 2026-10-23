"""End-to-end integration tests for document analysis with BillSaathi and ProofPath."""
import pytest
from tests.conftest import get_client
from app.fixtures_generator import get_fixture_image_bytes


@pytest.mark.asyncio
async def test_analyze_electricity_bill_flow():
    async with get_client() as client:
        img_bytes = get_fixture_image_bytes("demo-electricity-current")
        assert img_bytes is not None

        headers = {"X-Session-ID": "test_session_bill_flow"}
        files = {"file": ("demo_bill.jpg", img_bytes, "image/jpeg")}
        data = {
            "workflow": "bill",
            "language": "en",
            "consent_to_ai_processing": "true",
        }

        res = await client.post("/api/v1/documents/analyze", data=data, files=files, headers=headers)
        assert res.status_code == 200
        result = res.json()
        assert result["workflow"] == "bill"
        assert result["document_type"] == "electricity_bill"
        assert len(result["fields"]) > 0

        # Check amount due field exists
        amt_field = next((f for f in result["fields"] if f["key"] == "amount_due"), None)
        assert amt_field is not None
        assert amt_field["normalized_value"] == 1240.0
        assert "₹1,240.00" in amt_field["source_text"]


@pytest.mark.asyncio
async def test_analyze_pension_notice_flow():
    async with get_client() as client:
        img_bytes = get_fixture_image_bytes("demo-pension-notice")
        assert img_bytes is not None

        headers = {"X-Session-ID": "test_session_doc_flow"}
        files = {"file": ("demo_notice.jpg", img_bytes, "image/jpeg")}
        data = {
            "workflow": "document",
            "language": "en",
            "consent_to_ai_processing": "true",
        }

        res = await client.post("/api/v1/documents/analyze", data=data, files=files, headers=headers)
        assert res.status_code == 200
        result = res.json()
        assert result["workflow"] == "document"
        assert result["document_type"] == "pension_notice"
        assert len(result["actions"]) > 0

        # Verify action item was persisted
        actions_res = await client.get("/api/v1/actions", headers=headers)
        assert actions_res.status_code == 200
        actions = actions_res.json()
        assert len(actions) > 0
        assert "Life Certificate" in actions[0]["title"]


@pytest.mark.asyncio
async def test_bill_comparison_flow():
    async with get_client() as client:
        headers = {"X-Session-ID": "test_session_comparison_flow"}

        # 1. Upload Current Bill
        img_curr = get_fixture_image_bytes("demo-electricity-current")
        files_curr = {"file": ("curr.jpg", img_curr, "image/jpeg")}
        data_curr = {"workflow": "bill", "language": "en", "consent_to_ai_processing": "true"}
        res_curr = await client.post("/api/v1/documents/analyze", data=data_curr, files=files_curr, headers=headers)
        assert res_curr.status_code == 200
        curr_id = res_curr.json()["document_id"]

        # 2. Upload Previous Bill
        img_prev = get_fixture_image_bytes("demo-electricity-previous")
        files_prev = {"file": ("prev.jpg", img_prev, "image/jpeg")}
        data_prev = {"workflow": "bill", "language": "en", "consent_to_ai_processing": "true"}
        res_prev = await client.post("/api/v1/documents/analyze", data=data_prev, files=files_prev, headers=headers)
        assert res_prev.status_code == 200
        prev_id = res_prev.json()["document_id"]

        # 3. Compare Bills
        comp_payload = {
            "current_document_id": curr_id,
            "previous_document_id": prev_id,
            "language": "en",
        }
        res_comp = await client.post("/api/v1/bills/compare", json=comp_payload, headers=headers)
        assert res_comp.status_code == 200
        comp_result = res_comp.json()
        assert comp_result["amount"]["difference"] is not None
        assert "increase" in comp_result["interpretation"].lower()
