import logging
import os
from agno.agent import Agent
from backend.app.agents.tools.f1_tools import get_situation_brief
from backend.app.schemas.strategy import SituationBrief, StrategyRequest

logger = logging.getLogger(__name__)


def create_analyst_agent() -> Agent:
    """Create the Agno Race Data Analyst Agent."""
    instructions = [
        "You are the Lead Race Data Engineer on a Formula 1 pitwall.",
        "Your duty is to extract, verify, and summarize factual telemetry and timing data.",
        "Strict Grounding Rules:",
        "1. Never invent or hallucinate lap times, tyre compounds, or gaps.",
        "2. Clearly quantify tyre degradation (e.g. pace drop-off in seconds per lap).",
        "3. Evaluate the gap to the car ahead to identify if an undercut window (< 2.5s) is open.",
        "4. Output a verified, structured SituationBrief.",
    ]

    # Dynamically select model if API key is present
    model = None
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_api_key:
        from agno.models.openrouter import OpenRouter
        model_id = os.getenv("OPENROUTER_MODEL", "qwen/qwen3.8-max:free")
        model = OpenRouter(id=model_id, api_key=openrouter_api_key)
    elif os.getenv("OPENAI_API_KEY"):
        from agno.models.openai import OpenAIChat
        model_id = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        model = OpenAIChat(id=model_id)
    elif os.getenv("GEMINI_API_KEY"):
        from agno.models.google import Gemini
        model_id = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        model = Gemini(id=model_id)

    return Agent(
        name="Race Data Analyst",
        model=model,
        instructions=instructions,
        markdown=True,
    )


class RaceDataAnalyst:
    """Orchestrates telemetry extraction and analyst reasoning."""

    def __init__(self) -> None:
        self.agent = create_analyst_agent()

    async def analyze(self, request: StrategyRequest) -> SituationBrief:
        """Extract and synthesize factual race telemetry for the requested context."""
        brief = await get_situation_brief(
            season=request.season,
            round_number=request.round_number,
            session_name=request.session_name,
            driver_identifier=request.driver_number,
            target_lap=request.current_lap,
        )
        return brief
