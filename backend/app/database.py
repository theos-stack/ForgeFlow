import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.config import MONGODB_DB_NAME, MONGODB_URI, OUTPUT_DIR

try:
    from pymongo import DESCENDING, MongoClient
except ImportError:  # pragma: no cover - lets the app run before optional install
    DESCENDING = None
    MongoClient = None


HISTORY_FILE = os.path.join(OUTPUT_DIR, "generation_history.json")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def serialize_datetime(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()


class HistoryStore:
    def __init__(self) -> None:
        self._client = None
        self._collection = None
        self._storage_warning = None

        if MONGODB_URI and MongoClient is None:
            self._storage_warning = "pymongo_not_installed"
            return

        if MONGODB_URI and MongoClient is not None:
            try:
                self._client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
                database = self._client[MONGODB_DB_NAME]
                self._collection = database["generation_events"]
                self._collection.create_index([("user_id", 1), ("created_at", DESCENDING)])
            except Exception as error:
                self._client = None
                self._collection = None
                self._storage_warning = error.__class__.__name__

    @property
    def using_mongo(self) -> bool:
        return self._collection is not None

    @property
    def storage_backend(self) -> str:
        return "mongodb" if self.using_mongo else "local_json"

    @property
    def storage_warning(self) -> Optional[str]:
        return self._storage_warning

    def save_generation(self, event: Dict[str, Any]) -> Dict[str, Any]:
        created_at = utc_now()
        record = {
            **event,
            "created_at": created_at,
        }

        if self._collection is not None:
            result = self._collection.insert_one(record)
            return self._serialize({**record, "id": str(result.inserted_id)})

        os.makedirs(OUTPUT_DIR, exist_ok=True)
        records = self._read_local_records()
        local_record = {
            **record,
            "id": f"local-{len(records) + 1}",
            "created_at": serialize_datetime(created_at),
        }
        records.append(local_record)
        self._write_local_records(records)
        return local_record

    def list_generations(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        if self._collection is not None:
            cursor = (
                self._collection.find({"user_id": user_id})
                .sort("created_at", DESCENDING)
                .limit(max(1, min(limit, 100)))
            )
            return [self._serialize(record) for record in cursor]

        records = [
            record
            for record in self._read_local_records()
            if record.get("user_id") == user_id
        ]
        return sorted(records, key=lambda record: record.get("created_at", ""), reverse=True)[:limit]

    def _read_local_records(self) -> List[Dict[str, Any]]:
        if not os.path.exists(HISTORY_FILE):
            return []

        with open(HISTORY_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

        return data if isinstance(data, list) else []

    def _write_local_records(self, records: List[Dict[str, Any]]) -> None:
        with open(HISTORY_FILE, "w", encoding="utf-8") as file:
            json.dump(records, file, indent=2)

    def _serialize(self, record: Dict[str, Any]) -> Dict[str, Any]:
        clean = dict(record)
        if "_id" in clean:
            clean["id"] = str(clean.pop("_id"))
        if isinstance(clean.get("created_at"), datetime):
            clean["created_at"] = serialize_datetime(clean["created_at"])
        return clean


history_store: Optional[HistoryStore] = None


def get_history_store() -> HistoryStore:
    global history_store
    if history_store is None:
        history_store = HistoryStore()
    return history_store
