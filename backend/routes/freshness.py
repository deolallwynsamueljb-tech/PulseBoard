# -*- coding: utf-8 -*-
"""Herb Freshness Predictor - 9 herbs, AI-powered, real-feel data."""
import time, random, math
from fastapi import APIRouter, Depends
from deps import current_user
from services.ai_router import ai_json

router = APIRouter(prefix="/freshness", tags=["freshness"])

BASE_DAYS = {
    "basil":     4.5, "mint":      5.0, "lettuce":  3.5,
    "spinach":   4.0, "coriander": 3.8, "rosemary": 7.0,
    "thyme":     7.5, "parsley":   4.2, "chives":   5.5,
}

BATCHES = {
    "basil":     {"harvested":"Today 6 AM",    "stock_kg":48, "zone":"A", "target_temp": 4,  "target_rh":90},
    "mint":      {"harvested":"Today 5 AM",    "stock_kg":32, "zone":"B", "target_temp": 4,  "target_rh":92},
    "lettuce":   {"harvested":"Yesterday 7PM", "stock_kg":27, "zone":"C", "target_temp": 2,  "target_rh":95},
    "spinach":   {"harvested":"Today 7 AM",    "stock_kg":19, "zone":"B", "target_temp": 2,  "target_rh":95},
    "coriander": {"harvested":"Yesterday 6PM", "stock_kg":14, "zone":"A", "target_temp": 5,  "target_rh":88},
    "rosemary":  {"harvested":"2 days ago",    "stock_kg":10, "zone":"A", "target_temp": 6,  "target_rh":70},
    "thyme":     {"harvested":"2 days ago",    "stock_kg": 9, "zone":"A", "target_temp": 6,  "target_rh":70},
    "parsley":   {"harvested":"Today 6 AM",    "stock_kg":22, "zone":"C", "target_temp": 2,  "target_rh":92},
    "chives":    {"harvested":"Yesterday",     "stock_kg":13, "zone":"B", "target_temp": 4,  "target_rh":90},
}

def _jitter(base, pct=0.06):
    return round(base * (1 + random.uniform(-pct, pct)), 1)

def _freshness_trend(herb, days):
    """Simulate a 24h freshness history (every hour)."""
    seed = int(time.time() / 3600) + abs(hash(herb)) % 999
    pts  = []
    val  = days + random.Random(seed).uniform(0.2, 0.5)
    for i in range(24):
        rng = random.Random(seed + i)
        val = max(0.1, val - rng.uniform(0.01, 0.06))
        pts.append(round(val, 2))
    return pts

@router.get("/")
async def all_freshness(user=Depends(current_user)):
    results = []
    for herb, base in BASE_DAYS.items():
        days  = _jitter(base)
        batch = BATCHES[herb]
        wilt  = days < 2.0
        quality = "Excellent" if days > 5 else "Good" if days > 3.5 else "Fair" if days > 2 else "Urgent"
        color   = "emerald" if days > 3.5 else "amber" if days > 2 else "red"
        trend   = _freshness_trend(herb, days)
        results.append({
            "herb":           herb.capitalize(),
            "freshness_days": days,
            "best_by":        f"{int(days)}d {int((days % 1)*24)}h",
            "stock_kg":       batch["stock_kg"],
            "zone":           batch["zone"],
            "harvested":      batch["harvested"],
            "target_temp":    batch["target_temp"],
            "target_rh":      batch["target_rh"],
            "wilt_alert":     wilt,
            "quality":        quality,
            "color":          color,
            "trend_24h":      trend,
        })
    # sort: most urgent first
    results.sort(key=lambda r: r["freshness_days"])
    return results


@router.get("/ai/{herb}")
async def ai_freshness(herb: str, user=Depends(current_user)):
    herb_l = herb.lower()
    base   = BASE_DAYS.get(herb_l, 4.0)
    days   = _jitter(base)
    batch  = BATCHES.get(herb_l, {"target_temp":4, "target_rh":90, "stock_kg":20, "zone":"A"})
    temp   = round(batch["target_temp"] + random.uniform(-1, 2.5), 1)
    hum    = round(batch["target_rh"]   + random.uniform(-5, 3),   0)

    prompt = f"""Urban herb farm AI freshness analysis.
Herb: {herb.capitalize()}
Storage temp: {temp}degC (optimal: {batch['target_temp']}degC) | Humidity: {hum}% (optimal: {batch['target_rh']}%)
Predicted freshness: {days} days | Stock: {batch['stock_kg']}kg | Zone: {batch['zone']}

Provide precise, actionable freshness advice for chef partner planning.
Return ONLY valid JSON:
{{"herb":"{herb.capitalize()}","freshness_days":{days},"best_by_hours":{int(days*24)},"quality":"Excellent/Good/Fair/Urgent","storage_tip":"specific one-line tip","wilt_signs":["sign1","sign2","sign3"],"chef_recommendation":"what to tell the chef","optimal_use_by":"date advice","confidence":"High/Medium","temperature_ok":{str(abs(temp-batch['target_temp'])<1.5).lower()}}}"""

    return await ai_json("sensor", prompt, {
        "herb": herb.capitalize(), "freshness_days": days,
        "best_by_hours": int(days * 24),
        "quality": "Good",
        "storage_tip": f"Store {herb} at {batch['target_temp']}degC with {batch['target_rh']}% RH in ventilated crisper.",
        "wilt_signs": ["Leaf tip yellowing", "Stem softening at base", "Loss of fragrance intensity"],
        "chef_recommendation": f"Best used within {int(days)} days — ideal for today's service.",
        "optimal_use_by": f"Within {int(days)} days for peak aroma",
        "confidence": "High",
        "temperature_ok": abs(temp - batch["target_temp"]) < 1.5
    })
