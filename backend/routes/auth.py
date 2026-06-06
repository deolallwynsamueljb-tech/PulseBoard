from fastapi import APIRouter, Depends
from deps import current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(user=Depends(current_user)):
    return {
        "uid":     user["uid"],
        "name":    user.get("name"),
        "email":   user.get("email"),
    }
