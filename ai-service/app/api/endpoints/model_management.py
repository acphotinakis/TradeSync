from fastapi import APIRouter, Request

router = APIRouter()

@router.post("/model-switch/{version}")
async def switch_model(version: str, request: Request):
    ml_service = request.app.state.ml_service
    ml_service.switch_model_version(version)
    return {"status": "ok", "new_version": ml_service.model_version}
