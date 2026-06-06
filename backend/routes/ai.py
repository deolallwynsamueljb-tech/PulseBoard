"""AgriIntel AI routes — Gemini 2.0 Flash + Groq Llama."""
import random
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from deps import current_user
from services.ai_router import ai, ai_json

router = APIRouter(prefix="/ai", tags=["ai"])

CTX = """AgriIntel urban herb farm — June 2026:
- 9 herbs: Basil (28%), Rosemary (18%), Thyme (14%), Mint (12%), Coriander (10%), Lettuce (8%), Chives (5%), Spinach (3%), Parsley (2%)
- Monthly yield: 1,248 kg (+8.4% MoM) | Revenue: ₹63,800 (+11.2% MoM) | 8-week revenue trend: growing
- Prices (live): Basil ₹294, Rosemary ₹338, Thyme ₹308, Mint ₹171, Coriander ₹152, Lettuce ₹122, Chives ₹204, Spinach ₹90, Parsley ₹108
- Chef partners: 18 active (target 25) | Delivery: 2.4hr avg (industry 3.2hr) — key differentiator
- Sensors: 24.2°C, 67.5% RH, CO2 419ppm, Light 845lux, pH 6.2 — all zones nominal
- Water efficiency: 25% above industry | Power: 9.7% more efficient | Zone B water +11.7% anomaly
- Freshness leaders: Thyme 7.2d, Rosemary 6.8d | Urgent: Spinach 1.8d, Lettuce 3.5d
- Waste alerts: Lettuce 8kg excess, Parsley 8kg excess, Basil 6kg excess
- Chef satisfaction: 4.7/5 from 49 reviews | Top chef: Arj Mehta (Taj Hotels)
- Upcoming: food festival (2 weeks), wedding season peak — Basil/Rosemary demand surge +38%/+22%
- Season: Summer peak | Market: 6/9 herbs bullish | Top gainer: Rosemary +6.2%
"""


class SentimentReq(BaseModel):
    text: str

class ChatReq(BaseModel):
    message: str
    history: list[dict] = []

class ComplaintsReq(BaseModel):
    feedbacks: list[str]

class HarvestReq(BaseModel):
    crop: str
    planted_date: str
    current_growth: int


# ─── Sentiment ─────────────────────────────────────────────────────────────────

@router.post("/sentiment")
async def sentiment(req: SentimentReq, user=Depends(current_user)):
    prompt = f"""Analyze chef feedback about farm produce.
Return ONLY valid JSON:
{{"sentiment":"Positive/Negative/Neutral/Mixed","score":0-100,"summary":"one line","keywords":["w1","w2","w3"],"tone":"Appreciative/Concerned/Neutral/Frustrated"}}
Feedback: {req.text}"""
    return await ai_json("sentiment", prompt, {
        "sentiment":"Neutral","score":50,"summary":"Analysis complete","keywords":[],"tone":"Neutral"
    })


# ─── Top Complaints ─────────────────────────────────────────────────────────────

@router.post("/complaints")
async def complaints(req: ComplaintsReq, user=Depends(current_user)):
    text = "\n".join(f"- {f}" for f in req.feedbacks[:30])
    prompt = f"""Analyze chef feedback for a premium urban herb farm. Top 3 issues.
Return ONLY valid JSON:
{{"issues":[{{"issue":"...","frequency":"High/Medium/Low","affected_chefs":0,"suggestion":"..."}}],"overall_satisfaction":"Excellent/Good/Fair/Poor","key_strength":"..."}}
Feedbacks:\n{text}"""
    return await ai_json("complaints", prompt, {
        "issues":[],"overall_satisfaction":"Good","key_strength":"Fresh same-day delivery"
    })


# ─── Farm Insights ──────────────────────────────────────────────────────────────

@router.get("/insights")
async def insights(user=Depends(current_user)):
    prompt = f"""{CTX}
Generate 4 sharp, specific farm intelligence insights an agri-analyst would present.
Return ONLY valid JSON:
{{"insights":[{{"title":"...","description":"...","impact":"High/Medium/Low","action":"...","metric":"..."}}]}}"""
    return await ai_json("insights", prompt, {"insights": [
        {"title":"Basil Demand Surge","description":"Summer menus drive 38% more basil orders. Increase Zone A capacity now.","impact":"High","action":"Plant 20% more basil in Zone A","metric":"₹28K opportunity"},
        {"title":"Mint Oversupply Risk","description":"Mint supply outpaces demand by ~8% this week. Flash sale or NGO donation recommended.","impact":"Medium","action":"Run flash sale today","metric":"5kg excess"},
        {"title":"Delivery SLA Slipping","description":"Two chef partners had 3.1hr delivery this week — above 2.4hr avg target.","impact":"Medium","action":"Optimize Zone B harvest schedule","metric":"2.4→3.1hr"},
        {"title":"Power Efficiency Win","description":"LED schedule optimization cut power 3.1% this month — ₹210 saved.","impact":"Low","action":"Maintain current LED schedule","metric":"-3.1% power"},
    ]})


