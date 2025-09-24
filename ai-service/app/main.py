# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from app.api.endpoints import trading, sentiment, training
from app.core.config import settings
from app.api.endpoints import rl_training
from app.api.endpoints import model_management, backtest


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load ML models
    from app.services.ml_service import MLService

    app.state.ml_service = MLService()
    await app.state.ml_service.initialize_models()
    print("🤖 AI Service started - ML models loaded")
    yield
    # Shutdown: Cleanup resources
    print("🛑 AI Service shutting down")


app = FastAPI(
    title="TradeSync AI Service",
    description="Machine Learning inference engine for trading strategies and sentiment analysis",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(trading.router, prefix="/ai", tags=["trading"])
app.include_router(sentiment.router, prefix="/ai", tags=["sentiment"])
app.include_router(training.router, prefix="/ai", tags=["training"])
app.include_router(rl_training.router, prefix="/ai", tags=["reinforcement_learning"])
app.include_router(model_management.router, prefix="/ai", tags=["model_management"])
app.include_router(backtest.router, prefix="/ai", tags=["backtest"])


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-service",
        "version": "1.0.0",
        "models_loaded": hasattr(app.state, "ml_service")
        and app.state.ml_service.models_loaded,
    }


@app.get("/")
async def root():
    return {"message": "TradeSync AI Service - Machine Learning inference engine"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG
    )
