# -*- coding: utf-8 -*-
"""Herb Stock Market - 9 herbs, 60-point history, OHLC, real market metrics."""
import time, random, math
from fastapi import APIRouter, Depends
from deps import current_user
from services.ai_router import ai_json

router = APIRouter(prefix="/market", tags=["market"])

BASE_PRICES = {
    "Basil":     {"base": 280, "vol": 0.13, "sector": "Premium Herbs",   "annual_vol": 0.28, "beta": 1.4},
    "Mint":      {"base": 180, "vol": 0.10, "sector": "Aromatic Herbs",  "annual_vol": 0.22, "beta": 1.1},
    "Lettuce":   {"base": 120, "vol": 0.08, "sector": "Salad Greens",    "annual_vol": 0.18, "beta": 0.8},
    "Spinach":   {"base":  95, "vol": 0.09, "sector": "Leafy Greens",    "annual_vol": 0.20, "beta": 0.9},
    "Coriander": {"base": 145, "vol": 0.12, "sector": "Spice Herbs",     "annual_vol": 0.25, "beta": 1.2},
    "Rosemary":  {"base": 320, "vol": 0.15, "sector": "Premium Herbs",   "annual_vol": 0.32, "beta": 1.6},
    "Thyme":     {"base": 290, "vol": 0.14, "sector": "Premium Herbs",   "annual_vol": 0.30, "beta": 1.5},
    "Parsley":   {"base": 110, "vol": 0.07, "sector": "Salad Greens",    "annual_vol": 0.16, "beta": 0.7},
    "Chives":    {"base": 195, "vol": 0.11, "sector": "Aromatic Herbs",  "annual_vol": 0.24, "beta": 1.3},
}

HISTORY_POINTS = 60  # rich 60-point history

def _minute_seed():
    return int(time.time() / 60)

def _rng(herb: str, offset: int = 0) -> random.Random:
    return random.Random(_minute_seed() + offset + abs(hash(herb)) % 9999)

def _price_at(herb: str, seed_offset: int) -> float:
    info = BASE_PRICES[herb]
    rng  = random.Random(seed_offset + abs(hash(herb)) % 9999)
    # GBM-style walk: each step has drift + random shock
    drift = 0.0002
    shock = rng.gauss(0, info["vol"] / math.sqrt(1440))
    day_factor = 1 + drift + shock
    return round(info["base"] * day_factor, 2)

def _history(herb: str):
    """60-point price history with realistic GBM walk."""
    info  = BASE_PRICES[herb]
    base  = info["base"]
    pts   = []
    seed0 = _minute_seed() - HISTORY_POINTS
    price = base * (1 + random.Random(seed0 + abs(hash(herb)) % 9999).uniform(-info["vol"] * 0.5, info["vol"] * 0.5))
    for i in range(HISTORY_POINTS):
        rng   = random.Random(seed0 + i + abs(hash(herb)) % 9999)
        shock = rng.gauss(0, info["vol"] / 8)
        price = max(base * 0.6, price * (1 + shock))
        pts.append(round(price))
    return pts

def _ohlc(herb: str):
    """Open/High/Low/Close for the trading session."""
    info  = BASE_PRICES[herb]
    base  = info["base"]
    rng   = _rng(herb, 500)
    open_ = round(base * (1 + rng.uniform(-info["vol"] * 0.6, info["vol"] * 0.6)))
    hi    = round(open_ * (1 + rng.uniform(0.01, info["vol"] * 0.8)))
    lo    = round(open_ * (1 - rng.uniform(0.01, info["vol"] * 0.8)))
    close = round(open_ * (1 + rng.uniform(-info["vol"] * 0.5, info["vol"] * 0.5)))
    return {"open": open_, "high": max(open_, hi, close), "low": min(open_, lo, close), "close": close}

def _week_stats(herb: str):
    """52-week high/low based on seeded random."""
    info = BASE_PRICES[herb]
    rng  = random.Random(abs(hash(herb)) % 9999 + 12345)
    week_high = round(info["base"] * (1 + info["vol"] * rng.uniform(1.2, 2.0)))
    week_low  = round(info["base"] * (1 - info["vol"] * rng.uniform(0.8, 1.5)))
    return week_high, week_low

def _current_price(herb: str):
    hist    = _history(herb)
    price   = hist[-1]
    prev    = hist[-2] if len(hist) > 1 else price
    change  = round((price - prev) / prev * 100, 2)
    return price, change, hist

