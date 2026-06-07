from fastapi import Header

async def current_user(
    x_user_id:    str = Header(""),
    x_user_email: str = Header(""),
    x_user_name:  str = Header(""),
):
    return {"uid": x_user_id or "anonymous", "email": x_user_email, "name": x_user_name}
