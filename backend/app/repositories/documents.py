"""Documents repository scoped to session owner_id."""
from __future__ import annotations
from typing import Optional, List, Dict, Any
from app.repositories.mongo import db_manager


class DocumentsRepository:
    def _collection(self):
        return db_manager.get_collection("documents")

    async def insert_document(self, doc_data: Dict[str, Any]) -> str:
        doc_id = str(doc_data.get("id") or doc_data.get("_id"))
        doc_data["_id"] = doc_id
        await self._collection().insert_one(doc_data)
        return doc_id

    async def get_document(self, document_id: str, owner_id: str) -> Optional[Dict[str, Any]]:
        # Verification of owner_id to prevent guessing IDs
        return await self._collection().find_one({"_id": document_id, "owner_id": owner_id})

    async def list_documents(
        self, owner_id: str, workflow: Optional[str] = None, limit: int = 20
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"owner_id": owner_id}
        if workflow:
            query["workflow"] = workflow
        cursor = self._collection().find(query).limit(limit)
        return await cursor.to_list(length=limit)

    async def delete_document(self, document_id: str, owner_id: str) -> bool:
        res = await self._collection().delete_one({"_id": document_id, "owner_id": owner_id})
        return getattr(res, "deleted_count", 0) > 0


documents_repo = DocumentsRepository()
