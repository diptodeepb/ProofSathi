"""Actions repository scoped to session owner_id."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.repositories.mongo import db_manager


class ActionsRepository:
    def _collection(self):
        return db_manager.get_collection("actions")

    async def insert_action(self, action_data: Dict[str, Any]) -> str:
        aid = str(action_data.get("id") or action_data.get("_id"))
        action_data["_id"] = aid
        await self._collection().insert_one(action_data)
        return aid

    async def get_action(self, action_id: str, owner_id: str) -> Optional[Dict[str, Any]]:
        return await self._collection().find_one({"_id": action_id, "owner_id": owner_id})

    async def update_action(self, action_id: str, owner_id: str, update_fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        res = await self._collection().update_one(
            {"_id": action_id, "owner_id": owner_id},
            {"$set": update_fields},
        )
        if getattr(res, "modified_count", 0) > 0 or getattr(res, "matched_count", 0) > 0:
            return await self.get_action(action_id, owner_id)
        return None

    async def list_actions(
        self, owner_id: str, document_id: Optional[str] = None, status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"owner_id": owner_id}
        if document_id:
            query["document_id"] = document_id
        if status:
            query["status"] = status
        cursor = self._collection().find(query)
        return await cursor.to_list(length=100)

    async def delete_action(self, action_id: str, owner_id: str) -> bool:
        res = await self._collection().delete_one({"_id": action_id, "owner_id": owner_id})
        return getattr(res, "deleted_count", 0) > 0


actions_repo = ActionsRepository()