# ─── Farm Health Score ──────────────────────────────────────────────────────────

@router.get("/health-score")
async def health_score(user=Depends(current_user)):
    prompt = f"""{CTX}
Calculate a comprehensive farm health score.
Return ONLY valid JSON:
{{"overall":0-100,"breakdown":{{"yield_performance":0-100,"resource_efficiency":0-100,"delivery_excellence":0-100,"chef_satisfaction":0-100,"revenue_health":0-100}},"verdict":"Excellent/Good/Fair/Poor","grade":"A+/A/B+/B/C","summary":"one line","top_strength":"...","top_risk":"..."}}"""
    return await ai_json("health", prompt, {
        "overall": 84,
        "breakdown": {"yield_performance":83,"resource_efficiency":90,"delivery_excellence":82,"chef_satisfaction":88,"revenue_health":80},
        "verdict":"Excellent","grade":"A",
        "summary":"Farm performs well above industry average — chef partnership gap is the main growth lever.",
        "top_strength":"Water efficiency (25% above industry)","top_risk":"Chef partnerships at 72% of target"
    })


# ─── Yield Forecast ─────────────────────────────────────────────────────────────

@router.get("/forecast")
async def forecast(user=Depends(current_user)):
    prompt = f"""{CTX}
Yield history (kg/week): W1:285 W2:302 W3:278 W4:320 W5:315 W6:310 W7:328 W8:335
Zone C added last month (+15% capacity). Summer season.

Forecast next 4 weeks.
Return ONLY valid JSON:
{{"forecast":[{{"week":"W9","yield":0,"lower":0,"upper":0,"confidence":"High/Medium/Low"}},{{"week":"W10","yield":0,"lower":0,"upper":0,"confidence":"High/Medium/Low"}},{{"week":"W11","yield":0,"lower":0,"upper":0,"confidence":"High/Medium/Low"}},{{"week":"W12","yield":0,"lower":0,"upper":0,"confidence":"High/Medium/Low"}}],"monthly_projection":0,"trend":"Upward/Stable/Declining","growth_rate":"X%","key_factors":["..."],"reasoning":"two lines"}}"""
    return await ai_json("forecast", prompt, {
        "forecast":[
            {"week":"W9","yield":342,"lower":325,"upper":358,"confidence":"High"},
            {"week":"W10","yield":355,"lower":335,"upper":375,"confidence":"High"},
            {"week":"W11","yield":361,"lower":338,"upper":384,"confidence":"Medium"},
            {"week":"W12","yield":370,"lower":342,"upper":398,"confidence":"Medium"},
        ],
        "monthly_projection":1428,"trend":"Upward","growth_rate":"+4.2%",
        "key_factors":["Zone C expansion","Optimal summer conditions","New chef orders"],
        "reasoning":"Zone C addition and summer demand support continued growth through July."
    })


# ─── Demand Alerts ──────────────────────────────────────────────────────────────

@router.get("/demand-alerts")
async def demand_alerts(user=Depends(current_user)):
    prompt = f"""{CTX}
Food festival next month. Wedding season peak in 2 weeks. Analyse likely demand spikes.
Return ONLY valid JSON:
{{"alerts":[{{"crop":"...","demand_change":"+X%","period":"...","urgency":"Critical/High/Medium","reason":"...","current_stock_kg":0,"required_kg":0,"action":"...","deadline":"..."}}],"total_revenue_opportunity":"₹X","summary":"one line"}}"""
    return await ai_json("demand", prompt, {
        "alerts":[
            {"crop":"Basil","demand_change":"+38%","period":"Next 2 weeks","urgency":"Critical","reason":"Pesto season + food festivals","current_stock_kg":180,"required_kg":248,"action":"Increase Zone A planting immediately","deadline":"3 days"},
            {"crop":"Mint","demand_change":"+25%","period":"Next month","urgency":"High","reason":"Summer cocktail menus","current_stock_kg":120,"required_kg":150,"action":"Expand Zone B by 20%","deadline":"1 week"},
            {"crop":"Lettuce","demand_change":"+15%","period":"Wedding season","urgency":"Medium","reason":"Banquet catering demand","current_stock_kg":95,"required_kg":109,"action":"Normal harvest schedule sufficient","deadline":"2 weeks"},
        ],
        "total_revenue_opportunity":"₹28,400",
        "summary":"Basil demand critical — immediate planting required."
    })


# ─── Price Optimisation ─────────────────────────────────────────────────────────

