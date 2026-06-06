from fastapi import Header, HTTPException

async def current_user(
    x_user_id:    str = Header(...),
    x_user_email: str = Header(""),
    x_user_name:  str = Header(""),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing user ID")
    return {"uid": x_user_id, "email": x_user_email, "name": x_user_name}
