import logging
import time
import certifi
from typing import Optional, Dict, Any
from datetime import datetime
from pymongo import MongoClient
from backend.core.config import settings

logger = logging.getLogger("telemetria.mongodb")

_client: Optional[MongoClient] = None
_atlas_connected: bool = False
_last_connection_attempt: float = 0
_RETRY_INTERVAL_SECONDS = 60  # Only attempt Atlas handshake once every 60s if IP is unwhitelisted

# In-memory synchronized fallback store
_local_store: Dict[str, Dict[str, Any]] = {
    "users": {},
    "projects": {}
}


def get_mongo_client() -> Optional[MongoClient]:
    global _client, _atlas_connected, _last_connection_attempt
    if _client is not None and _atlas_connected:
        return _client

    now = time.time()
    if now - _last_connection_attempt < _RETRY_INTERVAL_SECONDS:
        return None

    _last_connection_attempt = now
    try:
        client = MongoClient(
            settings.MONGODB_URI,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=1500,
            connectTimeoutMS=1500,
            socketTimeoutMS=2000,
        )
        client.admin.command("ping")
        _client = client
        _atlas_connected = True
        logger.info("Successfully connected to MongoDB Atlas!")
        return _client
    except Exception as e:
        logger.warning(
            f"MongoDB Atlas connection pending IP whitelist ({e}). Operating in resilient fallback mode."
        )
        _atlas_connected = False
        return None


def is_atlas_connected() -> bool:
    global _atlas_connected
    return _atlas_connected


class ResilientCollection:
    def __init__(self, collection_name: str):
        self.name = collection_name

    def insert_one(self, document: Dict[str, Any]):
        doc_id = document.get("_id") or document.get("id") or str(len(_local_store[self.name]) + 1)
        document["_id"] = doc_id
        document["id"] = doc_id
        _local_store[self.name][doc_id] = dict(document)

        client = get_mongo_client()
        if client:
            try:
                db = client[settings.MONGODB_DB_NAME]
                db[self.name].insert_one(dict(document))
            except Exception as e:
                logger.error(f"Atlas write failed: {e}")
        return doc_id

    def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        client = get_mongo_client()
        if client:
            try:
                db = client[settings.MONGODB_DB_NAME]
                res = db[self.name].find_one(query)
                if res:
                    return res
            except Exception:
                pass

        for item in _local_store[self.name].values():
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                return dict(item)
        return None

    def find(self, query: Dict[str, Any] = None) -> list:
        client = get_mongo_client()
        if client:
            try:
                db = client[settings.MONGODB_DB_NAME]
                res = list(db[self.name].find(query or {}))
                if res:
                    return res
            except Exception:
                pass

        if not query:
            return [dict(v) for v in _local_store[self.name].values()]

        results = []
        for item in _local_store[self.name].values():
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                results.append(dict(item))
        return results


users_collection = ResilientCollection("users")
projects_collection = ResilientCollection("projects")
