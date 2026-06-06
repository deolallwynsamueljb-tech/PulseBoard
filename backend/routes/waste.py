# -*- coding: utf-8 -*-
"""Waste Predictor - 9 herbs, rich dataset, real AI strategy."""
import random, time, math
from fastapi import APIRouter, Depends
from deps import current_user
from services.ai_router import ai_json

router = APIRouter(prefix="/waste", tags=["waste"])

BASE_PRICES = {
    "Basil":    280, "Mint":   180, "Lettuce": 120,
    "Spinach":   95, "Coriander":145, "Rosemary":320,
    "Thyme":    290, "Parsley": 110, "Chives":  195,
}

INVENTORY = {
    "Basil":     {"stock":48,  "daily_demand":42, "co2":0.80, "shelf_days":5, "zone":"A"},
    "Mint":      {"stock":32,  "daily_demand":35, "co2":0.60, "shelf_days":6, "zone":"B"},
    "Lettuce":   {"stock":27,  "daily_demand":19, "co2":1.10, "shelf_days":4, "zone":"C"},
    "Spinach":   {"stock":19,  "daily_demand":17, "co2":0.70, "shelf_days":4, "zone":"B"},
    "Coriander": {"stock":14,  "daily_demand":16, "co2":0.50, "shelf_days":5, "zone":"A"},
    "Rosemary":  {"stock":10,  "daily_demand":8,  "co2":0.90, "shelf_days":8, "zone":"A"},
    "Thyme":     {"stock":9,   "daily_demand":7,  "co2":0.85, "shelf_days":8, "zone":"A"},
    "Parsley":   {"stock":22,  "daily_demand":14, "co2":0.65, "shelf_days":5, "zone":"C"},
    "Chives":    {"stock":13,  "daily_demand":11, "co2":0.75, "shelf_days":6, "zone":"B"},
}

def _vary(v, pct=0.08):
    return max(1, round(v * (1 + random.uniform(-pct, pct))))

def _live_price(herb):
    base = BASE_PRICES.get(herb, 150)
    seed = int(time.time() / 60) + abs(hash(herb)) % 1000
    rng  = random.Random(seed)
    return round(base * (1 + rng.uniform(-0.12, 0.12)))

def _urgency(excess, shelf_days):
    if excess > 10: return "Critical"
    if excess > 5:  return "High"
    if excess > 2:  return "Medium"
    return "Low"

@router.get("/")
async def waste_prediction(user=Depends(current_user)):
    alerts, carbon = [], []
    total_waste_kg = 0
    total_revenue_saved = 0
    donations_possible = []

    for herb, info in INVENTORY.items():
        stock  = _vary(info["stock"])
        demand = _vary(info["daily_demand"])
        excess = stock - demand
        shortage = max(0, -excess)
        price = _live_price(herb)
        flash_price = round(price * 0.70)

        saved_co2 = round(info["co2"] * stock * 0.72, 2)
        carbon.append({
            "herb":             herb,
            "zone":             info["zone"],
            "score":            info["co2"],
            "badge":            "Green" if info["co2"] < 0.8 else ("Moderate" if info["co2"] < 1.2 else "High"),
            "total_saved_kg_co2": saved_co2,
            "shelf_days":       info["shelf_days"],
        })

        if excess > 2:
            total_waste_kg += excess
            revenue_saved = excess * flash_price
            total_revenue_saved += revenue_saved
            donate_kg = min(excess // 3, 5)
            if donate_kg >= 1:
                donations_possible.append({"herb": herb, "kg": donate_kg})
            alerts.append({
                "herb":          herb,
                "excess_kg":     excess,
                "zone":          info["zone"],
                "shelf_days":    info["shelf_days"],
                "urgency":       _urgency(excess, info["shelf_days"]),
                "normal_price":  price,
                "flash_price":   flash_price,
                "flash_sale":    f"{excess}kg {herb} @ Rs.{flash_price}/kg (30% OFF)",
                "revenue_saved": revenue_saved,
                "donation":      f"Donate {donate_kg}kg to local NGO" if donate_kg >= 1 else "",
                "action_by":     "Today 6 PM" if info["shelf_days"] <= 4 else "Tomorrow AM",
                "expiry_risk":   "High" if info["shelf_days"] <= 3 else "Medium" if info["shelf_days"] <= 5 else "Low",
            })
        elif shortage > 2:
            alerts.append({
                "herb":          herb,
                "excess_kg":     -shortage,
                "zone":          info["zone"],
                "shelf_days":    info["shelf_days"],
                "urgency":       "Restock",
                "normal_price":  price,
                "flash_price":   0,
                "flash_sale":    f"Shortage: need {shortage}kg more",
                "revenue_saved": 0,
                "donation":      "",
                "action_by":     "Tomorrow AM",
                "expiry_risk":   "None",
            })

    # sort by urgency
    order = {"Critical":0,"High":1,"Medium":2,"Restock":3,"Low":4}
    alerts.sort(key=lambda a: order.get(a["urgency"], 5))

    return {
        "alerts":             alerts,
        "carbon_scores":      carbon,
        "total_waste_kg":     total_waste_kg,
        "total_revenue_saved":total_revenue_saved,
        "flash_sale_count":   len([a for a in alerts if a["excess_kg"] > 0]),
        "donations_possible": donations_possible,
        "total_herbs":        len(INVENTORY),
        "eco_summary":        f"Farm saved ~{round(sum(c['total_saved_kg_co2'] for c in carbon),1)} kg CO2 vs traditional farming this week.",
    }


@router.get("/ai")
async def ai_waste(user=Depends(current_user)):
    lines = "\n".join(
        f"{h}: {_vary(i['stock'])}kg stock, {_vary(i['daily_demand'])}kg demand, Rs.{_live_price(h)}/kg, shelf {i['shelf_days']}d"
        for h, i in INVENTORY.items()
    )
    prompt = f"""Urban herb farm (9 herbs) waste intelligence — June 2026, summer peak:
{lines}

Upcoming: food festival (2 weeks), wedding season peak, summer cocktail menus.

Provide data-driven waste reduction + flash sale + donation strategy.
Return ONLY valid JSON:
{{"strategy":"two specific lines referencing actual herbs","priority_actions":["specific action 1","specific action 2","specific action 3","specific action 4"],"revenue_opportunity":"Rs.X","sustainability_tip":"one line with CO2 impact","festival_prep":"one line about festival demand","risk_warning":"one line about the biggest spoilage risk"}}"""
    return await ai_json("strategy", prompt, {
        "strategy": "Lettuce (8kg excess) and Parsley (8kg excess) are highest spoilage risks. Launch simultaneous flash sales before 6 PM to maximise recovery.",
        "priority_actions": [
            "Launch Lettuce flash sale Rs.84/kg — clear 8kg by 6 PM before shelf expiry",
            "Bundle Parsley with Chives for chef 'herb mix' at Rs.180/pack — clears 6kg",
            "Pre-book Basil + Rosemary for festival caterers (demand +38%) at locked-in premium price",
            "Donate 5kg surplus to NGO today — qualifies farm for green certification"
        ],
        "revenue_opportunity": "Rs.4,800",
        "sustainability_tip": "Zero-waste run saves 12.4kg CO2 — share on social for chef engagement.",
        "festival_prep": "Pre-sell 20kg Basil + 8kg Rosemary to festival catering partners this week.",
        "risk_warning": "Lettuce shelf life critical — 4 days only, act before 6 PM today."
    })
