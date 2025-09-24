from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
from datetime import datetime
import logging

app = FastAPI(title="TradeSync AI Service")
logger = logging.getLogger(__name__)

class TradingSignalRequest(BaseModel):
    symbol: str
    historical_data: list
    current_price: float
    indicators: dict = {}

class TradingSignalResponse(BaseModel):
    signal: str  # "BUY", "SELL", "HOLD"
    confidence: float
    reasoning: str
    timestamp: datetime

class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    sentiment: str  # "BULLISH", "BEARISH", "NEUTRAL"
    score: float

@app.post("/ai/trading-signal", response_model=TradingSignalResponse)
async def get_trading_signal(request: TradingSignalRequest):
    """
    Generate AI-powered trading signals based on market data
    """
    try:
        # MVP: Simple moving average strategy
        prices = [data['price'] for data in request.historical_data[-50:]]
        
        if len(prices) < 20:
            return TradingSignalResponse(
                signal="HOLD",
                confidence=0.5,
                reasoning="Insufficient data for analysis",
                timestamp=datetime.utcnow()
            )
        
        short_ma = np.mean(prices[-10:])
        long_ma = np.mean(prices[-20:])
        
        if short_ma > long_ma * 1.005:
            signal = "BUY"
            confidence = min(0.8, (short_ma - long_ma) / long_ma * 100)
            reasoning = f"Short-term trend bullish (MA10: {short_ma:.2f} > MA20: {long_ma:.2f})"
        elif short_ma < long_ma * 0.995:
            signal = "SELL"
            confidence = min(0.8, (long_ma - short_ma) / long_ma * 100)
            reasoning = f"Short-term trend bearish (MA10: {short_ma:.2f} < MA20: {long_ma:.2f})"
        else:
            signal = "HOLD"
            confidence = 0.6
            reasoning = "Market trending sideways"
        
        return TradingSignalResponse(
            signal=signal,
            confidence=confidence,
            reasoning=reasoning,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Error generating trading signal: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing trading signal")

@app.post("/ai/sentiment-analysis", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """
    Basic sentiment analysis for news/text data
    """
    # MVP: Simple keyword-based sentiment analysis
    bullish_keywords = ['bullish', 'growth', 'profit', 'success', 'positive']
    bearish_keywords = ['bearish', 'decline', 'loss', 'risk', 'negative']
    
    text_lower = request.text.lower()
    bullish_count = sum(1 for word in bullish_keywords if word in text_lower)
    bearish_count = sum(1 for word in bearish_keywords if word in text_lower)
    
    if bullish_count > bearish_count:
        sentiment = "BULLISH"
        score = min(1.0, bullish_count / 10)
    elif bearish_count > bullish_count:
        sentiment = "BEARISH"
        score = min(1.0, bearish_count / 10)
    else:
        sentiment = "NEUTRAL"
        score = 0.5
    
    return SentimentResponse(sentiment=sentiment, score=score)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)