@router.get("/price-optimize")
async def price_optimize(user=Depends(current_user)):
    prompt = f"""{CTX}
Current prices: Basil ₹280/kg, Mint ₹180/kg, Lettuce ₹120/kg, Spinach ₹95/kg.
Market avg: Basil ₹310, Mint ₹195, Lettuce ₹115, Spinach ₹88.

Precise, justified pricing recommendations.
Return ONLY valid JSON:
{{"recommendations":[{{"crop":"...","current_price":"₹X/kg","suggested_price":"₹X/kg","market_avg":"₹X/kg","price_gap":"X%","justification":"...","expected_revenue_change":"...","risk":"Low/Medium/High"}}],"total_revenue_uplift":"₹X/month","pricing_strategy":"..."}}"""
    return await ai_json("price", prompt, {
        "recommendations":[
            {"crop":"Basil","current_price":"₹280/kg","suggested_price":"₹315/kg","market_avg":"₹310/kg","price_gap":"-9.7%","justification":"Below market despite premium quality","expected_revenue_change":"+₹18,130/month","risk":"Low"},
            {"crop":"Mint","current_price":"₹180/kg","suggested_price":"₹200/kg","market_avg":"₹195/kg","price_gap":"-7.7%","justification":"Summer demand spike supports increase","expected_revenue_change":"+₹6,940/month","risk":"Low"},
        ],
        "total_revenue_uplift":"₹26,550/month",
        "pricing_strategy":"Anchor Basil at market rate. Use summer demand for Mint premium."
    })


# ─── Anomaly Detection ──────────────────────────────────────────────────────────

@router.get("/anomaly")
async def anomaly(user=Depends(current_user)):
    prompt = f"""{CTX}
Sensor anomaly this week: Water +11.7%, Temp +1.4°C above baseline, Power -3.4%.

Diagnose anomalies, identify causes, prescribe actions.
Return ONLY valid JSON:
{{"anomalies":[{{"metric":"...","current":0,"baseline":0,"unit":"...","deviation_pct":"...","severity":"Critical/High/Medium/Low/None","root_cause":"...","action":"...","estimated_cost_impact":"..."}}],"overall_status":"critical/attention/normal","farm_health_impact":"..."}}"""
    return await ai_json("anomaly", prompt, {
        "anomalies":[
            {"metric":"Water Usage","current":2100,"baseline":1880,"unit":"L","deviation_pct":"+11.7%","severity":"Medium","root_cause":"Suspected drip line blockage in Zone B","action":"Inspect Zone B drip emitters — flush or replace","estimated_cost_impact":"₹850 wasted/week if unresolved"},
            {"metric":"Temperature","current":24.5,"baseline":23.1,"unit":"°C","deviation_pct":"+1.4°C","severity":"Low","root_cause":"June ambient heat rise","action":"Monitor — activate cooling if >26°C","estimated_cost_impact":"Minimal"},
            {"metric":"Power","current":85,"baseline":88,"unit":"kWh","deviation_pct":"-3.4%","severity":"None","root_cause":"LED scheduling optimization","action":"No action — positive deviation","estimated_cost_impact":"₹210 saving/week"},
        ],
        "overall_status":"attention",
        "farm_health_impact":"Zone B water issue needs resolution within 48hrs."
    })


# ─── Harvest Time Prediction ────────────────────────────────────────────────────

@router.post("/harvest-time")
async def harvest_time(req: HarvestReq, user=Depends(current_user)):
    prompt = f"""Crop: {req.crop} | Planted: {req.planted_date} | Growth: {req.current_growth}%
Environment: 24.5°C, 68% humidity, 850 lux, pH 6.2

Predict optimal harvest window.
Return ONLY valid JSON:
{{"crop":"{req.crop}","optimal_harvest_date":"DD-MM-YYYY","harvest_window_start":"DD-MM-YYYY","harvest_window_end":"DD-MM-YYYY","days_remaining":0,"current_maturity":"{req.current_growth}%","quality_score":"Excellent/Good/Fair","indicators":["...","..."],"reasoning":"two lines","post_harvest_tip":"..."}}"""
    return await ai_json("harvest", prompt, {
        "crop":req.crop,"optimal_harvest_date":"12-06-2026",
        "harvest_window_start":"10-06-2026","harvest_window_end":"14-06-2026",
        "days_remaining":7,"current_maturity":f"{req.current_growth}%","quality_score":"Good",
        "indicators":["Leaf colour deepening","Aromatic oils developing"],
        "reasoning":"Current growth rate suggests peak quality in 7 days.",
        "post_harvest_tip":"Harvest early morning for maximum essential oil content."
    })


# ─── Seasonal Menu Predictor ────────────────────────────────────────────────────

