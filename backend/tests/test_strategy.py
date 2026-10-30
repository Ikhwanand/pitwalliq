import asyncio
from fastapi.testclient import TestClient
from backend.app.agents.workflow import RaceStrategyWorkflow
from backend.app.main import app
from backend.app.schemas.strategy import StrategyRequest

client = TestClient(app)


def test_strategy_api_endpoint():
    payload = {
        "season": 2024,
        "round_number": 1,
        "session_name": "Race",
        "driver_number": "1",
        "current_lap": 15,
        "user_question": "Should Max Verstappen pit for an undercut or extend his stint on Mediums?",
    }
    response = client.post("/api/v1/strategy/evaluate", json=payload)
    assert response.status_code == 200, f"Strategy endpoint failed: {response.text}"
    
    result = response.json()
    assert result["success"] is True
    data = result["data"]
    
    # Verify Situation Brief
    brief = data["situation_brief"]
    assert brief["driver_number"] == "1"
    assert brief["current_lap"] == 15
    assert len(brief["key_telemetry_facts"]) > 0
    print(f"Verified Situation Brief: {brief['driver_name']} on {brief['tyre_compound']} (Age: {brief['tyre_age_laps']} laps)")

    # Verify Decision Matrix
    decision = data["decision_matrix"]
    assert decision["recommendation"] is not None
    assert decision["confidence_score"] > 0.5
    print(f"Recommendation: {decision['recommendation']}")
    print(f"Primary Plan: {decision['primary_plan']}")
    print(f"Execution time: {data['execution_time_ms']}ms")


async def test_workflow_direct():
    workflow = RaceStrategyWorkflow()
    req = StrategyRequest(
        season=2024,
        round_number=1,
        session_name="Race",
        driver_number="1",
        current_lap=18,
        user_question="Evaluate tyre wear and pit loss window.",
    )
    res = await workflow.execute_strategy_evaluation(req)
    assert res.situation_brief.driver_number == "1"
    assert res.decision_matrix.action_type in ["UNDERCUT", "OVERCUT", "EXTEND_STINT", "DEFENSIVE_BOX", "STAY_OUT"]
    print("Direct Agno Workflow execution: PASSED")


if __name__ == "__main__":
    print("Running Agno Two-Tier Strategy Workflow Tests...")
    asyncio.run(test_workflow_direct())
    test_strategy_api_endpoint()
    print("\nALL AGNO STRATEGY TESTS PASSED SUCCESSFULLY!")
