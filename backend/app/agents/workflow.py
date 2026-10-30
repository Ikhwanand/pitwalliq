import logging
import time
from agno.workflow.step import Step
from agno.workflow.types import StepInput, StepOutput
from agno.workflow.workflow import Workflow
from backend.app.agents.analyst import RaceDataAnalyst
from backend.app.agents.strategist import ChiefRaceStrategist
from backend.app.schemas.strategy import (
    SituationBrief,
    StrategyDecisionMatrix,
    StrategyEvaluationResponse,
    StrategyRequest,
)

logger = logging.getLogger(__name__)


class RaceStrategyWorkflow(Workflow):
    """Production Agno Workflow orchestrating the two-tier AI Race Strategy pipeline.
    
    Step 1 (Race Data Analyst): Gathers & grounds FastF1 telemetry into a verified SituationBrief.
    Step 2 (Chief Race Strategist): Evaluates tactical game-theory and formulates a DecisionMatrix.
    """

    description: str = "PitwallIQ Formula 1 Two-Tier Strategy Formulation Workflow"
    input_schema: type[StrategyRequest] = StrategyRequest

    def __init__(self, **kwargs) -> None:
        self.analyst = RaceDataAnalyst()
        self.strategist = ChiefRaceStrategist()
        self._current_brief: SituationBrief | None = None
        self._current_matrix: StrategyDecisionMatrix | None = None

        steps = [
            Step(
                name="telemetry_analyst_step",
                description="Extracts and verifies factual FastF1 telemetry into a SituationBrief",
                executor=self._analyst_step_executor,
            ),
            Step(
                name="chief_strategist_step",
                description="Formulates tactical pit stop and race strategy decision matrix from SituationBrief",
                executor=self._strategist_step_executor,
            ),
        ]
        super().__init__(name="PitwallIQ Strategy Workflow", steps=steps, **kwargs)

    async def _analyst_step_executor(self, step_input: StepInput) -> StepOutput:
        """Step 1: Extract and ground telemetry into a SituationBrief."""
        req = step_input.input
        if not isinstance(req, StrategyRequest):
            req = StrategyRequest(**req) if isinstance(req, dict) else req

        brief = await self.analyst.analyze(req)
        self._current_brief = brief
        return StepOutput(content=brief)

    async def _strategist_step_executor(self, step_input: StepInput) -> StepOutput:
        """Step 2: Formulate tactical decision matrix from the verified brief."""
        req = step_input.input
        if not isinstance(req, StrategyRequest):
            req = StrategyRequest(**req) if isinstance(req, dict) else req

        brief = step_input.previous_step_content
        if isinstance(brief, dict):
            brief = SituationBrief(**brief)
        elif not isinstance(brief, SituationBrief):
            brief = self._current_brief

        matrix = self.strategist.evaluate_decision(req, brief)
        self._current_matrix = matrix
        return StepOutput(content=matrix)

    async def execute_strategy_evaluation(
        self, request: StrategyRequest
    ) -> StrategyEvaluationResponse:
        """Run the end-to-end two-tier strategy workflow asynchronously using Agno Workflow."""
        start_time = time.perf_counter()

        logger.info(
            "Executing RaceStrategyWorkflow: Season %d Round %d Driver %s",
            request.season,
            request.round_number,
            request.driver_number,
        )

        # Execute Agno Workflow steps pipeline
        run_output = await self.arun(request)

        # Resolve output matrix & brief
        matrix = (
            run_output.content
            if isinstance(run_output.content, StrategyDecisionMatrix)
            else self._current_matrix
        )
        brief = self._current_brief

        execution_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return StrategyEvaluationResponse(
            request=request,
            situation_brief=brief,
            decision_matrix=matrix,
            execution_time_ms=execution_ms,
            model_provider="Agno Two-Tier Race Strategy Workflow (Steps Pipeline)",
        )


_strategy_workflow_instance: RaceStrategyWorkflow | None = None


def get_strategy_workflow() -> RaceStrategyWorkflow:
    """Dependency injection provider for RaceStrategyWorkflow."""
    global _strategy_workflow_instance
    if _strategy_workflow_instance is None:
        _strategy_workflow_instance = RaceStrategyWorkflow()
    return _strategy_workflow_instance
