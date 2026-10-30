#!/usr/bin/env python3
"""
PitwallIQ Dataset Prefetcher CLI
================================
Pre-warms and stores normalized F1 session telemetry into the persistent SQLite dataset cache.

Usage:
  # Prefetch Season 2026 Round 1 (Australian GP) and Round 2 (Chinese GP):
  python -m backend.scripts.prefetch_dataset --season 2026 --rounds 1 2

  # Prefetch Season 2024 Rounds 1 to 3:
  python -m backend.scripts.prefetch_dataset --season 2024 --rounds 1 2 3

  # Inspect current SQLite cache size and entries:
  python -m backend.scripts.prefetch_dataset --stats
"""

import argparse
import asyncio
import logging
import sys
import time

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from backend.app.core.dataset_cache import get_dataset_cache
from backend.app.providers.fastf1_provider import FastF1Provider

# Configure terminal logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("prefetcher")


DEFAULT_TOP_DRIVERS = ["1", "16", "44", "63", "81", "4", "55", "12"]


async def prefetch_season_rounds(
    season: int,
    rounds: list[int] | None,
    all_rounds: bool = False,
    session_name: str = "Race",
    drivers: list[str] = DEFAULT_TOP_DRIVERS,
) -> None:
    provider = FastF1Provider()
    cache = get_dataset_cache()

    print("\n" + "=" * 65)
    print(f"🏁 PitwallIQ Dataset Prefetcher: Season {season} ({session_name})")
    print("=" * 65)

    # 1. Fetch & cache season calendar
    t0 = time.perf_counter()
    logger.info("Fetching Grand Prix event calendar for %d...", season)
    events = await provider.get_events(season)
    logger.info("Retrieved %d events in %.2fs", len(events), time.perf_counter() - t0)

    if not events:
        logger.error("No events found for season %d. Aborting.", season)
        return

    # Determine target rounds
    max_round = max(e.round_number for e in events)
    if all_rounds or not rounds:
        target_rounds = [e.round_number for e in events]
    else:
        target_rounds = [r for r in rounds if 1 <= r <= max_round]

    print(f"Targeting {len(target_rounds)} round(s): {target_rounds}\n")

    overall_start = time.perf_counter()

    for idx, r_num in enumerate(target_rounds, 1):
        ev = next((e for e in events if e.round_number == r_num), None)
        ev_title = ev.event_name if ev else f"Round {r_num}"
        ev_loc = f"{ev.location}, {ev.country}" if ev else "Circuit"

        print(f"[{idx}/{len(target_rounds)}] 🏎️  Season {season} Round {r_num}: {ev_title} ({ev_loc})")
        r_start = time.perf_counter()

        # Step A: Track Map
        try:
            tm_t0 = time.perf_counter()
            track_map = await provider.get_circuit_map(season, r_num, session_name)
            tm_pts = track_map.total_points if track_map else 0
            c_name = track_map.event_name if track_map else "Unknown"
            print(f"    ├─ Track Map: {c_name} ({tm_pts} points) [{(time.perf_counter() - tm_t0):.2f}s]")
        except Exception as e:
            print(f"    ├─ Track Map Error: {e}")

        # Step B: Dashboard & Classification
        dash_drivers = []
        try:
            dash_t0 = time.perf_counter()
            dash = await provider.get_session_dashboard(season, r_num, session_name)
            dash_laps = dash.total_laps if dash else 0
            cls_count = len(dash.classification) if dash and dash.classification else 0
            if dash and dash.classification:
                dash_drivers = [str(d.driver.driver_number) for d in dash.classification[:6]]
            print(f"    ├─ Dashboard: {cls_count} drivers, {dash_laps} laps [{(time.perf_counter() - dash_t0):.2f}s]")
        except Exception as e:
            print(f"    ├─ Dashboard Error: {e}")

        # Step C: Driver Laps (Prefetch for top drivers)
        target_drivers = list(dict.fromkeys(dash_drivers + drivers[:4]))
        laps_count_total = 0
        laps_t0 = time.perf_counter()
        for d_num in target_drivers:
            try:
                laps = await provider.get_driver_laps(season, r_num, session_name, d_num)
                if laps:
                    laps_count_total += len(laps)
            except Exception:
                pass
        print(f"    └─ Driver Laps: Cached {laps_count_total} laps across {len(target_drivers)} drivers [{(time.perf_counter() - laps_t0):.2f}s]")

        print(f"    Completed Round {r_num} in {(time.perf_counter() - r_start):.2f}s\n")

    total_time = time.perf_counter() - overall_start
    print("=" * 65)
    print(f"✅ Prefetch finished in {total_time:.2f}s")
    show_stats(cache)


def show_stats(cache=None) -> None:
    if cache is None:
        cache = get_dataset_cache()
    stats = cache.get_stats()
    print("\n📦 SQLite Dataset Cache Status:")
    print(f"   Database File: {stats['db_path']}")
    print(f"   File Size:     {stats['file_size_kb']} KB")
    print(f"   Total Entries: {stats['total_entries']}")
    print("   Breakdown by Type:")
    for d_type, count in stats.get("counts_by_type", {}).items():
        print(f"     • {d_type:<12}: {count} records")
    print("=" * 65 + "\n")


def main():
    parser = argparse.ArgumentParser(description="PitwallIQ Dataset Prefetcher")
    parser.add_argument("--season", type=int, default=2026, help="F1 Season year (default: 2026)")
    parser.add_argument("--rounds", type=int, nargs="*", help="Specific round numbers to prefetch (e.g. 1 2 3)")
    parser.add_argument("--all-rounds", action="store_true", help="Prefetch all rounds for the specified season")
    parser.add_argument("--session", type=str, default="Race", help="Session name: Race, Qualifying, FP1 (default: Race)")
    parser.add_argument("--stats", action="store_true", help="Display SQLite dataset cache statistics and exit")

    args = parser.parse_args()

    if args.stats:
        show_stats()
        return

    asyncio.run(
        prefetch_season_rounds(
            season=args.season,
            rounds=args.rounds,
            all_rounds=args.all_rounds,
            session_name=args.session,
        )
    )


if __name__ == "__main__":
    main()
