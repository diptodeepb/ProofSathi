"""Test ProofPath action items lifecycle and verification."""
import pytest
from tests.conftest import get_client


@pytest.mark.asyncio
async def test_action_item_lifecycle():
    async with get_client() as client:
        headers = {"X-Session-ID": "test_session_user_42"}

        # 1. Create action
        create_payload = {
            "title": "Submit Life Certificate to bank",
            "description": "Carry original PPO book",
            "due_date": "2026-11-30",
            "status": "pending",
            "source_text": "Please submit by 30th November 2026",
        }
        res = await client.post("/api/v1/actions", json=create_payload, headers=headers)
        assert res.status_code == 200
        created = res.json()
        action_id = created["id"]
        assert created["status"] == "pending"
        assert created["needs_confirmation"] is False

        # 2. Update status to completed
        patch_payload = {"status": "completed"}
        patch_res = await client.patch(f"/api/v1/actions/{action_id}", json=patch_payload, headers=headers)
        assert patch_res.status_code == 200
        updated = patch_res.json()
        assert updated["status"] == "completed"

        # 3. List actions
        list_res = await client.get("/api/v1/actions", headers=headers)
        assert list_res.status_code == 200
        items = list_res.json()
        assert any(i["id"] == action_id and i["status"] == "completed" for i in items)

        # 4. Another session cannot access this action
        other_headers = {"X-Session-ID": "test_session_stranger_99"}
        fail_patch = await client.patch(f"/api/v1/actions/{action_id}", json=patch_payload, headers=other_headers)
        assert fail_patch.status_code == 404
