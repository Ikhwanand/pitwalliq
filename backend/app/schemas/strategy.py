from typing import Any
from pydantic import BaseModel, Field


class StrategyRequest(BaseModel):
    season: int = Field(default=2024, description="Season year, e.g. 2024")
    round_number: int = Field(default=1, description="Round number, e.g. 1 for Bahrain")
    session_name: str = Field(default="Race", description="Session name: 'Race', 'Qualifying', 'Sprint', etc.")
    team_name: str | None = Field(default=None, description="Optional team filter (e.g. 'Red Bull Racing')")
    driver_number: str = Field(default="1", description="Driver number or code (e.g. '1' or 'VER')")
    current_lap: int | None = Field(default=None, description="Current lap context, or latest lap if omitted")
    user_question: str = Field(
        default="Should this team consider an undercut, and what are the trade-offs?",
        description="Strategic query or question for the pitwall",
    )


class SituationBrief(BaseModel):
    driver_number: str
    driver_name: str | None = None
    team_name: str | None = None
    current_lap: int
    total_laps: int
    current_position: int | None = None
    tyre_compound: str
    tyre_age_laps: int
    stint_number: int
    recent_pace_seconds: float | None = None
    pace_trend_summary: str
    gap_ahead_seconds: float | None = None
    car_ahead: str | None = None
    gap_behind_seconds: float | None = None
    car_behind: str | None = None
    pit_loss_window_seconds: float = 22.0
    key_telemetry_facts: list[str] = Field(default_factory=list)


class StrategyDecisionMatrix(BaseModel):
    recommendation: str = Field(description="Primary concise recommendation (e.g., 'BOX THIS LAP for HARD compound')")
    action_type: str = Field(description="UNDERCUT, OVERCUT, EXTEND_STINT, DEFENSIVE_BOX, or STAY_OUT")
    target_compound: str = Field(description="Recommended tyre compound: SOFT, MEDIUM, or HARD")
    radio_transmission: str = Field(
        default="Box box, box box. Confirm box this lap.",
        description="Authentic pitwall team radio transmission call",
    )
    primary_plan: str = Field(description="Detailed execution explanation for Plan A")
    alternative_plan: str = Field(description="Plan B fallback scenario (e.g., in case of Safety Car)")
    risk_assessment: str = Field(description="Analysis of traffic, tyre drop-off cliff, and undercut exposure")
    confidence_score: float = Field(ge=0.0, le=1.0, description="Confidence rating between 0.0 and 1.0")
    assumptions: list[str] = Field(default_factory=list)


class StrategyEvaluationResponse(BaseModel):
    request: StrategyRequest
    situation_brief: SituationBrief
    decision_matrix: StrategyDecisionMatrix
    execution_time_ms: float
    model_provider: str = "Agno Two-Tier Workflow"
