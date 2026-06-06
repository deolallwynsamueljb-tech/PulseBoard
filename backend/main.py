from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, kpis, analytics, feedback, ai, sensors, freshness, market, waste

app = FastAPI(title="AgriIntel API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [auth.router, kpis.router, analytics.router, feedback.router,
               ai.router, sensors.router, freshness.router, market.router, waste.router]:
    app.include_router(router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "AgriIntel API v2.0.0"}
