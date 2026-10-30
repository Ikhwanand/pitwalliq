import json
import logging
import os
import re
import httpx
from agno.agent import Agent
from agno.team import Team
from backend.app.schemas.strategy import SituationBrief, StrategyDecisionMatrix, StrategyRequest

logger = logging.getLogger(__name__)


def _extract_decision_json(raw_text: str) -> dict | None:
    """Safely extract JSON dictionary from raw model text or markdown blocks."""
    if not raw_text or not isinstance(raw_text, str):
        return None
    cleaned = raw_text.strip()
    try:
        return json.loads(cleaned)
    except Exception:
        pass
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(cleaned[start : end + 1])
        except Exception:
            pass
    return None


def create_pitwall_strategy_team() -> Team | Agent | None:
    """Create the Agno Pitwall Strategy Team collaborating on race tactics."""
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    model = None

    if openrouter_api_key:
        from agno.models.openrouter import OpenRouter
        # Use fast reasoning model for reasoning synthesis (e.g. Nemotron)
        reason_model_id = os.getenv("OPENROUTER_MODEL", "qwen/qwen3.8-max:free")
        model = OpenRouter(id=reason_model_id, api_key=openrouter_api_key)
    elif os.getenv("OPENAI_API_KEY"):
        from agno.models.openai import OpenAIChat
        model_id = os.getenv("OPENAI_MODEL", "gpt-4o")
        model = OpenAIChat(id=model_id)
    elif os.getenv("GEMINI_API_KEY"):
        from agno.models.google import Gemini
        model_id = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        model = Gemini(id=model_id)

    if model is None:
        return None

    tyre_specialist = Agent(
        name="Tyre & Degradation Specialist",
        role="Evaluate tyre degradation cliff, pace drop-off, and compound working windows",
        model=model,
        instructions=[
            "You are the Tyre Performance Engineer on an F1 pitwall.",
            "Analyze tyre age, pace drop-off, and out-lap warm-up grip deltas.",
            "Be analytical, concise, and focused on rubber longevity.",
        ],
    )

    tactics_specialist = Agent(
        name="Tactics & Race Positioning Engineer",
        role="Evaluate track position, pit loss window, competitor reaction, and undercut delta",
        model=model,
        instructions=[
            "You are the Track Position & Tactics Engineer on an F1 pitwall.",
            "Calculate clean air exit windows, DRS trains, and competitor undercut/overcut vulnerabilities.",
            "Be decisive and focused on net track position gain.",
        ],
    )

    return Team(
        name="Pitwall Strategy Team",
        members=[tyre_specialist, tactics_specialist],
        model=model,
        instructions=[
            "You are the unified F1 Pitwall Strategy Directorate.",
            "Collaborate to synthesize factual telemetry AND statistical decision probabilities into an elite race strategy.",
            "Always return ONLY a valid, parseable JSON object matching StrategyDecisionMatrix schema.",
        ],
    )