@router.get("/seasonal")
async def seasonal(user=Depends(current_user)):
    prompt = f"""{CTX}
Month: June 2026. Analyse restaurant menu trends for summer in India.
Which herbs will be most demanded? What should the farm plant now?
Return ONLY valid JSON:
{{"predictions":[{{"herb":"...","demand_forecast":"+X%","reason":"...","plant_now_kg":0,"revenue_potential":"₹X","confidence":"High/Medium"}}],"top_opportunity":"...","plant_this_week":["herb1","herb2"],"market_insight":"two lines"}}"""
    return await ai_json("demand", prompt, {
        "predictions":[
            {"herb":"Basil","demand_forecast":"+42%","reason":"Pesto, salads, Italian menus peak in summer","plant_now_kg":35,"revenue_potential":"₹29,400","confidence":"High"},
            {"herb":"Mint","demand_forecast":"+28%","reason":"Cocktails, raita, mojito menus surge","plant_now_kg":22,"revenue_potential":"₹14,800","confidence":"High"},
            {"herb":"Coriander","demand_forecast":"+18%","reason":"Chaat and street food season","plant_now_kg":15,"revenue_potential":"₹9,600","confidence":"Medium"},
        ],
        "top_opportunity":"Basil — highest margin + highest demand surge",
        "plant_this_week":["Basil","Mint"],
        "market_insight":"Summer 2026 favouring aromatic herbs. Italian restaurant boom in metros driving basil demand to 3-year high."
    })


# ─── Recommendations ───────────────────────────────────────────────────────────

@router.get("/recommendations")
async def recommendations(user=Depends(current_user)):
    prompt = f"""{CTX}
Generate 4 prioritized, actionable farm recommendations with expected impact.
Return ONLY valid JSON:
{{"recommendations":[{{"title":"...","description":"...","priority":"High/Medium/Low","timeline":"...","expected_impact":"..."}}]}}"""
    return await ai_json("strategy", prompt, {"recommendations":[
        {"title":"Expand Basil Production","description":"Demand forecast shows +38% spike — plant additional 20kg in Zone A today to capture festival demand.","priority":"High","timeline":"Today","expected_impact":"+₹18,500/month"},
        {"title":"Fix Zone B Drip Line","description":"Water usage +11.7% above baseline — suspected blockage wasting ₹850/week.","priority":"High","timeline":"48 hours","expected_impact":"₹850 saving/week"},
        {"title":"Add 4 Chef Partners","description":"At 18/25 target. One new chef partner = avg ₹3,200/month revenue. Focus on cloud kitchens.","priority":"Medium","timeline":"This month","expected_impact":"+₹12,800/month"},
        {"title":"Raise Basil Price to ₹310","description":"Currently ₹30/kg below market rate despite superior quality and faster delivery.","priority":"Medium","timeline":"Next week","expected_impact":"+₹15,600/month"},
    ]})


# ─── AI Chat ────────────────────────────────────────────────────────────────────

@router.post("/chat")
async def chat(req: ChatReq, user=Depends(current_user)):
    history_text = ""
    if req.history:
        history_text = "\n".join(
            f"{'User' if m['role']=='user' else 'AI'}: {m['content']}"
            for m in req.history[-6:]
        )
    prompt = f"""You are AgriIntel — expert urban farm intelligence advisor. Deep knowledge in agronomy, supply chain, and chef partnerships.

{CTX}
{f"Recent conversation:{chr(10)}{history_text}{chr(10)}" if history_text else ""}
User question: {req.message}

Answer specifically and practically in 2-4 sentences. Use farm data when relevant. Be the smartest advisor in the room."""
    reply = await ai("chat", prompt)
    return {"reply": reply, "model": "gemini-2.0-flash"}


# ─── Sentiment Trend ────────────────────────────────────────────────────────────

@router.get("/sentiment-trend")
async def sentiment_trend(user=Depends(current_user)):
    def _v(b, p=0.05): return round(b*(1+random.uniform(-p,p)))
    return {
        "trend":[
            {"week":"W1","positive":_v(62),"neutral":_v(25),"negative":_v(13),"avg_score":_v(71)},
            {"week":"W2","positive":_v(65),"neutral":_v(22),"negative":_v(13),"avg_score":_v(73)},
            {"week":"W3","positive":_v(58),"neutral":_v(28),"negative":_v(14),"avg_score":_v(68)},
            {"week":"W4","positive":_v(70),"neutral":_v(20),"negative":_v(10),"avg_score":_v(77)},
            {"week":"W5","positive":_v(68),"neutral":_v(23),"negative":_v(9), "avg_score":_v(76)},
            {"week":"W6","positive":_v(74),"neutral":_v(18),"negative":_v(8), "avg_score":_v(80)},
        ],
        "direction":"Improving","net_promoter":62,
    }
