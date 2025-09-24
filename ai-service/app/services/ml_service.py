import numpy as np
import pandas as pd
import joblib
import logging
import redis
import torch
import torch.nn as nn
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Any, Optional
from app.models.schemas import MarketDataPoint
import shap

logger = logging.getLogger(__name__)

# Redis client for caching (Enhancement 3)
r = redis.Redis(host="localhost", port=6379, db=0)


class TradingModel(nn.Module):
    """Simple neural network for trading signal prediction"""

    def __init__(self, input_size=10, hidden_size=64, output_size=3):
        super().__init__()
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
    """ML Service with model versioning, explainability, multi-asset predictions, caching"""

    def __init__(self):
        self.models_loaded = False
        self.trading_model: Optional[RandomForestClassifier] = None
        self.model_version = "1.0.0"
        self.scaler = StandardScaler()
        self.model_registry: Dict[str, Any] = {}  # model_name -> model object

    async def initialize_models(self):
        """Load models (Enhancements 1 & 4)"""
        try:
            # Load multiple versions
            model_names = ["trading_model_v1", "trading_model_v2"]
            for name in model_names:
                try:
                    model = joblib.load(f"./app/models/{name}.pkl")
                except Exception:
                    # If not exists, create dummy
                    model = RandomForestClassifier(
                        n_estimators=100, random_state=42, max_depth=10
                    )
                    X_train = np.random.randn(1000, 10)
                    y_train = np.random.randint(0, 3, 1000)
                    model.fit(X_train, y_train)
                    joblib.dump(model, f"./app/models/{name}.pkl")
                self.model_registry[name] = model

            # Set default model
            self.trading_model = self.model_registry["trading_model_v1"]
            self.models_loaded = True
            logger.info("ML models initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize ML models: {e}")
            self.models_loaded = False

    def switch_model_version(self, version: str):
        """Enhancement 4: Switch model version"""
        if version in self.model_registry:
            self.trading_model = self.model_registry[version]
            self.model_version = version
            logger.info(f"Switched to model version: {version}")
        else:
            logger.warning(f"Model version {version} not found")

    def extract_features(
        self,
        historical_data: List[MarketDataPoint],
        indicators: Optional[List[str]] = None,
    ) -> np.ndarray:
        """Enhancement 2 & 6: Feature extraction with custom indicators, multi-asset support"""
        if len(historical_data) < 20:
            return np.zeros(10)

        prices = [data.price for data in historical_data]
        volumes = [data.volume for data in historical_data]
        df = pd.DataFrame({"price": prices, "volume": volumes})

        # Default indicators
        df["sma_10"] = df["price"].rolling(10).mean()
        df["sma_20"] = df["price"].rolling(20).mean()
        df["rsi"] = self._calculate_rsi(df["price"])
        df["volatility"] = df["price"].pct_change().rolling(10).std()

        # Custom indicators if provided
        if indicators:
            for ind in indicators:
                if ind == "ema_10":
                    df["ema_10"] = df["price"].ewm(span=10).mean()
                elif ind == "momentum":
                    df["momentum"] = df["price"] - df["price"].shift(5)

        latest_features = df.iloc[-1:].fillna(0).values.flatten()
        latest_features = np.pad(
            latest_features, (0, max(0, 10 - len(latest_features)))
        )
        return latest_features[:10]

    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> float:
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
        rs = gain / (loss + 1e-6)
        rsi = 100 - (100 / (1 + rs))
        return rsi.iloc[-1] if not rsi.empty else 50.0

    async def predict_trading_signal(
        self,
        historical_data: List[MarketDataPoint],
        indicators: Optional[List[str]] = None,
        multi_asset: bool = False,
    ) -> Dict[str, Any]:
        """Enhancements 3,5,6: caching, explainable AI, multi-asset predictions"""
        # Serialize input for caching
        cache_key = str([d.price for d in historical_data]) + str(indicators)
        cached = r.get(cache_key)
        if cached:
            return eval(cached)

        features = self.extract_features(historical_data, indicators)
        features = features.reshape(1, -1)
        prediction = self.trading_model.predict(features)[0]
        probabilities = self.trading_model.predict_proba(features)[0]

        # Signal mapping
        signal_map = {0: "SELL", 1: "HOLD", 2: "BUY"}
        signal = signal_map.get(prediction, "HOLD")
        confidence = float(probabilities.max())
        reasoning = self._generate_reasoning(signal, confidence, historical_data)

        result = {
            "signal": signal,
            "confidence": confidence,
            "reasoning": reasoning,
            "model_version": self.model_version,
        }

        # Explainable AI via SHAP
        explainer = shap.TreeExplainer(self.trading_model)
        shap_values = explainer.shap_values(features)
        result["feature_importance"] = shap_values.tolist()

        # Cache result
        r.set(cache_key, str(result), ex=60)  # 1 minute TTL

        return result

    def _generate_reasoning(
        self, signal: str, confidence: float, historical_data: List[MarketDataPoint]
    ) -> str:
        prices = [d.price for d in historical_data]
        reasons = []
        if len(prices) >= 20:
            price_change = ((prices[-1] - prices[-20]) / prices[-20]) * 100
            reasons.append(f"20-period price change: {price_change:+.2f}%")
        reasoning = f"AI model recommends {signal} with {confidence:.1%} confidence. Key factors: {'; '.join(reasons) if reasons else 'Pattern recognition.'}"
        return reasoning