class ChiefRaceStrategist:
    """Orchestrates F1 Race Strategy using OpenRouter Decision Model + Agno Strategy Team."""

    def __init__(self) -> None:
        self.team = create_pitwall_strategy_team()

    def _generate_dynamic_hypotheses_with_ai(
        self, request: StrategyRequest, brief: SituationBrief
    ) -> dict | None:
        """Have AI dynamically formulate binary decision hypotheses based on live race context."""
        openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        if not openrouter_api_key:
            return None

        from agno.models.openrouter import OpenRouter
        reason_model_id = os.getenv("OPENROUTER_MODEL", "qwen/qwen3.8-max:free")
        hypothesis_agent = Agent(
            name="Tactical Hypothesis Formulator",
            model=OpenRouter(id=reason_model_id, api_key=openrouter_api_key),
            instructions=[
                "You are an elite F1 Pitwall Tactical Analyst.",
                "Your role: Analyze the telemetry situation and formulate 2 critical binary decision questions for the OpenRouter Decision Model.",
                "Questions must directly address whether to pit now vs stay out, undercut rivals, defend position, or manage degradation.",
                "Return ONLY a JSON dictionary where keys are question IDs and values have 'type': 'noul', 'instructions': str, and 'criteria': {'true': str, 'false': str}.",
            ],
        )

        driver_str = brief.driver_name or f"Driver #{brief.driver_number}"
        car_ahead_str = brief.car_ahead or "Leader"
        car_behind_str = brief.car_behind or "Chaser"

        situation = (
            f"Driver: {driver_str} (P{brief.current_position or 1}). Lap {brief.current_lap} of {brief.total_laps}.\n"
            f"Car Ahead: {car_ahead_str} (Gap: {brief.gap_ahead_seconds or 'N/A'}s).\n"
            f"Car Behind: {car_behind_str} (Gap: {brief.gap_behind_seconds or 'N/A'}s).\n"
            f"Tyres: {brief.tyre_compound} ({brief.tyre_age_laps} laps old, Stint {brief.stint_number}). Pace Trend: {brief.pace_trend_summary}.\n"
            f"Pit loss window: {brief.pit_loss_window_seconds}s.\n"
            f"User Strategic Question: \"{request.user_question}\"\n"
        )

        try:
            res = hypothesis_agent.run(
                f"Analyze this dynamic race situation and generate 2 targeted decision hypotheses:\n{situation}\nReturn ONLY JSON:"
            )
            content = res.content if hasattr(res, "content") else str(res)
            raw_questions = _extract_decision_json(content)
            if raw_questions and isinstance(raw_questions, dict):
                valid_questions = {}
                for q_id, q_val in raw_questions.items():
                    if isinstance(q_val, dict) and "instructions" in q_val and "criteria" in q_val:
                        crit = q_val["criteria"]
                        valid_questions[q_id] = {
                            "type": "noul",
                            "instructions": str(q_val["instructions"]),
                            "criteria": {
                                "true": str(crit.get("true", "Condition is met")),
                                "false": str(crit.get("false", "Condition is not met")),
                            } if isinstance(crit, dict) else {
                                "true": str(crit),
                                "false": "Condition is not met",
                            },
                        }
                if len(valid_questions) >= 1:
                    logger.info("AI generated %d dynamic decision hypotheses", len(valid_questions))
                    return valid_questions
        except Exception as exc:
            logger.warning("AI dynamic hypothesis generation encountered error: %s", exc)

        return None

    def _query_decision_model_probabilities(
        self, request: StrategyRequest, brief: SituationBrief
    ) -> tuple[dict, str | None]:
        """Query OpenRouter Decision Model with AI-generated dynamic hypotheses."""
        api_key = os.getenv("OPENROUTER_API_KEY")
        model = os.getenv("OPENROUTER_DECISION_MODEL", "respan/span-01-lite:free")
        if not api_key:
            return {}, None

        # 1. Ask AI to dynamically generate hypotheses from telemetry
        questions = self._generate_dynamic_hypotheses_with_ai(request, brief)

        # 2. Contextual fallback hypotheses if AI generation is unavailable
        if not questions:
            driver_str = brief.driver_name or f"Driver #{brief.driver_number}"
            car_ahead_str = brief.car_ahead or "Car Ahead"
            gap_ahead = brief.gap_ahead_seconds or 99.0
            questions = {
                "undercut_opportunity": {
                    "type": "noul",
                    "instructions": f"Should {driver_str} pit on the next lap to execute an undercut against {car_ahead_str}?",
                    "criteria": {
                        "true": f"Gap to {car_ahead_str} is within 2.8s and tyres are at least 10 laps old.",
                        "false": f"Gap to {car_ahead_str} is too wide or tyres still retain competitive pace.",
                    },
                },
                "tyre_cliff_reached": {
                    "type": "noul",
                    "instructions": "Has the current tyre reached its degradation performance cliff?",
                    "criteria": {
                        "true": "Tyre age is high or pace drop-off exceeds 0.3s per lap.",
                        "false": "Tyre degradation is still within manageable working window.",
                    },
                },
            }

        driver_str = brief.driver_name or f"Driver #{brief.driver_number}"
        car_ahead_str = brief.car_ahead or "Car Ahead"
        gap_ahead = brief.gap_ahead_seconds or 99.0

        state = (
            f"Driver: {driver_str}. Lap {brief.current_lap} of {brief.total_laps}. "
            f"Position: P{brief.current_position or 1}. "
            f"Gap to car ahead ({car_ahead_str}): {gap_ahead:.1f}s. "
            f"Tyre: {brief.tyre_compound} ({brief.tyre_age_laps} laps old). "
            f"Pace Trend: {brief.pace_trend_summary}. "
            f"Pit loss window: {brief.pit_loss_window_seconds}s into clean air."
        )

        try:
            resp = httpx.post(
                "https://openrouter.ai/api/alpha/decisions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": model, "state": state, "questions": questions},
                timeout=3.5,
            )
            if resp.status_code == 200:
                data = resp.json()
                raw_answers = data.get("answers", {})
                answers_summary = {}
                for q_id, q_body in raw_answers.items():
                    noul_val = q_body.get("noul", 0.0)
                    instructions = questions.get(q_id, {}).get("instructions", q_id)
                    answers_summary[q_id] = {
                        "instructions": instructions,
                        "probability": float(noul_val),
                    }
                logger.info(
                    "OpenRouter Decision Model (%s) evaluated %d dynamic hypotheses",
                    model,
                    len(answers_summary),
                )
                return answers_summary, model
        except Exception as exc:
            logger.warning("Decision model query failed: %s", exc)

        return {}, None

    def _synthesize_strategy_with_team(
        self,
        request: StrategyRequest,
        brief: SituationBrief,
        decision_answers: dict,
        decision_model: str | None,
    ) -> StrategyDecisionMatrix | None:
        """Have the Agno Pitwall Team dynamically synthesize the StrategyDecisionMatrix."""
        if self.team is None:
            return None

        prob_context = ""
        if decision_answers:
            prob_lines = [
                f"- Hypothesis '{q_info['instructions']}': Probability {q_info['probability']:.1%}"
                for q_info in decision_answers.values()
            ]
            prob_context = (
                f"\nOPENROUTER DECISION MODEL STATISTICAL EVALUATIONS ({decision_model or 'System One'}):\n"
                + "\n".join(prob_lines)
                + "\n"
            )

        prompt = f"""
SITUATION BRIEF:
- Driver: {brief.driver_name or 'Driver ' + brief.driver_number} (#{brief.driver_number}) for {brief.team_name or 'Team'}
- Lap: {brief.current_lap} of {brief.total_laps}
- Position: P{brief.current_position or 1}
- Current Tyres: {brief.tyre_compound} ({brief.tyre_age_laps} laps old, Stint {brief.stint_number})
- Pace Trend: {brief.pace_trend_summary}
- Interval to Car Ahead ({brief.car_ahead or 'Leader'}): {brief.gap_ahead_seconds or 'N/A'}s
- Interval to Car Behind ({brief.car_behind or 'Chaser'}): {brief.gap_behind_seconds or 'N/A'}s
- Net Pit Loss Window: ~{brief.pit_loss_window_seconds}s
{prob_context}
USER STRATEGIC QUERY:
"{request.user_question}"

INSTRUCTIONS:
Collaborate as the Pitwall Strategy Team and synthesize a realistic, mathematically grounded F1 strategy.
Return ONLY a valid JSON object matching the following structure:
{{
  "recommendation": "Concise call (e.g. 'BOX LAP 16: Execute Undercut against Leclerc')",
  "action_type": "UNDERCUT | OVERCUT | EXTEND_STINT | DEFENSIVE_BOX | STAY_OUT",
  "target_compound": "HARD | MEDIUM | SOFT",
  "radio_transmission": "Authentic, punchy pitwall team radio message to driver",
  "primary_plan": "Deep technical explanation of the primary tactic and tyre warm-up / pit exit window",
  "alternative_plan": "Contingency Plan B (e.g. if rival covers or Safety Car intervenes)",
  "risk_assessment": "Pit exit traffic, dirty air, or tyre warm-up risks",
  "confidence_score": 0.85,
  "assumptions": ["Assumption 1", "Assumption 2"]
}}
"""
        try:
            res = self.team.run(prompt)
            content = res.content if hasattr(res, "content") else str(res)
            data = _extract_decision_json(content)
            if data and "recommendation" in data and "action_type" in data:
                return StrategyDecisionMatrix(**data)
        except Exception as exc:
            logger.warning("Agno Team strategy synthesis encountered error: %s", exc)

        return None

    def _fallback_decision_matrix(
        self,
        request: StrategyRequest,
        brief: SituationBrief,
        decision_answers: dict | None = None,
    ) -> StrategyDecisionMatrix:
        """Concise, fail-safe deterministic fallback when external AI models are unreachable."""
        tyre_age = brief.tyre_age_laps
        compound = brief.tyre_compound
        gap_ahead = brief.gap_ahead_seconds
        car_ahead = brief.car_ahead or "Car Ahead"
        laps_remaining = max(0, brief.total_laps - brief.current_lap)

        undercut_prob = None
        cliff_prob = None
        if decision_answers:
            for q_id, q_data in decision_answers.items():
                p = q_data.get("probability")
                q_text = (q_id + " " + q_data.get("instructions", "")).lower()
                if "undercut" in q_text:
                    undercut_prob = p
                elif "cliff" in q_text or "deg" in q_text:
                    cliff_prob = p

        # Tactical decision logic
        if (undercut_prob and undercut_prob >= 0.55) or (gap_ahead is not None and gap_ahead <= 2.8 and tyre_age >= 10):
            action = "UNDERCUT"
            target_compound = "HARD" if laps_remaining > 20 else "MEDIUM"
            recommendation = f"BOX LAP {brief.current_lap + 1}: Execute Undercut against {car_ahead}"
            radio = f"Box next lap, box next lap. We are triggering the undercut on {car_ahead}. New {target_compound} ready!"
            primary_plan = (
                f"Pit on Lap {brief.current_lap + 1} for fresh {target_compound} tyres. "
                f"With a {gap_ahead:.2f}s gap, out-lap pace delta (~1.5s/lap) will jump {car_ahead} upon their stop."
            )
            alt_plan = f"Plan B: If {car_ahead} boxes first, extend by 4 laps to create an offset tyre advantage."
            risks = f"Traffic upon pit exit (~{brief.pit_loss_window_seconds}s loss). Must re-enter in clean air."
            confidence = round(undercut_prob or 0.88, 2)
        elif (cliff_prob and cliff_prob >= 0.60) or (tyre_age >= 22 or "drop-off" in brief.pace_trend_summary.lower()):
            action = "DEFENSIVE_BOX"
            target_compound = "HARD" if laps_remaining > 18 else "SOFT"
            recommendation = f"BOX THIS LAP: Tyres at end of life ({tyre_age} laps on {compound})"
            radio = f"Box box, box box! Confirm box this lap. Fitting {target_compound} to the end."
            primary_plan = f"Pit immediately on Lap {brief.current_lap} for {target_compound} to halt escalating degradation."
            alt_plan = "Plan B: Gamble on an imminent Safety Car or VSC to reduce pit loss to ~12s."
            risks = "Cold tyre warm-up on out-lap and traffic re-entry."
            confidence = round(cliff_prob or 0.85, 2)
        elif (brief.current_position or 1) <= 2 and tyre_age < 12:
            action = "STAY_OUT"
            target_compound = "HARD"
            recommendation = f"STAY OUT: Maintain race lead and manage {compound} tyre delta"
            radio = "Stay out, stay out. Pace is strong and delta is looking very good."
            primary_plan = f"Continue current stint on {compound}. Clean air enables optimal thermal tyre management."
            alt_plan = "Plan B: If car behind triggers an undercut, respond on the subsequent lap."
            risks = "Vulnerability to surprise aggressive undercut from trailing cars."
            confidence = 0.92
        else:
            action = "EXTEND_STINT"
            target_compound = "HARD"
            recommendation = f"EXTEND STINT: Target Lap {brief.current_lap + 4} Pit Window"
            radio = "Extend stint by 4 laps. Tyres still inside the working window."
            primary_plan = f"Hold position on {compound} and target pit window around Lap {brief.current_lap + 4}."
            alt_plan = "Plan B: React immediately if a Virtual Safety Car (VSC) is deployed."
            risks = "Gradual tyre degradation over the next 3 laps."
            confidence = 0.80

        return StrategyDecisionMatrix(
            recommendation=recommendation,
            action_type=action,
            target_compound=target_compound,
            radio_transmission=radio,
            primary_plan=primary_plan,
            alternative_plan=alt_plan,
            risk_assessment=risks,
            confidence_score=confidence,
            assumptions=["Pit lane delta ~22s", "Ambient track temperatures remain stable"],
        )

    def evaluate_decision(
        self, request: StrategyRequest, brief: SituationBrief
    ) -> StrategyDecisionMatrix:
        """Evaluate strategy: AI Dynamic Hypotheses -> Decision Model (Probabilities) -> Agno Strategy Team (Reasoning)."""
        # Step A: Query statistical decision probabilities from OpenRouter Decision Model using dynamic AI hypotheses
        decision_answers, decision_model = self._query_decision_model_probabilities(request, brief)

        # Step B: Have Agno Pitwall Team synthesize the dynamic StrategyDecisionMatrix
        team_matrix = self._synthesize_strategy_with_team(
            request, brief, decision_answers, decision_model
        )
        if team_matrix is not None:
            return team_matrix

        # Step C: Graceful fail-safe fallback if external models are unreachable
        return self._fallback_decision_matrix(request, brief, decision_answers)
