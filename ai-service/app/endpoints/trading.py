from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from app.models.schemas import TradingSignalRequest, TradingSignalResponse
from app.services.ml_service import MLService
from fastapi import Request
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/trading-signal", response_model=TradingSignalResponse)
async def get_trading_signal(request: TradingSignalRequest, http_request: Request):
    """
    Generate AI-powered trading signal for a given symbol and market data
    """
    try:
        # Get ML service from app state
        ml_service: MLService = http_request.app.state.ml_service

        # Generate trading signal
        signal_data = await ml_service.predict_trading_signal(
            symbol=request.symbol,
            historical_data=request.historical_data,
            current_price=request.current_price,
        )

        return TradingSignalResponse(
            signal=signal_data["signal"],
            confidence=signal_data["confidence"],
            reasoning=signal_data["reasoning"],
            timestamp=datetime.utcnow(),
            model_version=signal_data["model_version"],
        )

    except Exception as e:
        logger.error(f"Error generating trading signal: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error processing trading signal: {str(e)}"
        )


@router.get("/model-status")
async def get_model_status(http_request: Request):
    """Get current status of ML models"""
    ml_service: MLService = http_request.app.state.ml_service

    return {
        "models_loaded": ml_service.models_loaded,
        "model_version": ml_service.model_version,
        "service_status": "operational",
    }
