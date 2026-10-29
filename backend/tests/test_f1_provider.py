import asyncio
from backend.app.providers.fastf1_provider import FastF1Provider


async def run_benchmark():
    print("Initializing FastF1 Provider...")
    provider = FastF1Provider()

    print("\n1. Testing get_seasons()...")
    seasons = await provider.get_seasons()
    print(f"Supported seasons count: {len(seasons)}")
    assert len(seasons) > 0, "Seasons list is empty"
    print(f"Sample seasons: {[s.year for s in seasons[:4]]}")

    print("\n2. Testing get_events(season=2024)...")
    events = await provider.get_events(2024)
    print(f"2024 Grand Prix events count: {len(events)}")
    assert len(events) >= 20, "2024 season should have at least 20 rounds"
    
    round_1 = events[0]
    print(f"Round 1: {round_1.event_name} in {round_1.country} ({round_1.location})")
    assert "Bahrain" in round_1.event_name or "Bahrain" in round_1.country, "Round 1 should be Bahrain"
    print(f"Sessions for Round 1: {[s.name for s in round_1.sessions]}")

    print("\nBenchmark test passed successfully!")


if __name__ == "__main__":
    asyncio.run(run_benchmark())
