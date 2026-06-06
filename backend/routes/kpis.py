"""Farm KPIs — real-feel variation on each call."""
import random
from fastapi import APIRouter, Depends
from deps import current_user

router = APIRouter(prefix="/kpis", tags=["kpis"])

def _v(base, pct=0.03):
    return round(base * (1 + random.uniform(-pct, pct)), 1)

@router.get("/")
async def get_kpis(user=Depends(current_user)):
    return {
        "yield":    {"value": _v(1248), "unit": "kg",  "change": _v(8.4,  0.5), "trend": "up",   "good": "up",   "label": "Total Yield"},
        "water":    {"value": _v(8380), "unit": "L",   "change": _v(-5.2, 0.5), "trend": "down", "good": "down", "label": "Water Usage"},
        "power":    {"value": _v(339),  "unit": "kWh", "change": _v(-3.1, 0.5), "trend": "down", "good": "down", "label": "Power Usage"},
        "delivery": {"value": _v(2.4,  0.04), "unit": "hrs", "change": _v(-12.5,0.5),"trend":"down","good":"down","label":"Delivery Time"},
    }

@router.get("/wow")
async def get_wow(user=Depends(current_user)):
    return [
        {"metric": "Crop Yield",  "this_week": _v(312), "last_week": 285, "unit": "kg",  "change": _v(9.5,  0.3), "good": "up"},
        {"metric": "Water Usage", "this_week": _v(2085),"last_week":2280, "unit": "L",   "change": _v(-8.6, 0.3), "good": "down"},
        {"metric": "Power",       "this_week": _v(84),  "last_week": 91,  "unit": "kWh", "change": _v(-7.7, 0.3), "good": "down"},
        {"metric": "Chef Orders", "this_week": _v(49),  "last_week": 41,  "unit": "",    "change": _v(19.5, 0.3), "good": "up"},
    ]
