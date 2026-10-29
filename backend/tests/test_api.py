from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "PitwallIQ API"


def test_get_seasons():
    response = client.get("/api/v1/seasons")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert len(payload["data"]) >= 5
    years = [s["year"] for s in payload["data"]]
    assert 2024 in years


def test_get_events():
    response = client.get("/api/v1/events?season=2024")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    events = payload["data"]
    assert len(events) >= 20
    assert any("Bahrain" in e["event_name"] for e in events)


if __name__ == "__main__":
    test_health_check()
    print("Health check endpoint: PASSED")
    test_get_seasons()
    print("Seasons endpoint: PASSED")
    test_get_events()
    print("Events endpoint: PASSED")
    print("All FastAPI API tests passed!")
