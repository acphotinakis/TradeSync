# config.py
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    DEBUG: bool = True

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]

    # ML Model paths
    MODEL_DIR: str = "./app/models"
    TRADING_MODEL_PATH: str = f"{MODEL_DIR}/trading_model.pkl"
    SENTIMENT_MODEL_PATH: str = f"{MODEL_DIR}/sentiment_model"

    # Feature engineering
    LOOKBACK_WINDOW: int = 50
    PREDICTION_HORIZON: int = 5

    # Redis for model caching
    REDIS_URL: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"


settings = Settings()
