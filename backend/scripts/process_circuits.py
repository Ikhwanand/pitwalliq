import urllib.request
import json
import math
from pathlib import Path

def main():
    url = "https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson"
    print("Downloading f1-circuits.geojson...")
    req = urllib.request.Request(url, headers={"User-Agent": "PitwallIQ/1.0"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    # Turn count lookup table for 2024 calendar
    turn_counts = {
        "bahrain": 15,
        "jeddah": 27,
        "saudi": 27,
        "albert park": 14,
        "australia": 14,
        "suzuka": 18,
        "japan": 18,
        "shanghai": 16,
        "china": 16,
        "miami": 19,
        "imola": 19,
        "enzo e dino ferrari": 19,
        "monaco": 19,
        "gilles-villeneuve": 14,
        "canada": 14,
        "barcelona": 16,
        "catalunya": 16,
        "spain": 16,
        "red bull ring": 10,
        "austria": 10,
        "silverstone": 18,
        "hungaroring": 14,
        "hungary": 14,
        "spa-francorchamps": 19,
        "belgium": 19,
        "zandvoort": 14,
        "netherlands": 14,
        "monza": 11,
        "italy": 11,
        "baku": 20,
        "azerbaijan": 20,
        "marina bay": 19,
        "singapore": 19,
        "americas": 20,
        "austin": 20,
        "cota": 20,
        "rodriguez": 17,
        "mexico": 17,
        "interlagos": 15,
        "pace": 15,
        "brazil": 15,
        "las vegas": 17,
        "losail": 16,
        "lusail": 16,
        "qatar": 16,
        "yas marina": 16,
        "abu dhabi": 16,
    }

    def get_turns(name):
        n = name.lower()
        for k, v in turn_counts.items():
            if k in n:
                return v
        return 16

    circuits = {}
    for feat in data.get("features", []):
        props = feat.get("properties", {})
        raw_name = props.get("Name") or props.get("name") or "Unknown"
        geom = feat.get("geometry", {})
        coords = geom.get("coordinates", [])

        if geom.get("type") == "Polygon":
            coords = coords[0] if coords else []

        if not coords or len(coords) < 10:
            continue

        lats = [float(c[1]) for c in coords]
        lons = [float(c[0]) for c in coords]
        mid_lat = sum(lats) / len(lats)
        mid_lon = sum(lons) / len(lons)
        cos_lat = math.cos(math.radians(mid_lat))

        # Project coordinates: lon -> X (East positive), lat -> Y (North positive, invert for SVG)
        pts = []
        for c in coords:
            x = (float(c[0]) - mid_lon) * 111320.0 * cos_lat
            y = -(float(c[1]) - mid_lat) * 110540.0
            pts.append({"x": round(x, 1), "y": round(y, 1)})

        # Ensure circuit loop is closed
        if pts and (pts[0]["x"] != pts[-1]["x"] or pts[0]["y"] != pts[-1]["y"]):
            pts.append(pts[0])

        circuit_id = props.get("id") or raw_name.lower().replace(" ", "_")
        turns = get_turns(raw_name)
        length_km = round((float(props.get("length") or 5000)) / 1000.0, 3)

        circuits[raw_name] = {
            "id": circuit_id,
            "name": raw_name,
            "location": props.get("Location") or "",
            "turns": turns,
            "length_km": length_km,
            "points": pts,
        }

    # Output paths
    backend_data_dir = Path("c:/MyProject/pitwalliq/backend/app/data")
    backend_data_dir.mkdir(parents=True, exist_ok=True)
    backend_file = backend_data_dir / "circuits.json"

    frontend_data_dir = Path("c:/MyProject/pitwalliq/frontend/src/data")
    frontend_data_dir.mkdir(parents=True, exist_ok=True)
    frontend_file = frontend_data_dir / "circuits.json"

    with open(backend_file, "w", encoding="utf-8") as f:
        json.dump(circuits, f, indent=2)
    print(f"Saved {len(circuits)} circuits to {backend_file}")

    with open(frontend_file, "w", encoding="utf-8") as f:
        json.dump(circuits, f, indent=2)
    print(f"Saved {len(circuits)} circuits to {frontend_file}")

if __name__ == "__main__":
    main()