@router.get("/")
async def stock_market(user=Depends(current_user)):
    tickers = []
    for herb, info in BASE_PRICES.items():
        price, chg, hist = _current_price(herb)
        ohlc  = _ohlc(herb)
        wh, wl = _week_stats(herb)
        rng   = _rng(herb, 200)
        vol_kg = rng.randint(60, 450)
        day_chg_7 = round(rng.uniform(-info["vol"] * 100, info["vol"] * 100), 1)

        tickers.append({
            "herb":         herb,
            "price":        price,
            "change":       chg,
            "trend":        "bullish" if chg > 1 else ("bearish" if chg < -1 else "stable"),
            "history":      hist,
            "ohlc":         ohlc,
            "week_high":    wh,
            "week_low":     wl,
            "volume_kg":    vol_kg,
            "volume_inr":   f"Rs.{price * vol_kg:,}",
            "market_cap":   f"Rs.{price * rng.randint(120, 350):,}",
            "day_change_7": f"{'+' if day_chg_7 > 0 else ''}{day_chg_7}%",
            "beta":         info["beta"],
            "sector":       info["sector"],
            "rsi":          round(rng.uniform(28, 75), 1),
            "ma_20":        round(info["base"] * (1 + rng.uniform(-0.05, 0.05))),
        })

    # sort: biggest gainers first
    tickers.sort(key=lambda t: t["change"], reverse=True)

    return {
        "tickers":       tickers,
        "last_updated":  time.strftime("%H:%M:%S"),
        "market_status": "Open" if 6 <= time.localtime().tm_hour < 20 else "After Hours",
        "total_herbs":   len(tickers),
        "gainers":       len([t for t in tickers if t["change"] > 0]),
        "losers":        len([t for t in tickers if t["change"] < 0]),
        "market_sentiment": "Bullish" if len([t for t in tickers if t["change"] > 0]) > len(tickers)//2 else "Bearish",
    }


@router.get("/insight")
async def market_insight(user=Depends(current_user)):
    tickers_data = []
    for herb in BASE_PRICES:
        price, chg, hist = _current_price(herb)
        prev_5  = hist[-5] if len(hist) >= 5 else hist[0]
        change_5d = round((price - prev_5) / prev_5 * 100, 1) if prev_5 else 0
        tickers_data.append((herb, price, chg, change_5d))

    # sort by change desc
    tickers_data.sort(key=lambda x: x[2], reverse=True)
    top_gainer  = tickers_data[0]
    top_loser   = tickers_data[-1]
    bullish_cnt = sum(1 for _, _, c, _ in tickers_data if c > 0)

    lines = "\n".join(
        f"  {h}: Rs.{p}/kg | Today: {'+' if c>0 else ''}{c}% | 5-day: {'+' if c5>0 else ''}{c5}%"
        for h, p, c, c5 in tickers_data
    )
    prompt = f"""AgriIntel herb market data — real-time snapshot (June 2026):
{lines}

Market summary: {bullish_cnt}/9 herbs gaining | Top gainer: {top_gainer[0]} (+{top_gainer[2]}%) | Top loser: {top_loser[0]} ({top_loser[2]}%)
Season: Summer peak | Events: Food festival (2 weeks), wedding season
Context: Urban farm, chef partners, premium herbs command 15-35% premium vs commodity

You are a commodity market analyst. Using ONLY the data above, give a sharp 2-sentence market read.
Identify the best BUY signal (undervalued or surging herb), the main RISK (overvalued/supply glut), and a one-line opportunity.

Return ONLY valid JSON (no markdown, no text outside JSON):
{{"insight":"two specific sentences referencing actual herbs and their exact prices/% changes","buy_signal":"{top_gainer[0]}","sell_signal":"{top_loser[0]}","opportunity":"one actionable line with herb names and numbers","risk":"one specific risk with herb name","top_performer":"{top_gainer[0]}","market_mood":"{'Bullish' if bullish_cnt > 4 else 'Bearish' if bullish_cnt < 4 else 'Neutral'}"}}"""
    return await ai_json("price", prompt, {
        "insight": f"{top_gainer[0]} leads with {'+' if top_gainer[2]>0 else ''}{top_gainer[2]}% today at Rs.{top_gainer[1]}/kg. {'Premium herbs outperforming salad greens on festival demand.' if bullish_cnt > 4 else 'Mixed session — monitor inventory levels.'}",
        "buy_signal": top_gainer[0], "sell_signal": top_loser[0],
        "opportunity": f"Increase {top_gainer[0]} allocation — momentum and festival demand aligned.",
        "risk": f"{top_loser[0]} down {top_loser[2]}% — evaluate flash sale or demand pause.",
        "top_performer": top_gainer[0],
        "market_mood": "Bullish" if bullish_cnt > 4 else "Bearish" if bullish_cnt < 4 else "Neutral"
    })
