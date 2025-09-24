from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# Trading Signal Schemas
class MarketDataPoint(BaseModel):
    symbol: str
    price: float
    timestamp: int
    volume: float
    change: Optional[float] = None
    changePercent: Optional[float] = None


class TradingSignalRequest(BaseModel):
    symbol: str
    historical_data: List[MarketDataPoint]
    current_price: float
    indicators: Optional[Dict[str, Any]] = None


class TradingSignalResponse(BaseModel):
    signal: str = Field(..., description="BUY, SELL, or HOLD recommendation")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence score")
    reasoning: str = Field(..., description="Explainable AI reasoning for the signal")
    timestamp: datetime
    model_version: str = "1.0.0"


# Sentiment Analysis Schemas
class SentimentRequest(BaseModel):
    text: str
    source: Optional[str] = "news"  # news, social, earnings_call


class SentimentResponse(BaseModel):
    sentiment: str = Field(..., description="BULLISH, BEARISH, or NEUTRAL")
    score: float = Field(..., ge=0.0, le=1.0, description="Sentiment intensity score")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence")
    key_phrases: List[str] = Field(default_factory=list)


# Training Schemas
class TrainingRequest(BaseModel):
    model_type: str = "reinforcement_learning"
    parameters: Dict[str, Any]
    training_data: List[MarketDataPoint]


class TrainingResponse(BaseModel):
    training_id: str
    status: str
    message: str
    metrics: Optional[Dict[str, float]] = None
