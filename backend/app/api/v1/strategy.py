from fastapi import APIRouter, Depends, HTTPException
from backend.app.agents.workflow import RaceStrategyWorkflow, get_strategy_workflow
from backend.app.schemas.common import StandardResponse
from backend.app.schemas.strategy import StrategyEvaluationResponse, StrategyRequest

router = APIRouter(prefix="/strategy", tags=["AI Strategy Assistant"])


@router.post("/evaluate", response_model=StandardResponse[StrategyEvaluationResponse])
async def evaluate_strategy(
    request: StrategyRequest,
    workflow: RaceStrategyWorkflow = Depends(get_strategy_workflow),
) -> StandardResponse[StrategyEvaluationResponse]:
    """Execute the Agno Two-Tier Race Strategy Workflow.
    
    1. Analyzes live/historical FastF1 telemetry into a grounded SituationBrief.
    2. Formulates tactical strategy options (Undercut, Overcut, Box Now, Extend) into a StrategyDecisionMatrix.
    """
    try:
        result = await workflow.execute_strategy_evaluation(request)
        return StandardResponse(
            data=result,
            message=f"Strategy evaluated for driver {request.driver_number}: {result.decision_matrix.recommendation}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute AI strategy workflow: {str(e)}",
        )
