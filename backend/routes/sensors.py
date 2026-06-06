"""Live sensor data — varies by time of day for real-feel."""
import math, time, random
from fastapi import APIRouter, Depends
from deps import current_user

router = APIRouter(prefix="/sensors", tags=["sensors"])

def _wave(base, amp, phase=0):
    hour_frac = (time.localtime().tm_hour + time.localtime().tm_min / 60) / 24
    noise = random.uniform(-0.3, 0.3)
    return round(base + amp * math.sin(hour_frac * 2 * math.pi + phase) + noise, 1)

def _vary(base, pct=0.03):
    return round(base * (1 + random.uniform(-pct, pct)), 1)

def live():
    temp     = _wave(23.5, 1.8, phase=0)
    humidity = _wave(67,   4.0, phase=1.2)
    co2      = _vary(418,  0.04)
    light    = _wave(840,  90,  phase=-0.5)
    ph       = _vary(6.2,  0.02)

    def status(v, lo, hi):
        return "Optimal" if lo <= v <= hi else ("High" if v > hi else "Low")

    return {
        "temperature": {
            "value": temp, "unit": "degC",
            "status": status(temp, 21, 26),
            "range": "21-26", "trend": "stable"
        },
        "humidity": {
            "value": humidity, "unit": "%",
            "status": status(humidity, 60, 75),
            "range": "60-75", "trend": "stable"
        },
        "co2": {
            "value": co2, "unit": "ppm",
            "status": status(co2, 380, 600),
            "range": "380-600", "trend": "normal"
        },
        "light": {
            "value": light, "unit": "lux",
            "status": status(light, 700, 1000),
            "range": "700-1000", "trend": "stable"
        },
        "ph": {
            "value": ph, "unit": "pH",
            "status": status(ph, 5.8, 6.8),
            "range": "5.8-6.8", "trend": "stable"
        },
    }

@router.get("/")
async def get_sensors(user=Depends(current_user)):
    return live()
