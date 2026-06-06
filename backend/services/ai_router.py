"""
Multi-model AI routing:
  Gemini 1.5 Flash  → real-time (sentiment, chat, anomaly)
  Groq Llama 8B     → fast summaries (complaints, keywords)
  Groq Llama 70B    → analysis + forecasting (insights, health, price, forecast)
"""

import httpx
import json
import re
from config import settings

GEMINI_URL  = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
GROQ_URL    = "https://api.groq.com/openai/v1/chat/completions"

GEMINI_FLASH = "gemini-2.0-flash"
GROQ_FAST    = "llama-3.1-8b-instant"      # Haiku equivalent
GROQ_SMART   = "llama-3.3-70b-versatile"   # Sonnet/Opus equivalent


async def ask_gemini(prompt: str, model: str = GEMINI_FLASH) -> str:
    url = GEMINI_URL.format(model=model, key=settings.GEMINI_API_KEY)
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 2048},
    }
    async with httpx.AsyncClient(timeout=30) as client:
        res  = await client.post(url, json=payload)
        data = res.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            return str(data)


async def ask_groq(prompt: str, model: str = GROQ_SMART) -> str:
    if not settings.GROQ_API_KEY:
        return await ask_gemini(prompt)          # fallback to Gemini
    async with httpx.AsyncClient(timeout=45) as client:
        res = await client.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 1500,
                "temperature": 0.3,
            },
        )
        data = res.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError):
            return await ask_gemini(prompt)      # fallback


def extract_json(text: str, fallback: dict) -> dict:
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if not match:
        return fallback
    try:
        return json.loads(match.group())
    except Exception:
        return fallback


TASK_MODEL_MAP = {
    # Gemini Flash — sub-second real-time
    "sentiment":  (ask_gemini, GEMINI_FLASH),
    "chat":       (ask_gemini, GEMINI_FLASH),
    "anomaly":    (ask_gemini, GEMINI_FLASH),
    "sensor":     (ask_gemini, GEMINI_FLASH),
    # Groq 8B — ultra-fast structured output
    "complaints": (ask_groq, GROQ_FAST),
    "summary":    (ask_groq, GROQ_FAST),
    # Groq 70B — powerful reasoning
    "insights":   (ask_groq, GROQ_SMART),
    "health":     (ask_groq, GROQ_SMART),
    "price":      (ask_groq, GROQ_SMART),
    "demand":     (ask_groq, GROQ_SMART),
    "forecast":   (ask_groq, GROQ_SMART),
    "harvest":    (ask_groq, GROQ_SMART),
    "strategy":   (ask_groq, GROQ_SMART),
}


async def ai(task: str, prompt: str) -> str:
    fn, model = TASK_MODEL_MAP.get(task, (ask_gemini, GEMINI_FLASH))
    return await fn(prompt, model)


async def ai_json(task: str, prompt: str, fallback: dict) -> dict:
    text = await ai(task, prompt)
    return extract_json(text, fallback)
