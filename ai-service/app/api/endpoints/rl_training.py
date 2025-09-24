from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.services.rl_service import RLService
import uuid
from typing import List
import numpy as np

router = APIRouter()
rl_jobs = {}

@router.post("/train-rl")
async def train_rl(training_data: List[List[float]], background_tasks: BackgroundTasks):
    """Start RL training job in background"""
    job_id = str(uuid.uuid4())
    rl_jobs[job_id] = {"status": "queued"}

    def _train():
        rl_service = RLService()
        result = rl_service.train_agent(np.array(training_data))
        rl_jobs[job_id].update({"status": "completed", "result": result})

    background_tasks.add_task(_train)
    return {"job_id": job_id, "status": "queued"}

@router.get("/rl-status/{job_id}")
async def rl_status(job_id: str):
    job = rl_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="RL job not found")
    return job
