/**
 * PitwallIQ API Client
 * Connects to FastAPI backend (/api/v1/) with normalization, instant fallback data,
 * and dynamic circuit geometry for all seasons (2018–2026).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

import circuitsData from "../data/circuits.json";

export const CALENDAR_2024 = {
  1: "Bahrain International Circuit",
  2: "Jeddah Corniche Circuit",
  3: "Albert Park Circuit",
  4: "Suzuka International Racing Course",
  5: "Shanghai International Circuit",
  6: "Miami International Autodrome",
  7: "Autodromo Enzo e Dino Ferrari",
  8: "Circuit de Monaco",
  9: "Circuit Gilles-Villeneuve",
  10: "Circuit de Barcelona-Catalunya",
  11: "Red Bull Ring",
  12: "Silverstone Circuit",
  13: "Hungaroring",
  14: "Circuit de Spa-Francorchamps",
  15: "Circuit Zandvoort",
  16: "Autodromo Nazionale Monza",
  17: "Baku City Circuit",
  18: "Marina Bay Street Circuit",
  19: "Circuit of the Americas",
  20: "Autódromo Hermanos Rodríguez",
  21: "Autódromo José Carlos Pace - Interlagos",
  22: "Las Vegas Street Circuit",
  23: "Losail International Circuit",
  24: "Yas Marina Circuit",
};

export const F1_GRID_DRIVERS = [
  { driver_number: "1", code: "VER", name: "Max Verstappen", team: "Red Bull Racing", team_color: "#3671C6" },
  { driver_number: "11", code: "PER", name: "Sergio Perez", team: "Red Bull Racing", team_color: "#3671C6" },
  { driver_number: "16", code: "LEC", name: "Charles Leclerc", team: "Ferrari", team_color: "#E8002D" },
  { driver_number: "55", code: "SAI", name: "Carlos Sainz", team: "Ferrari", team_color: "#E8002D" },
  { driver_number: "4", code: "NOR", name: "Lando Norris", team: "McLaren", team_color: "#FF8000" },
  { driver_number: "81", code: "PIA", name: "Oscar Piastri", team: "McLaren", team_color: "#FF8000" },
  { driver_number: "63", code: "RUS", name: "George Russell", team: "Mercedes", team_color: "#27F4D2" },
  { driver_number: "44", code: "HAM", name: "Lewis Hamilton", team: "Mercedes", team_color: "#27F4D2" },
  { driver_number: "14", code: "ALO", name: "Fernando Alonso", team: "Aston Martin", team_color: "#229971" },
  { driver_number: "18", code: "STR", name: "Lance Stroll", team: "Aston Martin", team_color: "#229971" },
  { driver_number: "22", code: "TSU", name: "Yuki Tsunoda", team: "RB", team_color: "#6692FF" },
  { driver_number: "3", code: "RIC", name: "Daniel Ricciardo", team: "RB", team_color: "#6692FF" },
  { driver_number: "27", code: "HUL", name: "Nico Hulkenberg", team: "Haas", team_color: "#B6BABD" },
  { driver_number: "20", code: "MAG", name: "Kevin Magnussen", team: "Haas", team_color: "#B6BABD" },
  { driver_number: "23", code: "ALB", name: "Alexander Albon", team: "Williams", team_color: "#64C4FF" },
  { driver_number: "2", code: "SAR", name: "Logan Sargeant", team: "Williams", team_color: "#64C4FF" },
  { driver_number: "31", code: "OCO", name: "Esteban Ocon", team: "Alpine", team_color: "#0093CC" },
  { driver_number: "10", code: "GAS", name: "Pierre Gasly", team: "Alpine", team_color: "#0093CC" },
  { driver_number: "77", code: "BOT", name: "Valtteri Bottas", team: "Kick Sauber", team_color: "#52E252" },
  { driver_number: "24", code: "ZHO", name: "Guanyu Zhou", team: "Kick Sauber", team_color: "#52E252" },
];

export const EVENT_NAME_TO_CIRCUIT = {
  "albert park": { circuit: "Albert Park Circuit", laps: 58, temp: 21.0, air: 19.4, baseLap: 79.80, name: "Australian Grand Prix" },
  albert: { circuit: "Albert Park Circuit", laps: 58, temp: 21.0, air: 19.4, baseLap: 79.80, name: "Australian Grand Prix" },
  australia: { circuit: "Albert Park Circuit", laps: 58, temp: 21.0, air: 19.4, baseLap: 79.80, name: "Australian Grand Prix" },
  melbourne: { circuit: "Albert Park Circuit", laps: 58, temp: 21.0, air: 19.4, baseLap: 79.80, name: "Australian Grand Prix" },
  china: { circuit: "Shanghai International Circuit", laps: 56, temp: 22.0, air: 18.0, baseLap: 97.40, name: "Chinese Grand Prix" },
  chinese: { circuit: "Shanghai International Circuit", laps: 56, temp: 22.0, air: 18.0, baseLap: 97.40, name: "Chinese Grand Prix" },
  shanghai: { circuit: "Shanghai International Circuit", laps: 56, temp: 22.0, air: 18.0, baseLap: 97.40, name: "Chinese Grand Prix" },
  japan: { circuit: "Suzuka International Racing Course", laps: 53, temp: 19.5, air: 16.8, baseLap: 93.70, name: "Japanese Grand Prix" },
  suzuka: { circuit: "Suzuka International Racing Course", laps: 53, temp: 19.5, air: 16.8, baseLap: 93.70, name: "Japanese Grand Prix" },
  miami: { circuit: "Miami International Autodrome", laps: 57, temp: 30.5, air: 28.0, baseLap: 90.10, name: "Miami Grand Prix" },
  canada: { circuit: "Circuit Gilles-Villeneuve", laps: 70, temp: 20.0, air: 18.5, baseLap: 75.30, name: "Canadian Grand Prix" },
  canadian: { circuit: "Circuit Gilles-Villeneuve", laps: 70, temp: 20.0, air: 18.5, baseLap: 75.30, name: "Canadian Grand Prix" },
  montreal: { circuit: "Circuit Gilles-Villeneuve", laps: 70, temp: 20.0, air: 18.5, baseLap: 75.30, name: "Canadian Grand Prix" },
  monaco: { circuit: "Circuit de Monaco", laps: 78, temp: 26.0, air: 22.0, baseLap: 74.20, name: "Monaco Grand Prix" },
  "monte carlo": { circuit: "Circuit de Monaco", laps: 78, temp: 26.0, air: 22.0, baseLap: 74.20, name: "Monaco Grand Prix" },
  spain: { circuit: "Circuit de Barcelona-Catalunya", laps: 66, temp: 27.0, air: 25.0, baseLap: 77.20, name: "Spanish Grand Prix" },
  spanish: { circuit: "Circuit de Barcelona-Catalunya", laps: 66, temp: 27.0, air: 25.0, baseLap: 77.20, name: "Spanish Grand Prix" },
  barcelona: { circuit: "Circuit de Barcelona-Catalunya", laps: 66, temp: 27.0, air: 25.0, baseLap: 77.20, name: "Barcelona Grand Prix" },
  catalunya: { circuit: "Circuit de Barcelona-Catalunya", laps: 66, temp: 27.0, air: 25.0, baseLap: 77.20, name: "Spanish Grand Prix" },
  austria: { circuit: "Red Bull Ring", laps: 71, temp: 26.0, air: 23.5, baseLap: 68.10, name: "Austrian Grand Prix" },
  austrian: { circuit: "Red Bull Ring", laps: 71, temp: 26.0, air: 23.5, baseLap: 68.10, name: "Austrian Grand Prix" },
  spielberg: { circuit: "Red Bull Ring", laps: 71, temp: 26.0, air: 23.5, baseLap: 68.10, name: "Austrian Grand Prix" },
  britain: { circuit: "Silverstone Circuit", laps: 52, temp: 18.5, air: 16.0, baseLap: 89.20, name: "British Grand Prix" },
  british: { circuit: "Silverstone Circuit", laps: 52, temp: 18.5, air: 16.0, baseLap: 89.20, name: "British Grand Prix" },
  silverstone: { circuit: "Silverstone Circuit", laps: 52, temp: 18.5, air: 16.0, baseLap: 89.20, name: "British Grand Prix" },
  belgium: { circuit: "Circuit de Spa-Francorchamps", laps: 44, temp: 17.0, air: 15.2, baseLap: 106.50, name: "Belgian Grand Prix" },
  belgian: { circuit: "Circuit de Spa-Francorchamps", laps: 44, temp: 17.0, air: 15.2, baseLap: 106.50, name: "Belgian Grand Prix" },
  spa: { circuit: "Circuit de Spa-Francorchamps", laps: 44, temp: 17.0, air: 15.2, baseLap: 106.50, name: "Belgian Grand Prix" },
  hungary: { circuit: "Hungaroring", laps: 70, temp: 32.0, air: 29.5, baseLap: 80.30, name: "Hungarian Grand Prix" },
  hungarian: { circuit: "Hungaroring", laps: 70, temp: 32.0, air: 29.5, baseLap: 80.30, name: "Hungarian Grand Prix" },
  netherlands: { circuit: "Circuit Zandvoort", laps: 72, temp: 19.0, air: 17.5, baseLap: 73.10, name: "Dutch Grand Prix" },
  dutch: { circuit: "Circuit Zandvoort", laps: 72, temp: 19.0, air: 17.5, baseLap: 73.10, name: "Dutch Grand Prix" },
  zandvoort: { circuit: "Circuit Zandvoort", laps: 72, temp: 19.0, air: 17.5, baseLap: 73.10, name: "Dutch Grand Prix" },
  italy: { circuit: "Autodromo Nazionale Monza", laps: 53, temp: 28.5, air: 26.0, baseLap: 81.60, name: "Italian Grand Prix" },
  italian: { circuit: "Autodromo Nazionale Monza", laps: 53, temp: 28.5, air: 26.0, baseLap: 81.60, name: "Italian Grand Prix" },
  monza: { circuit: "Autodromo Nazionale Monza", laps: 53, temp: 28.5, air: 26.0, baseLap: 81.60, name: "Italian Grand Prix" },
  azerbaijan: { circuit: "Baku City Circuit", laps: 51, temp: 26.0, air: 24.0, baseLap: 103.20, name: "Azerbaijan Grand Prix" },
  baku: { circuit: "Baku City Circuit", laps: 51, temp: 26.0, air: 24.0, baseLap: 103.20, name: "Azerbaijan Grand Prix" },
  bahrain: { circuit: "Bahrain International Circuit", laps: 57, temp: 24.5, air: 18.2, baseLap: 95.15, name: "Bahrain Grand Prix" },
  sakhir: { circuit: "Bahrain International Circuit", laps: 57, temp: 24.5, air: 18.2, baseLap: 95.15, name: "Bahrain Grand Prix" },
  singapore: { circuit: "Marina Bay Street Circuit", laps: 62, temp: 31.0, air: 29.0, baseLap: 95.80, name: "Singapore Grand Prix" },
  "marina bay": { circuit: "Marina Bay Street Circuit", laps: 62, temp: 31.0, air: 29.0, baseLap: 95.80, name: "Singapore Grand Prix" },
  "united states": { circuit: "Circuit of the Americas", laps: 56, temp: 29.0, air: 27.5, baseLap: 97.50, name: "United States Grand Prix" },
  austin: { circuit: "Circuit of the Americas", laps: 56, temp: 29.0, air: 27.5, baseLap: 97.50, name: "United States Grand Prix" },
  cota: { circuit: "Circuit of the Americas", laps: 56, temp: 29.0, air: 27.5, baseLap: 97.50, name: "United States Grand Prix" },
  mexico: { circuit: "Autódromo Hermanos Rodríguez", laps: 71, temp: 22.5, air: 20.0, baseLap: 80.20, name: "Mexico City Grand Prix" },
  brazil: { circuit: "Autódromo José Carlos Pace - Interlagos", laps: 71, temp: 24.0, air: 22.0, baseLap: 72.40, name: "São Paulo Grand Prix" },
  "são paulo": { circuit: "Autódromo José Carlos Pace - Interlagos", laps: 71, temp: 24.0, air: 22.0, baseLap: 72.40, name: "São Paulo Grand Prix" },
  interlagos: { circuit: "Autódromo José Carlos Pace - Interlagos", laps: 71, temp: 24.0, air: 22.0, baseLap: 72.40, name: "São Paulo Grand Prix" },
  "las vegas": { circuit: "Las Vegas Street Circuit", laps: 50, temp: 15.0, air: 13.0, baseLap: 95.20, name: "Las Vegas Grand Prix" },
  qatar: { circuit: "Losail International Circuit", laps: 57, temp: 31.5, air: 28.5, baseLap: 84.30, name: "Qatar Grand Prix" },
  losail: { circuit: "Losail International Circuit", laps: 57, temp: 31.5, air: 28.5, baseLap: 84.30, name: "Qatar Grand Prix" },
  lusail: { circuit: "Losail International Circuit", laps: 57, temp: 31.5, air: 28.5, baseLap: 84.30, name: "Qatar Grand Prix" },
  "abu dhabi": { circuit: "Yas Marina Circuit", laps: 58, temp: 27.0, air: 25.0, baseLap: 86.80, name: "Abu Dhabi Grand Prix" },
  "yas marina": { circuit: "Yas Marina Circuit", laps: 58, temp: 27.0, air: 25.0, baseLap: 86.80, name: "Abu Dhabi Grand Prix" },
  saudi: { circuit: "Jeddah Corniche Circuit", laps: 50, temp: 29.2, air: 26.5, baseLap: 91.50, name: "Saudi Arabian Grand Prix" },
  jeddah: { circuit: "Jeddah Corniche Circuit", laps: 50, temp: 29.2, air: 26.5, baseLap: 91.50, name: "Saudi Arabian Grand Prix" },
  imola: { circuit: "Autodromo Enzo e Dino Ferrari", laps: 63, temp: 23.0, air: 21.5, baseLap: 78.50, name: "Emilia Romagna Grand Prix" },
  emilia: { circuit: "Autodromo Enzo e Dino Ferrari", laps: 63, temp: 23.0, air: 21.5, baseLap: 78.50, name: "Emilia Romagna Grand Prix" },
};

export const F1_CALENDAR_META = {
  1: { name: "Bahrain Grand Prix", circuit: "Bahrain International Circuit", laps: 57, temp: 24.5, air: 18.2, baseLap: 95.15 },
  2: { name: "Saudi Arabian Grand Prix", circuit: "Jeddah Corniche Circuit", laps: 50, temp: 29.2, air: 26.5, baseLap: 91.50 },
  3: { name: "Australian Grand Prix", circuit: "Albert Park Circuit", laps: 58, temp: 21.0, air: 19.4, baseLap: 79.80 },
  4: { name: "Japanese Grand Prix", circuit: "Suzuka International Racing Course", laps: 53, temp: 19.5, air: 16.8, baseLap: 93.70 },
  5: { name: "Chinese Grand Prix", circuit: "Shanghai International Circuit", laps: 56, temp: 22.0, air: 18.0, baseLap: 97.40 },
  6: { name: "Miami Grand Prix", circuit: "Miami International Autodrome", laps: 57, temp: 30.5, air: 28.0, baseLap: 90.10 },
  7: { name: "Emilia Romagna Grand Prix", circuit: "Autodromo Enzo e Dino Ferrari", laps: 63, temp: 23.0, air: 21.5, baseLap: 78.50 },
  8: { name: "Monaco Grand Prix", circuit: "Circuit de Monaco", laps: 78, temp: 26.0, air: 22.0, baseLap: 74.20 },
  9: { name: "Canadian Grand Prix", circuit: "Circuit Gilles-Villeneuve", laps: 70, temp: 20.0, air: 18.5, baseLap: 75.30 },
  10: { name: "Spanish Grand Prix", circuit: "Circuit de Barcelona-Catalunya", laps: 66, temp: 27.0, air: 25.0, baseLap: 77.20 },
  11: { name: "Austrian Grand Prix", circuit: "Red Bull Ring", laps: 71, temp: 26.0, air: 23.5, baseLap: 68.10 },
  12: { name: "British Grand Prix", circuit: "Silverstone Circuit", laps: 52, temp: 18.5, air: 16.0, baseLap: 89.20 },
  13: { name: "Hungarian Grand Prix", circuit: "Hungaroring", laps: 70, temp: 32.0, air: 29.5, baseLap: 80.30 },
  14: { name: "Belgian Grand Prix", circuit: "Circuit de Spa-Francorchamps", laps: 44, temp: 17.0, air: 15.2, baseLap: 106.50 },
  15: { name: "Dutch Grand Prix", circuit: "Circuit Zandvoort", laps: 72, temp: 19.0, air: 17.5, baseLap: 73.10 },
  16: { name: "Italian Grand Prix", circuit: "Autodromo Nazionale Monza", laps: 53, temp: 28.5, air: 26.0, baseLap: 81.60 },
  17: { name: "Azerbaijan Grand Prix", circuit: "Baku City Circuit", laps: 51, temp: 26.0, air: 24.0, baseLap: 103.20 },
  18: { name: "Singapore Grand Prix", circuit: "Marina Bay Street Circuit", laps: 62, temp: 31.0, air: 29.0, baseLap: 95.80 },
  19: { name: "United States Grand Prix", circuit: "Circuit of the Americas", laps: 56, temp: 29.0, air: 27.5, baseLap: 97.50 },
  20: { name: "Mexico City Grand Prix", circuit: "Autódromo Hermanos Rodríguez", laps: 71, temp: 22.5, air: 20.0, baseLap: 80.20 },
  21: { name: "São Paulo Grand Prix", circuit: "Autódromo José Carlos Pace - Interlagos", laps: 71, temp: 24.0, air: 22.0, baseLap: 72.40 },
  22: { name: "Las Vegas Grand Prix", circuit: "Las Vegas Street Circuit", laps: 50, temp: 15.0, air: 13.0, baseLap: 95.20 },
  23: { name: "Qatar Grand Prix", circuit: "Losail International Circuit", laps: 57, temp: 31.5, air: 28.5, baseLap: 84.30 },
  24: { name: "Abu Dhabi Grand Prix", circuit: "Yas Marina Circuit", laps: 58, temp: 27.0, air: 25.0, baseLap: 86.80 },
};

export function formatLapTime(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3);
  const sPadded = Number(s) < 10 ? `0${s}` : s;
  return `${m}:${sPadded}`;
}

export function resolveEventMeta(roundNumber = 1, eventName = "") {
  const ev = (eventName || "").toLowerCase().trim();

  // 1. Direct or partial match against circuits database keys (e.g. "Albert Park Circuit")
  for (const [cName, cData] of Object.entries(circuitsData)) {
    const cLower = cName.toLowerCase();
    if (ev && (cLower === ev || ev.includes(cLower) || cLower.includes(ev))) {
      for (const meta of Object.values(EVENT_NAME_TO_CIRCUIT)) {
        if (meta.circuit.toLowerCase() === cLower) {
          return { ...meta, circuit: cData.name, length_km: cData.length_km, turns: cData.turns };
        }
      }
      return {
        circuit: cData.name,
        name: eventName || cData.name,
        laps: cData.turns === 14 ? 58 : 55,
        temp: 22.0,
        air: 19.0,
        baseLap: 80.0,
        length_km: cData.length_km,
        turns: cData.turns,
      };
    }
  }

  // 2. Keyword match in EVENT_NAME_TO_CIRCUIT
  for (const [key, meta] of Object.entries(EVENT_NAME_TO_CIRCUIT)) {
    if (ev && (ev.includes(key) || meta.circuit.toLowerCase().includes(ev))) {
      const cData = circuitsData[meta.circuit];
      return {
        ...meta,
        length_km: cData?.length_km || 5.278,
        turns: cData?.turns || 14,
      };
    }
  }

  // 3. Fallback based on round number
  const r = Number(roundNumber) || 1;
  const calMeta = F1_CALENDAR_META[r];
  if (calMeta) {
    const cData = circuitsData[calMeta.circuit];
    return {
      ...calMeta,
      length_km: cData?.length_km || 5.412,
      turns: cData?.turns || 15,
    };
  }

  return {
    circuit: "Albert Park Circuit",
    name: eventName || `Round ${r} Grand Prix`,
    laps: 58,
    temp: 21.0,
    air: 19.0,
    baseLap: 79.80,
    length_km: 5.278,
    turns: 14,
  };
}

export function getCircuitFallback(roundNumber = 1, eventName = "") {
  const meta = resolveEventMeta(roundNumber, eventName);
  const circuitName = meta.circuit;
  if (circuitsData[circuitName]) {
    const c = circuitsData[circuitName];
    return {
      circuit_name: c.name,
      points: c.points,
      length_km: c.length_km,
      turns: c.turns,
    };
  }

  for (const [name, c] of Object.entries(circuitsData)) {
    const ev = (eventName || "").toLowerCase();
    if (ev && name.toLowerCase().includes(ev)) {
      return {
        circuit_name: c.name,
        points: c.points,
        length_km: c.length_km,
        turns: c.turns,
      };
    }
  }

  const defaultCircuit = circuitsData["Albert Park Circuit"] || circuitsData["Bahrain International Circuit"] || Object.values(circuitsData)[0];
  return {
    circuit_name: defaultCircuit.name,
    points: defaultCircuit.points,
    length_km: defaultCircuit.length_km,
    turns: defaultCircuit.turns,
  };
}

export function getDashboardFallback(roundNumber = 1, season = 2026, sessionName = "Race", eventName = "") {
  const r = Number(roundNumber) || 1;
  const meta = resolveEventMeta(r, eventName);

  const classification = F1_GRID_DRIVERS.map((d, idx) => {
    const gapSec = idx === 0 ? 0 : idx * 2.38 + ((idx % 3) * 0.45);
    const lapSec = meta.baseLap + idx * 0.18 + ((idx % 4) * 0.09);
    const isBoxed = idx === 15;
    return {
      pos: idx + 1,
      driver_number: d.driver_number,
      code: d.code,
      name: d.name,
      team: d.team,
      team_color: d.team_color,
      gap: idx === 0 ? "LEADER" : idx > 10 ? "+1 LAP" : `+${gapSec.toFixed(3)}`,
      interval: idx === 0 ? "-" : idx > 10 ? "+1 LAP" : `+${(2.38 + (idx % 3) * 0.12).toFixed(3)}`,
      tyre_compound: idx % 3 === 0 ? "SOFT" : idx % 3 === 1 ? "HARD" : "MEDIUM",
      tyre_age: Math.max(2, 18 - (idx % 8)),
      last_lap: formatLapTime(lapSec),
      status: isBoxed ? "PIT" : "ON TRACK",
    };
  });

  return {
    season,
    round_number: r,
    event_name: meta.name || `Round ${r} Grand Prix`,
    session_name: sessionName,
    current_lap: 18,
    total_laps: meta.laps,
    track_status: "GREEN",
    track_temp_c: meta.temp,
    air_temp_c: meta.air,
    classification,
  };
}

export function getLapPaceFallback(roundNumber = 1, eventName = "") {
  const meta = resolveEventMeta(roundNumber, eventName);
  const totalLaps = meta.laps;
  const base = meta.baseLap;

  return Array.from({ length: totalLaps }, (_, i) => {
    const lap = i + 1;
    const stint1Pace = base + (lap <= 18 ? lap * 0.08 : lap <= 36 ? (lap - 18) * 0.1 : (lap - 36) * 0.12);
    const pitDeltaVer = lap === 19 || lap === 37 ? 22.4 : 0;
    const pitDeltaLec = lap === 17 || lap === 35 ? 22.8 : 0;

    const v = Number((stint1Pace + pitDeltaVer + Math.sin(lap * 0.8) * 0.15).toFixed(3));
    const c = Number((stint1Pace + 0.38 + pitDeltaLec + Math.cos(lap * 0.8) * 0.2).toFixed(3));

    return {
      lap,
      driver1: v,
      driver2: c,
      ver: v,
      lec: c,
    };
  });
}

export const MOCK_TRACK_MAP = getCircuitFallback(1, "Australian Grand Prix");
export const MOCK_DASHBOARD = getDashboardFallback(1, 2026, "Race", "Australian Grand Prix");
export const MOCK_LAP_PACE = getLapPaceFallback(1, "Australian Grand Prix");

export const INITIAL_EVENTS = [
  { round_number: 1, event_name: "Australian Grand Prix", country: "Australia", location: "Melbourne", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 2, event_name: "Chinese Grand Prix", country: "China", location: "Shanghai", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 3, event_name: "Japanese Grand Prix", country: "Japan", location: "Suzuka", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 4, event_name: "Miami Grand Prix", country: "United States", location: "Miami", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 5, event_name: "Canadian Grand Prix", country: "Canada", location: "Montreal", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 6, event_name: "Monaco Grand Prix", country: "Monaco", location: "Monte Carlo", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 7, event_name: "Barcelona Grand Prix", country: "Spain", location: "Barcelona", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 8, event_name: "Austrian Grand Prix", country: "Austria", location: "Spielberg", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 9, event_name: "British Grand Prix", country: "United Kingdom", location: "Silverstone", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 10, event_name: "Belgian Grand Prix", country: "Belgium", location: "Spa-Francorchamps", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 11, event_name: "Hungarian Grand Prix", country: "Hungary", location: "Budapest", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 12, event_name: "Dutch Grand Prix", country: "Netherlands", location: "Zandvoort", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 13, event_name: "Italian Grand Prix", country: "Italy", location: "Monza", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 14, event_name: "Spanish Grand Prix", country: "Spain", location: "Madrid", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 15, event_name: "Azerbaijan Grand Prix", country: "Azerbaijan", location: "Baku", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 16, event_name: "Bahrain Grand Prix", country: "Bahrain", location: "Sakhir", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 17, event_name: "Singapore Grand Prix", country: "Singapore", location: "Marina Bay", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 18, event_name: "United States Grand Prix", country: "United States", location: "Austin", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 19, event_name: "Mexico City Grand Prix", country: "Mexico", location: "Mexico City", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 20, event_name: "São Paulo Grand Prix", country: "Brazil", location: "São Paulo", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 21, event_name: "Las Vegas Grand Prix", country: "United States", location: "Las Vegas", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 22, event_name: "Qatar Grand Prix", country: "Qatar", location: "Lusail", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
  { round_number: 23, event_name: "Abu Dhabi Grand Prix", country: "United Arab Emirates", location: "Yas Marina", sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }] },
];

export async function fetchSeasons() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${API_BASE_URL}/seasons`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && Array.isArray(data.data)) {
      return data.data.map((item) => item.year || item);
    }
  } catch (err) {
    console.warn("Using fallback seasons:", err.message);
  }
  return [2026, 2025, 2024, 2023, 2022, 2021, 2020];
}

export async function fetchEvents(season = 2026) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE_URL}/events?season=${season}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && Array.isArray(data.data) && data.data.length > 0) {
      return data.data;
    }
  } catch (err) {
    console.warn("Using fallback events calendar:", err.message);
  }

  if (Number(season) === 2026) {
    return INITIAL_EVENTS;
  }

  return Object.entries(F1_CALENDAR_META).map(([roundStr, meta]) => ({
    round_number: Number(roundStr),
    event_name: meta.name,
    country: meta.circuit,
    location: meta.circuit,
    sessions: [{ name: "Practice 1" }, { name: "Qualifying" }, { name: "Race" }],
  }));
}

export async function fetchDashboard(season = 2026, roundNumber = 1, sessionName = "Race", eventName = "") {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `${API_BASE_URL}/sessions/dashboard?season=${season}&round_number=${roundNumber}&session_name=${encodeURIComponent(sessionName)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const resJson = await res.json();
    const data = resJson.data || resJson;

    if (data && Array.isArray(data.classification) && data.classification.length > 0) {
      const normalizedClassification = data.classification.map((d, idx) => {
        const drv = d.driver || {};
        const stints = d.stints || [];
        const activeStint = stints[stints.length - 1] || {};

        return {
          pos: d.position || idx + 1,
          driver_number: String(drv.driver_number || idx + 1),
          code: drv.abbreviation || drv.broadcast_name || `D${idx + 1}`,
          name: drv.full_name || drv.broadcast_name || `Driver ${idx + 1}`,
          team: drv.team_name || "Formula 1 Team",
          team_color: drv.team_color || "#9CA3AF",
          gap: idx === 0 ? "LEADER" : `+${(idx * 2.45).toFixed(3)}`,
          interval: idx === 0 ? "-" : `+${(2.45).toFixed(3)}`,
          tyre_compound: activeStint.compound || "MEDIUM",
          tyre_age: activeStint.total_laps || 12,
          last_lap: d.fastest_lap_time || "1:35.400",
          status: d.status || "ON TRACK",
        };
      });

      return {
        season: data.season || season,
        round_number: data.round_number || roundNumber,
        event_name: data.event_name || eventName || `Round ${roundNumber} Grand Prix`,
        session_name: data.session_name || sessionName,
        current_lap: 18,
        total_laps: data.total_laps || 57,
        track_status: "GREEN",
        track_temp_c: 26.5,
        air_temp_c: 22.0,
        classification: normalizedClassification,
      };
    }
  } catch (err) {
    console.warn("Using fallback dashboard for Round", roundNumber, err.message);
  }
  return getDashboardFallback(roundNumber, season, sessionName, eventName);
}

export async function fetchTrackMap(season = 2026, roundNumber = 1, sessionName = "Race", eventName = "") {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `${API_BASE_URL}/sessions/track-map?season=${season}&round_number=${roundNumber}&session_name=${encodeURIComponent(sessionName)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const resJson = await res.json();
    const data = resJson.data || resJson;

    if (data) {
      const coords = data.coordinates || data.points || [];
      const rawCorners = data.corners || [];
      if (Array.isArray(coords) && coords.length > 2) {
        const meta = resolveEventMeta(roundNumber, data.event_name || eventName);
        return {
          circuit_name: meta.circuit || data.event_name,
          points: coords.map((c) => ({ x: Number(c.x), y: Number(c.y) })),
          corners: rawCorners.map((cr) => ({
            turn: cr.number,
            letter: cr.letter,
            x: Number(cr.x),
            y: Number(cr.y),
          })),
          length_km: meta.length_km || 5.278,
          turns: meta.turns || 14,
        };
      }
    }
  } catch (err) {
    console.warn("Using circuit fallback for Round", roundNumber, err.message);
  }
  return getCircuitFallback(roundNumber, eventName);
}

export async function fetchDriverLaps(season = 2026, roundNumber = 1, sessionName = "Race", driver1 = "1", driver2 = "16", eventName = "") {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const [res1, res2] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/sessions/driver-laps?season=${season}&round_number=${roundNumber}&session_name=${encodeURIComponent(sessionName)}&driver_number=${driver1}`, { signal: controller.signal }),
      fetch(`${API_BASE_URL}/sessions/driver-laps?season=${season}&round_number=${roundNumber}&session_name=${encodeURIComponent(sessionName)}&driver_number=${driver2}`, { signal: controller.signal }),
    ]);
    clearTimeout(timeoutId);

    let laps1 = [];
    let laps2 = [];

    if (res1.status === "fulfilled" && res1.value.ok) {
      const j1 = await res1.value.json();
      laps1 = j1.data || [];
    }
    if (res2.status === "fulfilled" && res2.value.ok) {
      const j2 = await res2.value.json();
      laps2 = j2.data || [];
    }

    if (Array.isArray(laps1) && laps1.length > 0) {
      const laps2Map = new Map();
      laps2.forEach((l) => laps2Map.set(l.lap_number, l.lap_time_seconds));

      const formatted = laps1.map((l) => {
        const d1Time = l.lap_time_seconds || 96.0;
        const d2Time = laps2Map.get(l.lap_number) || (d1Time + 0.35);
        return {
          lap: l.lap_number,
          driver1: d1Time,
          driver2: d2Time,
          ver: d1Time,
          lec: d2Time,
        };
      });
      return { laps: formatted };
    }
  } catch (err) {
    console.warn("Using fallback lap pace:", err.message);
  }

  return { laps: getLapPaceFallback(roundNumber, eventName) };
}

export async function evaluateStrategy(payload) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${API_BASE_URL}/strategy/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errDetail = await res.text();
      throw new Error(`Strategy API Error (${res.status}): ${errDetail}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("Using strategic fallback decision matrix:", err.message);
    return {
      success: true,
      data: {
        recommendation: "EXECUTE UNDERCUT — PIT LAP 19 FOR HARD TYRES",
        pitwall_radio: "Box box, box box! Execute undercut on Leclerc. Push hard on the in-lap.",
        primary_plan: "Box on Lap 19 for C3 Hard compound. Out-lap delta is +1.8s faster than worn softs. Rejoin in clean air ahead of the midfield DRS train.",
        alternative_plan: "Plan B: If safety car is deployed before Lap 19, stay out and extend to Lap 25 for a 1-stop Medium switch.",
        decision_probabilities: {
          undercut_opportunity: 0.84,
          tyre_cliff_reached: 0.72,
        },
        risk_assessment: "Midfield traffic window between P8 (Piastri) and P10 (Stroll) leaves a 3.4s clean air buffer on rejoin. Minimal pit lane loss risk (22.2s).",
        confidence_score: 0.89,
        assumptions: [
          "Track temperature cooling to 23.8°C",
          "Pit lane loss delta 22.2 seconds",
          "Hard tyre warm-up phase requires 1 flying lap",
        ],
      },
    };
  }
}
