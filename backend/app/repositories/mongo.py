"""MongoDB client manager with graceful in-memory storage fallback."""
from __future__ import annotations
import logging
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

logger = logging.getLogger("proofsathi.mongo")


class MemoryCollection:
    """Thread-safe in-memory collection simulating basic MongoDB operations."""
    def __init__(self, name: str):
        self.name = name
        self._data: Dict[str, Dict[str, Any]] = {}

    async def insert_one(self, doc: Dict[str, Any]):
        doc_id = str(doc.get("_id") or doc.get("id"))
        self._data[doc_id] = dict(doc)
        return type("InsertResult", (), {"inserted_id": doc_id})()

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for d in self._data.values():
            match = True
            for k, v in query.items():
                if d.get(k) != v:
                    match = False
                    break
            if match:
                return dict(d)
        return None

    def find(self, query: Dict[str, Any]):
        results = []
        for d in self._data.values():
            match = True
            for k, v in query.items():
                if d.get(k) != v:
                    match = False
                    break
            if match:
                results.append(dict(d))
        results.sort(key=lambda x: x.get("created_at", ""), reverse=True)

        class Cursor:
            def __init__(self, items: List[Dict[str, Any]]):
                self._items = items
            def sort(self, *args, **kwargs):
                return self
            def limit(self, count: int):
                self._items = self._items[:count]
                return self
            async def to_list(self, length: Optional[int] = None):
                if length is not None:
                    return self._items[:length]
                return self._items
            def __aiter__(self):
                self._iter = iter(self._items)
                return self
            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration

        return Cursor(results)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        set_vals = update.get("$set", {})
        existing = await self.find_one(query)
        if existing:
            doc_id = str(existing.get("_id") or existing.get("id"))
            existing.update(set_vals)
            self._data[doc_id] = existing
            return type("UpdateResult", (), {"modified_count": 1})()
        elif upsert:
            new_doc = dict(query)
            new_doc.update(set_vals)
            if "_id" not in new_doc:
                new_doc["_id"] = query.get("_id", str(len(self._data) + 1))
            await self.insert_one(new_doc)
            return type("UpdateResult", (), {"modified_count": 1})()
        return type("UpdateResult", (), {"modified_count": 0})()

    async def delete_one(self, query: Dict[str, Any]):
        target = await self.find_one(query)
        if target:
            doc_id = str(target.get("_id") or target.get("id"))
            if doc_id in self._data:
                del self._data[doc_id]
                return type("DeleteResult", (), {"deleted_count": 1})()
        return type("DeleteResult", (), {"deleted_count": 0})()

    async def delete_many(self, query: Dict[str, Any]):
        to_del = []
        for doc_id, d in self._data.items():
            match = True
            for k, v in query.items():
                if d.get(k) != v:
                    match = False
                    break
            if match:
                to_del.append(doc_id)
        for doc_id in to_del:
            del self._data[doc_id]
        return type("DeleteResult", (), {"deleted_count": len(to_del)})()

    async def count_documents(self, query: Dict[str, Any]) -> int:
        c = 0
        for d in self._data.values():
            match = True
            for k, v in query.items():
                if d.get(k) != v:
                    match = False
                    break
            if match:
                c += 1
        return c


class DatabaseManager:
    def __init__(self):
        self._client: Optional[AsyncIOMotorClient] = None
        self._db: Optional[AsyncIOMotorDatabase] = None
        self._memory_collections: Dict[str, MemoryCollection] = {}

    def connect(self):
        if settings.mongodb_uri and settings.mongodb_uri.strip():
            try:
                self._client = AsyncIOMotorClient(
                    settings.mongodb_uri,
                    serverSelectionTimeoutMS=3000,
                )
                self._db = self._client[settings.mongodb_database]
                logger.info(f"Connected to MongoDB Atlas database: {settings.mongodb_database}")
            except Exception as e:
                logger.warning(f"Failed to connect to MongoDB Atlas, falling back to in-memory store: {e}")
                self._client = None
                self._db = None
        else:
            logger.info("MONGODB_URI not provided; utilizing in-memory repository store.")

    def close(self):
        if self._client:
            self._client.close()
            self._client = None

    def get_collection(self, name: str):
        if self._db is not None:
            return self._db[name]
        if name not in self._memory_collections:
            self._memory_collections[name] = MemoryCollection(name)
        return self._memory_collections[name]


db_manager = DatabaseManager()
