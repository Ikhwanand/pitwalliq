import json
import logging
import sqlite3
from pathlib import Path
from typing import Any
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class DatasetCache:
    """Thread-safe persistent SQLite storage for normalized PitwallIQ F1 datasets.
    
    Provides sub-millisecond retrieval of pre-computed, normalized telemetry,
    preventing heavy FastF1 cold downloads on frontend requests.
    """

    def __init__(self, db_path: Path | None = None) -> None:
        self.db_path = db_path or (settings.BASE_DIR / "cache" / "pitwall_dataset.db")
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=15.0)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        return conn

    def _init_db(self) -> None:
        try:
            with self._get_connection() as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS dataset_entries (
                        cache_key TEXT PRIMARY KEY,
                        data_type TEXT NOT NULL,
                        season INTEGER NOT NULL,
                        round_number INTEGER NOT NULL,
                        session_name TEXT NOT NULL,
                        driver_number TEXT,
                        payload_json TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_season_round ON dataset_entries (season, round_number, session_name)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_data_type ON dataset_entries (data_type)")
                conn.commit()
            logger.info("PitwallIQ Dataset SQLite Cache verified at %s", self.db_path)
        except Exception as e:
            logger.error("Failed to initialize DatasetCache SQLite database: %s", e)

    def get(self, cache_key: str) -> Any | None:
        """Retrieve cached JSON payload by unique cache key."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT payload_json FROM dataset_entries WHERE cache_key = ?", (cache_key,))
                row = cursor.fetchone()
                if row and row[0]:
                    return json.loads(row[0])
        except Exception as e:
            logger.warning("DatasetCache get error for key %s: %s", cache_key, e)
        return None

    def set(
        self,
        cache_key: str,
        data_type: str,
        season: int,
        round_number: int,
        session_name: str,
        payload: Any,
        driver_number: str | None = None,
    ) -> bool:
        """Store or update normalized JSON payload in SQLite cache."""
        try:
            payload_str = json.dumps(payload, default=str)
            with self._get_connection() as conn:
                conn.execute(
                    """
                    INSERT INTO dataset_entries (cache_key, data_type, season, round_number, session_name, driver_number, payload_json, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(cache_key) DO UPDATE SET
                        payload_json = excluded.payload_json,
                        updated_at = CURRENT_TIMESTAMP
                    """,
                    (cache_key, data_type, season, round_number, session_name, driver_number, payload_str),
                )
                conn.commit()
            return True
        except Exception as e:
            logger.error("DatasetCache set error for key %s: %s", cache_key, e)
            return False

    # Specialized Helpers for PitwallIQ Telemetry Entities

    def get_events(self, season: int) -> list[dict] | None:
        key = f"events:{season}"
        return self.get(key)

    def set_events(self, season: int, events: list[dict]) -> bool:
        key = f"events:{season}"
        return self.set(key, "events", season, 0, "", events)

    def get_dashboard(self, season: int, round_number: int, session_name: str) -> dict | None:
        key = f"dashboard:{season}:{round_number}:{session_name.lower()}"
        return self.get(key)

    def set_dashboard(self, season: int, round_number: int, session_name: str, data: dict) -> bool:
        key = f"dashboard:{season}:{round_number}:{session_name.lower()}"
        return self.set(key, "dashboard", season, round_number, session_name, data)

    def get_track_map(self, season: int, round_number: int, session_name: str) -> dict | None:
        key = f"track_map:{season}:{round_number}:{session_name.lower()}"
        return self.get(key)

    def set_track_map(self, season: int, round_number: int, session_name: str, data: dict) -> bool:
        key = f"track_map:{season}:{round_number}:{session_name.lower()}"
        return self.set(key, "track_map", season, round_number, session_name, data)

    def get_driver_laps(
        self, season: int, round_number: int, session_name: str, driver_identifier: str
    ) -> list[dict] | None:
        key = f"laps:{season}:{round_number}:{session_name.lower()}:{str(driver_identifier).lower()}"
        return self.get(key)

    def set_driver_laps(
        self, season: int, round_number: int, session_name: str, driver_identifier: str, laps: list[dict]
    ) -> bool:
        key = f"laps:{season}:{round_number}:{session_name.lower()}:{str(driver_identifier).lower()}"
        return self.set(key, "laps", season, round_number, session_name, laps, str(driver_identifier))

    def get_ghost_telemetry(
        self, season: int, round_number: int, session_name: str, driver1: str, driver2: str
    ) -> dict | None:
        key = f"ghost:{season}:{round_number}:{session_name.lower()}:{str(driver1).lower()}:{str(driver2).lower()}"
        return self.get(key)

    def set_ghost_telemetry(
        self, season: int, round_number: int, session_name: str, driver1: str, driver2: str, data: dict
    ) -> bool:
        key = f"ghost:{season}:{round_number}:{session_name.lower()}:{str(driver1).lower()}:{str(driver2).lower()}"
        return self.set(key, "ghost", season, round_number, session_name, data, f"{driver1}_{driver2}")

    def get_stats(self) -> dict:
        """Return cache health, table counts, and database size."""
        stats = {
            "db_path": str(self.db_path),
            "file_size_kb": round(self.db_path.stat().st_size / 1024, 2) if self.db_path.exists() else 0,
            "total_entries": 0,
            "counts_by_type": {},
        }
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM dataset_entries")
                row = cursor.fetchone()
                stats["total_entries"] = row[0] if row else 0

                cursor.execute("SELECT data_type, COUNT(*) FROM dataset_entries GROUP BY data_type")
                for d_type, count in cursor.fetchall():
                    stats["counts_by_type"][d_type] = count
        except Exception as e:
            logger.warning("Could not read DatasetCache stats: %s", e)
        return stats


_default_cache: DatasetCache | None = None


def get_dataset_cache() -> DatasetCache:
    """Dependency / singleton provider for DatasetCache."""
    global _default_cache
    if _default_cache is None:
        _default_cache = DatasetCache()
    return _default_cache
