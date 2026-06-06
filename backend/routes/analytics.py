# -*- coding: utf-8 -*-
"""AgriIntel analytics — 9 herbs, time-seeded variation, never flat."""
import random, time, math
from fastapi import APIRouter, Depends
from deps import current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

def _v(b, p=0.07):
    """Vary by up to p% — different every call."""
    return round(b * (1 + random.uniform(-p, p)), 1)

def _week_seed(offset=0):
    """Seed by week so same week = same ballpark, but jittered."""
    week_num = int(time.time() / 604800) + offset
    return random.Random(week_num)

# Base weekly revenue — 9 herbs, realistic growth trend
WEEKLY_BASE = [
    {"week":"W1","basil":4200,"mint":3100,"lettuce":2800,"spinach":2300,"coriander":1800,"rosemary":2200,"thyme":1950,"parsley":980,"chives":1270},
    {"week":"W2","basil":4800,"mint":3400,"lettuce":2900,"spinach":2700,"coriander":2100,"rosemary":2450,"thyme":2200,"parsley":1100,"chives":1450},
    {"week":"W3","basil":3900,"mint":2800,"lettuce":2700,"spinach":2500,"coriander":1700,"rosemary":2050,"thyme":1800,"parsley":900, "chives":1180},
    {"week":"W4","basil":5400,"mint":3800,"lettuce":3200,"spinach":2800,"coriander":2400,"rosemary":2800,"thyme":2500,"parsley":1250,"chives":1650},
    {"week":"W5","basil":5100,"mint":3500,"lettuce":3100,"spinach":2900,"coriander":2200,"rosemary":2700,"thyme":2400,"parsley":1200,"chives":1550},
    {"week":"W6","basil":5900,"mint":4100,"lettuce":3500,"spinach":3300,"coriander":2600,"rosemary":3100,"thyme":2750,"parsley":1380,"chives":1820},
    {"week":"W7","basil":6200,"mint":4300,"lettuce":3600,"spinach":3400,"coriander":2700,"rosemary":3300,"thyme":2900,"parsley":1450,"chives":1950},
    {"week":"W8","basil":6600,"mint":4600,"lettuce":3800,"spinach":3500,"coriander":2900,"rosemary":3500,"thyme":3100,"parsley":1550,"chives":2100},
]

CROP_BREAKDOWN = [
    {"name":"Basil",    "value":28,"revenue":29300,"yield_kg":518},
    {"name":"Rosemary", "value":18,"revenue":22400,"yield_kg":198},
    {"name":"Thyme",    "value":14,"revenue":18700,"yield_kg":176},
    {"name":"Mint",     "value":12,"revenue":16200,"yield_kg":347},
    {"name":"Coriander","value":10,"revenue":13100,"yield_kg":188},
    {"name":"Lettuce",  "value": 8,"revenue":10800,"yield_kg":227},
    {"name":"Chives",   "value": 5,"revenue": 8900,"yield_kg":142},
    {"name":"Spinach",  "value": 3,"revenue": 6500,"yield_kg":148},
    {"name":"Parsley",  "value": 2,"revenue": 4200,"yield_kg":112},
]

BENCHMARKS = [
    {"metric":"Yield per sqm",     "yours":4.8, "industry":3.9,  "unit":"kg",   "better":True},
    {"metric":"Water per kg",      "yours":2.1, "industry":2.8,  "unit":"L/kg", "better":True},
    {"metric":"Power per kg",      "yours":0.28,"industry":0.31, "unit":"kWh",  "better":True},
    {"metric":"Avg Delivery Time", "yours":2.4, "industry":3.2,  "unit":"hrs",  "better":True},
    {"metric":"Herbs per sq.ft",   "yours":3.2, "industry":2.6,  "unit":"",     "better":True},
    {"metric":"Chef Retention",    "yours":91,  "industry":74,   "unit":"%",    "better":True},
]

GOALS = [
    {"goal":"Monthly Yield",    "current":1248, "target":1500, "unit":"kg"},
    {"goal":"Revenue",          "current":63800,"target":80000,"unit":"Rs."},
    {"goal":"Chef Partnerships","current":18,   "target":25,   "unit":""},
    {"goal":"Water Efficiency", "current":82,   "target":90,   "unit":"%"},
    {"goal":"Zero-Waste Days",  "current":12,   "target":20,   "unit":" days"},
    {"goal":"Herb Varieties",   "current":9,    "target":12,   "unit":""},
]

@router.get("/revenue")
async def get_revenue(user=Depends(current_user)):
    rows = []
    for r in WEEKLY_BASE:
        row = {"week": r["week"]}
        total = 0
        for k, v in r.items():
            if k == "week":
                continue
            jittered = round(v * (1 + random.gauss(0, 0.08)))
            row[k]    = max(500, jittered)
            total    += row[k]
        row["revenue"] = total
        rows.append(row)
    return rows

@router.get("/sales")
async def get_sales(user=Depends(current_user)):
    return await get_revenue(user)

@router.get("/crops")
async def get_crops(user=Depends(current_user)):
    return [{**c, "revenue":round(c["revenue"]*(1+random.uniform(-0.06,0.06))), "yield_kg":round(c["yield_kg"]*(1+random.uniform(-0.05,0.05)))} for c in CROP_BREAKDOWN]

@router.get("/overview")
async def get_overview(user=Depends(current_user)):
    return {
        "top_category":    "Basil",
        "peak_day":        "Thursday",
        "avg_order_value": round(_v(512, 0.08)),
        "return_rate":     round(_v(3.8, 0.1), 1),
        "satisfaction":    round(_v(4.7, 0.02), 1),
        "total_orders":    round(_v(148, 0.06)),
        "new_chefs":       random.randint(1, 4),
    }

@router.get("/benchmarks")
async def get_benchmarks(user=Depends(current_user)):
    return [
        {**b, "yours": round(_v(b["yours"], 0.04), 2)} for b in BENCHMARKS
    ]

@router.get("/goals")
async def get_goals(user=Depends(current_user)):
    return [
        {**g, "current": round(_v(g["current"], 0.03)) if isinstance(g["current"], (int,float)) else g["current"]}
        for g in GOALS
    ]
