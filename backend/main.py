import asyncio, math, random, time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, kpis, analytics, feedback, ai, sensors, freshness, market, waste, ml

app = FastAPI(title="AgriIntel API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://pulseboard-gamma-cyan.vercel.app",
    ],
    allow_origin_regex=r"https://pulseboard.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [auth.router, kpis.router, analytics.router, feedback.router,
               ai.router, sensors.router, freshness.router, market.router, waste.router,
               ml.router]:
    app.include_router(router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "AgriIntel API v2.0.0"}

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
