"""Bill comparisons repository scoped to session owner_id."""
from __future__ import annotations
from typing import Optional, List, Dict, Any
from app.repositories.mongo import db_manager


class BillComparisonsRepository:
    def _collection(self):
        return db_manager.get_collection("bill_comparisons")

    async def insert_comparison(self, comp_data: Dict[str, Any]) -> str:
        cid = str(comp_data.get("comparison_id") or comp_data.get("_id"))
        comp_data["_id"] = cid
        await self._collection().insert_one(comp_data)
        return cid

    async def get_comparison(self, comparison_id: str, owner_id: str) -> Optional[Dict[str, Any]]:
        return await self._collection().find_one({"_id": comparison_id, "owner_id": owner_id})

    async def list_comparisons(self, owner_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        cursor = self._collection().find({"owner_id": owner_id}).limit(limit)
        return await cursor.to_list(length=limit)


bill_comparisons_repo = BillComparisonsRepository()
