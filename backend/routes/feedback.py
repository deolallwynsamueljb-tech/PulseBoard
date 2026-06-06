from fastapi import APIRouter, Depends
from pydantic import BaseModel
from deps import current_user
from datetime import datetime
import uuid

router = APIRouter(prefix="/feedback", tags=["feedback"])

_store: list = []

class FeedbackIn(BaseModel):
    customer_name: str
    text: str
    rating: int


@router.post("/")
async def add_feedback(body: FeedbackIn, user=Depends(current_user)):
    doc = {
        "_id": str(uuid.uuid4()),
        **body.model_dump(),
        "uid": user["uid"],
        "created_at": datetime.utcnow().isoformat(),
    }
    _store.append(doc)
    return {"id": doc["_id"]}


@router.get("/")
async def list_feedback(user=Depends(current_user)):
    return [d for d in reversed(_store) if d["uid"] == user["uid"]]
