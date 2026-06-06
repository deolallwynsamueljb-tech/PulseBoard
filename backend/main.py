import asyncio, math, random, time
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, kpis, analytics, feedback, ai, sensors, freshness, market, waste, ml
from database import check_connection, client

@asynccontextmanager
async def lifespan(app: FastAPI):
    await check_connection()
    yield
    if client is not None:
        client.close()

app = FastAPI(title="AgriIntel API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [auth.router, kpis.router, analytics.router, feedback.router,
               ai.router, sensors.router, freshness.router, market.router, waste.router,
               ml.router]:
    app.include_router(router)

@app.get("/health")
async def health():
    from config import settings
    from database import db
    mongo_ok = False
    if db is not None:
        try:
            await db.command("ping")
            mongo_ok = True
        except Exception:
            pass
    return {
        "status": "ok",
        "service": "AgriIntel API v2.0.0",
        "mongodb": "connected" if mongo_ok else "disconnected",
        "ai": {
            "groq":    bool(settings.GROQ_API_KEY),
            "mistral": bool(settings.MISTRAL_API_KEY),
            "gemini":  bool(settings.GOOGLE_API_KEY),
        },
    }

@app.websocket("/ws/sensors")
async def ws_sensors(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            t = time.time()
            await websocket.send_json({
                "temperature": round(24.2 + math.sin(t/60)*0.8  + random.gauss(0,0.12), 1),
                "humidity":    round(67.5 + math.sin(t/90)*2.0  + random.gauss(0,0.4),  1),
                "co2":         round(419  + math.sin(t/120)*12  + random.gauss(0,2.5)       ),
                "light":       round(845  + math.sin(t/45)*30   + random.gauss(0,7)          ),
                "ph":          round(6.2  + math.sin(t/180)*0.08+ random.gauss(0,0.015), 2),
            })
            await asyncio.sleep(3)
    except (WebSocketDisconnect, Exception):
        pass
