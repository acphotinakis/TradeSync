# sentiment.py
from fastapi import APIRouter, HTTPException, Request
from app.models.schemas import SentimentRequest, SentimentResponse
from app.services.sentiment_service import SentimentService
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/sentiment-analysis", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest, http_request: Request):
    """
    Analyze sentiment of financial text (news, social media, earnings calls)
    """
    try:
        # In a real implementation, we'd get this from app state
        # For now, create a new service instance
        sentiment_service = SentimentService()
        await sentiment_service.initialize_models()

        # Analyze sentiment
        sentiment_data = await sentiment_service.analyze_sentiment(
            text=request.text, source=request.source or "news"
        )

        return SentimentResponse(
            sentiment=sentiment_data["sentiment"],
            score=sentiment_data["score"],
            confidence=sentiment_data["confidence"],
            key_phrases=sentiment_data["key_phrases"],
        )

    except Exception as e:
        logger.error(f"Error in sentiment analysis: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error processing sentiment analysis: {str(e)}"
        )
