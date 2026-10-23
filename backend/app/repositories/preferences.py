"""Preferences repository scoped to user/session owner_id."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.repositories.mongo import db_manager


class PreferencesRepository:
    def _collection(self):
        return db_manager.get_collection("preferences")

    async def get_preference(self, owner_id: str) -> Optional[Dict[str, Any]]:
        return await self._collection().find_one({"_id": owner_id})

    async def set_language(self, owner_id: str, language: str) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        await self._collection().update_one(
            {"_id": owner_id},
            {"$set": {"language": language, "updated_at": now}},
            upsert=True,
        )
        return {"language": language, "updated_at": now}


preferences_repo = PreferencesRepository()
