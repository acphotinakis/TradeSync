# ai-service/app/api/endpoints/train_model.py

from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.schemas import TrainingRequest, TrainingResponse
from app.services import training_service
import uuid
import logging
from datetime import datetime
import asyncio
import pandas as pd

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory storage for training jobs (replace with Redis in production)
training_jobs = {}


async def train_model_async(job_id: str, training_data: list, parameters: dict):
    """
    Background task for model training using training_service.
    """
    try:
        # Initialize job status
        training_jobs[job_id] = {
            "status": "training",
            "progress": 0,
            "start_time": datetime.utcnow(),
            "parameters": parameters,
        }

        # Convert list of dicts to pandas DataFrame
        df = pd.DataFrame(training_data)
        target_column = parameters.get("target_column", "target")

        # Step 1: Preprocessing
        X, y = training_service.preprocess_data(df, target_column)

        # Step 2: Train model
        model, metrics = training_service.train_model(X, y, parameters)

        # Step 3: Save model
        model_path = training_service.save_model(model, parameters.get("model_name"))

        # Update job progress to 100%
        training_jobs[job_id].update(
            {
                "status": "completed",
                "progress": 100,
                "end_time": datetime.utcnow(),
                "metrics": metrics,
                "model_path": model_path,
            }
        )

    except Exception as e:
        training_jobs[job_id].update(
            {"status": "failed", "error": str(e), "end_time": datetime.utcnow()}
        )
        logger.error(f"Training job {job_id} failed: {e}")


@router.post("/train-model", response_model=TrainingResponse)
async def train_model(request: TrainingRequest, background_tasks: BackgroundTasks):
    """
    Start a new model training job (Reinforcement Learning or supervised learning)
    """
    try:
        job_id = str(uuid.uuid4())

        # Store initial job info
        training_jobs[job_id] = {
            "model_type": request.model_type,
            "status": "queued",
            "parameters": request.parameters,
            "created_at": datetime.utcnow(),
        }

        # Start background training task
        background_tasks.add_task(
            train_model_async, job_id, request.training_data, request.parameters
        )

        return TrainingResponse(
            training_id=job_id,
            status="queued",
            message=f"Training job {job_id} started successfully",
            metrics=None,
        )

    except Exception as e:
        logger.error(f"Error starting training job: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error starting training job: {str(e)}"
        )


@router.get("/training-status/{job_id}")
async def get_training_status(job_id: str):
    """
    Get status of a training job
    """
    job = training_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Training job not found")
    return job
