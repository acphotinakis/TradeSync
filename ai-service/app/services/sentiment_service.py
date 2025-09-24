import aiohttp
import re
from typing import List, Dict, Any
import logging
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch

logger = logging.getLogger(__name__)


class SentimentService:
    def __init__(self):
        self.sentiment_analyzer = None
        self.financial_terms = {
            "bullish": 0.8,
            "bearish": -0.8,
            "rally": 0.7,
            "plunge": -0.7,
            "growth": 0.6,
            "decline": -0.6,
            "profit": 0.5,
            "loss": -0.5,
            "strong": 0.4,
            "weak": -0.4,
            "positive": 0.6,
            "negative": -0.6,
        }

    async def initialize_models(self):
        """Initialize sentiment analysis models"""
        try:
            # TODO: Load fine-tuned financial sentiment model
            # For now, use general sentiment analysis
            self.sentiment_analyzer = pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                tokenizer="cardiffnlp/twitter-roberta-base-sentiment-latest",
            )
            logger.info("Sentiment model loaded successfully")
        except Exception as e:
            logger.warning(
                f"Could not load transformer model: {e}. Using rule-based fallback."
            )
            self.sentiment_analyzer = None

    async def analyze_sentiment(
        self, text: str, source: str = "news"
    ) -> Dict[str, Any]:
        """Analyze sentiment of financial text"""

        if self.sentiment_analyzer:
            try:
                # Use transformer model if available
                return await self._transformer_analysis(text, source)
            except Exception as e:
                logger.error(f"Transformer analysis failed: {e}")

        # Fallback to rule-based analysis
        return await self._rule_based_analysis(text, source)

    async def _transformer_analysis(self, text: str, source: str) -> Dict[str, Any]:
        """Analyze sentiment using transformer model"""
        result = self.sentiment_analyzer(text[:512])[0]  # Limit input length

        # Map model output to financial sentiment
        label_map = {
            "LABEL_0": "BEARISH",  # Negative
            "LABEL_1": "NEUTRAL",  # Neutral
            "LABEL_2": "BULLISH",  # Positive
        }

        sentiment = label_map.get(result["label"], "NEUTRAL")
        score = result["score"]

        # Adjust for financial context
        financial_score = self._enhance_with_financial_context(text, score, sentiment)

        return {
            "sentiment": sentiment,
            "score": financial_score,
            "confidence": score,
            "key_phrases": self._extract_key_phrases(text),
            "model_type": "transformer",
        }

    async def _rule_based_analysis(self, text: str, source: str) -> Dict[str, Any]:
        """Rule-based sentiment analysis as fallback"""
        text_lower = text.lower()

        # Calculate sentiment score based on financial terms
        sentiment_score = 0.0
        term_count = 0

        for term, weight in self.financial_terms.items():
            if term in text_lower:
                sentiment_score += weight
                term_count += 1

        # Normalize score
        if term_count > 0:
            sentiment_score /= term_count
        else:
            sentiment_score = 0.0

        # Determine sentiment category
        if sentiment_score > 0.1:
            sentiment = "BULLISH"
        elif sentiment_score < -0.1:
            sentiment = "BEARISH"
        else:
            sentiment = "NEUTRAL"

        confidence = min(0.9, abs(sentiment_score) * 3)  # Scale to confidence

        return {
            "sentiment": sentiment,
            "score": abs(sentiment_score),
            "confidence": confidence,
            "key_phrases": self._extract_key_phrases(text),
            "model_type": "rule-based",
        }

    def _enhance_with_financial_context(
        self, text: str, base_score: float, sentiment: str
    ) -> float:
        """Enhance sentiment score with financial context"""
        enhancement = 0.0

        # Check for intensity words
        intensity_boosters = ["very", "extremely", "highly", "strongly", "sharply"]
        for booster in intensity_boosters:
            if booster in text.lower():
                enhancement += 0.1

        # Check for financial-specific intensifiers
        financial_boosters = [
            "surge",
            "plummet",
            "skyrocket",
            "collapse",
            "outperform",
            "underperform",
        ]
        for booster in financial_boosters:
            if booster in text.lower():
                enhancement += 0.2

        final_score = base_score + enhancement
        return min(1.0, final_score)

    def _extract_key_phrases(self, text: str) -> List[str]:
        """Extract key financial phrases from text"""
        phrases = []

        # Look for price movement phrases
        price_patterns = [
            r"(\w+)\s+(up|down)\s+(\d+%)",
            r"(\w+)\s+(gains|losses)\s+of\s+(\d+%)",
            r"(\w+)\s+(rises|falls)\s+to\s+\$?(\d+\.?\d*)",
        ]

        for pattern in price_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                phrases.append(" ".join(match))

        # Extract company mentions
        company_pattern = r"\b([A-Z]{2,5})\b"
        companies = re.findall(company_pattern, text)
        phrases.extend(companies[:3])  # Limit to top 3

        return phrases[:5]  # Return top 5 phrases
