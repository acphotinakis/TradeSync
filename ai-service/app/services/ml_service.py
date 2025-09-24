import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import torch
import torch.nn as nn
from typing import List, Dict, Any
import logging
from app.models.schemas import MarketDataPoint

logger = logging.getLogger(__name__)


class TradingModel(nn.Module):
    """Simple neural network for trading signal prediction"""

    def __init__(self, input_size=10, hidden_size=64, output_size=3):
        super(TradingModel, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, hidden_size)
        self.fc3 = nn.Linear(hidden_size, output_size)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)

    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.relu(self.fc2(x))
        x = self.dropout(x)
        x = self.fc3(x)
        return x


class MLService:
    def __init__(self):
        self.models_loaded = False
        self.trading_model = None
        self.sentiment_model = None
        self.scaler = StandardScaler()
        self.model_version = "1.0.0"

    async def initialize_models(self):
        """Initialize and load ML models"""
        try:
            # TODO: Load pre-trained models from disk
            # For now, initialize with simple models
            self.trading_model = RandomForestClassifier(
                n_estimators=100, random_state=42, max_depth=10
            )

            # Train on initial dummy data
            self._train_initial_model()

            self.models_loaded = True
            logger.info("ML models initialized successfully")

        except Exception as e:
            logger.error(f"Error initializing ML models: {e}")
            # Fallback to rule-based system
            self.models_loaded = False

    def _train_initial_model(self):
        """Train initial model with synthetic data"""
        # Synthetic training data for initial model
        X_train = np.random.randn(1000, 10)  # 10 features
        y_train = np.random.randint(0, 3, 1000)  # 3 classes: BUY, SELL, HOLD

        self.trading_model.fit(X_train, y_train)

    def extract_features(self, historical_data: List[MarketDataPoint]) -> np.ndarray:
        """Extract technical indicators and features from market data"""
        if len(historical_data) < 20:
            # Not enough data, return default features
            return np.zeros(10)

        prices = [data.price for data in historical_data]
        volumes = [data.volume for data in historical_data]

        # Calculate technical indicators
        df = pd.DataFrame({"price": prices, "volume": volumes})

        # Simple technical indicators
        df["sma_10"] = df["price"].rolling(10).mean()
        df["sma_20"] = df["price"].rolling(20).mean()
        df["rsi"] = self._calculate_rsi(df["price"])
        df["volume_sma"] = df["volume"].rolling(10).mean()
        df["price_change"] = df["price"].pct_change()
        df["volatility"] = df["price_change"].rolling(10).std()

        # Use the latest available values
        latest_features = df.iloc[-1:].fillna(0).values.flatten()

        # Pad or truncate to 10 features
        if len(latest_features) > 10:
            latest_features = latest_features[:10]
        elif len(latest_features) < 10:
            latest_features = np.pad(latest_features, (0, 10 - len(latest_features)))

        return latest_features

    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> float:
        """Calculate Relative Strength Index"""
        if len(prices) < period + 1:
            return 50.0  # Neutral RSI

        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))

        return rsi.iloc[-1] if not rsi.empty else 50.0

    async def predict_trading_signal(
        self, symbol: str, historical_data: List[MarketDataPoint], current_price: float
    ) -> Dict[str, Any]:
        """Generate trading signal using ML model"""

        if not self.models_loaded or len(historical_data) < 20:
            # Fallback to rule-based system if model not ready or insufficient data
            return await self._rule_based_signal(historical_data, current_price)

        try:
            # Extract features from historical data
            features = self.extract_features(historical_data)
            features = features.reshape(1, -1)

            # Predict using ML model
            prediction = self.trading_model.predict(features)[0]
            probabilities = self.trading_model.predict_proba(features)[0]

            # Map prediction to signal
            signal_map = {0: "SELL", 1: "HOLD", 2: "BUY"}
            signal = signal_map.get(prediction, "HOLD")
            confidence = float(probabilities.max())

            reasoning = self._generate_reasoning(signal, confidence, historical_data)

            return {
                "signal": signal,
                "confidence": confidence,
                "reasoning": reasoning,
                "model_version": self.model_version,
            }

        except Exception as e:
            logger.error(f"Error in ML prediction: {e}")
            # Fallback to rule-based system
            return await self._rule_based_signal(historical_data, current_price)

    async def _rule_based_signal(
        self, historical_data: List[MarketDataPoint], current_price: float
    ) -> Dict[str, Any]:
        """Rule-based fallback trading signal"""
        if len(historical_data) < 10:
            return {
                "signal": "HOLD",
                "confidence": 0.5,
                "reasoning": "Insufficient data for analysis",
                "model_version": "rule-based-1.0",
            }

        prices = [data.price for data in historical_data]

        # Simple moving average strategy
        short_window = min(10, len(prices))
        long_window = min(20, len(prices))

        short_ma = np.mean(prices[-short_window:])
        long_ma = np.mean(prices[-long_window:])

        if short_ma > long_ma * 1.01:  # 1% threshold
            signal = "BUY"
            confidence = min(0.8, (short_ma - long_ma) / long_ma * 50)
            reasoning = f"Short-term trend bullish (MA{short_window}: {short_ma:.2f} > MA{long_window}: {long_ma:.2f})"
        elif short_ma < long_ma * 0.99:  # 1% threshold
            signal = "SELL"
            confidence = min(0.8, (long_ma - short_ma) / long_ma * 50)
            reasoning = f"Short-term trend bearish (MA{short_window}: {short_ma:.2f} < MA{long_window}: {long_ma:.2f})"
        else:
            signal = "HOLD"
            confidence = 0.6
            reasoning = "Market trending sideways - waiting for clearer signal"

        return {
            "signal": signal,
            "confidence": confidence,
            "reasoning": reasoning,
            "model_version": "rule-based-1.0",
        }

    def _generate_reasoning(
        self, signal: str, confidence: float, historical_data: List[MarketDataPoint]
    ) -> str:
        """Generate explainable AI reasoning for the signal"""
        prices = [data.price for data in historical_data]

        reasons = []
        if len(prices) >= 20:
            price_change = ((prices[-1] - prices[-20]) / prices[-20]) * 100
            reasons.append(f"20-period price change: {price_change:+.2f}%")

        if len(prices) >= 10:
            volatility = (
                np.std(
                    [
                        (prices[i] - prices[i - 1]) / prices[i - 1]
                        for i in range(1, len(prices))
                    ]
                )
                * 100
            )
            reasons.append(f"Recent volatility: {volatility:.2f}%")

        reasoning = f"AI model recommends {signal} with {confidence:.1%} confidence. "
        reasoning += (
            "Key factors: " + "; ".join(reasons)
            if reasons
            else "Based on pattern recognition."
        )

        return reasoning
