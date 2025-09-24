from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from typing import List, Dict, Any
import re
import logging

logger = logging.getLogger(__name__)


class SentimentService:
    """Financial sentiment analysis with transformer + rule-based fallback"""

    def __init__(self):
        self.sentiment_analyzer = None
        self.financial_terms = {
            "bullish": 0.8,
            "bearish": -0.8,
            "rally": 0.7,
            "plunge": -0.7,
        }

    async def initialize_models(self):
        """Load fine-tuned financial sentiment model"""
        try:
            self.sentiment_analyzer = pipeline(
                "sentiment-analysis",
                model="yiyanghkust/finbert-tone",
                tokenizer="yiyanghkust/finbert-tone",
            )
            logger.info("Financial sentiment model loaded")
        except Exception as e:
            logger.warning(f"Fallback to rule-based sentiment: {e}")
            self.sentiment_analyzer = None

    async def analyze_sentiment(
        self, text: str, source: str = "news"
    ) -> Dict[str, Any]:
        if self.sentiment_analyzer:
            try:
                return await self._transformer_analysis(text)
            except:
                return await self._rule_based_analysis(text)
        return await self._rule_based_analysis(text)

    async def _transformer_analysis(self, text: str) -> Dict[str, Any]:
        result = self.sentiment_analyzer(text[:512])[0]
        label_map = {"positive": "BULLISH", "neutral": "NEUTRAL", "negative": "BEARISH"}
        sentiment = label_map.get(result["label"].lower(), "NEUTRAL")
        return {
            "sentiment": sentiment,
            "score": result["score"],
            "confidence": result["score"],
            "key_phrases": self._extract_key_phrases(text),
            "model_type": "finbert",
        }

    async def _rule_based_analysis(self, text: str) -> Dict[str, Any]:
        score = sum(
            [self.financial_terms.get(word, 0) for word in text.lower().split()]
        )
        sentiment = (
            "BULLISH" if score > 0.1 else "BEARISH" if score < -0.1 else "NEUTRAL"
        )
        return {
            "sentiment": sentiment,
            "score": abs(score),
            "confidence": min(0.9, abs(score)),
            "key_phrases": self._extract_key_phrases(text),
            "model_type": "rule-based",
        }

    def _extract_key_phrases(self, text: str) -> List[str]:
        return re.findall(r"\b[A-Z]{2,5}\b", text)[:5]
