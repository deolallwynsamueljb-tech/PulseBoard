"""
AI routing — Groq Llama 70B (analysis) + Groq Llama 8B (fast) + Mistral (chat).
Gemini completely removed. No circular fallbacks.
"""

import httpx
import json
import re
import logging
from config import settings

log = logging.getLogger("ai_router")

GROQ_URL    = "https://api.groq.com/openai/v1/chat/completions"
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"

MISTRAL_SMALL = "mistral-small-latest"
GROQ_FAST     = "llama-3.1-8b-instant"
GROQ_SMART    = "llama-3.3-70b-versatile"


async def _call_openai_compat(url: str, api_key: str, model: str, prompt: str, max_tokens: int = 1400) -> str:
    """Shared OpenAI-compatible POST — used by both Groq and Mistral."""
    async with httpx.AsyncClient(timeout=9) as client:
        res = await client.post(
            url,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": 0.35,
            },
        )
        data = res.json()
        return data["choices"][0]["message"]["content"]


async def ask_groq(prompt: str, model: str = GROQ_SMART) -> str:
    if not settings.GROQ_API_KEY:
        return "{}"
    try:
        return await _call_openai_compat(GROQ_URL, settings.GROQ_API_KEY, model, prompt)
    except Exception as e:
        log.error(f"Groq error ({model}): {e}")
        return "{}"


async def ask_mistral(prompt: str, model: str = MISTRAL_SMALL) -> str:
    if not settings.MISTRAL_API_KEY:
        # No Mistral key → use Groq Fast as equivalent
        return await ask_groq(prompt, GROQ_FAST)
    try:
        result = await _call_openai_compat(MISTRAL_URL, settings.MISTRAL_API_KEY, model, prompt)
        return result
    except Exception as e:
        log.warning(f"Mistral error, falling back to Groq Fast: {e}")
        return await ask_groq(prompt, GROQ_FAST)


def extract_json(text: str, fallback: dict) -> dict:
    if not text or text.strip() in ("{}", ""):
        return fallback
    # Strip markdown code fences
    clean = re.sub(r"```(?:json)?\s*", "", text).strip()
    # Find the largest valid JSON object in the text
    for start in range(len(clean)):
        if clean[start] != "{":
            continue
        depth = 0
        for i, ch in enumerate(clean[start:]):
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    candidate = clean[start : start + i + 1]
                    try:
                        return json.loads(candidate)
                    except Exception:
                        break
    return fallback


TASK_MODEL_MAP = {
    # Mistral Small → fast real-time (falls back to Groq Fast if key invalid)
    "chat":       (ask_mistral, MISTRAL_SMALL),
    "sentiment":  (ask_mistral, MISTRAL_SMALL),
    "anomaly":    (ask_mistral, MISTRAL_SMALL),
    "sensor":     (ask_mistral, MISTRAL_SMALL),
    # Groq 8B → structured output
    "complaints": (ask_groq, GROQ_FAST),
    "summary":    (ask_groq, GROQ_FAST),
    # Groq 70B → deep reasoning
    "insights":   (ask_groq, GROQ_SMART),
    "health":     (ask_groq, GROQ_SMART),
    "price":      (ask_groq, GROQ_SMART),
    "demand":     (ask_groq, GROQ_SMART),
    "forecast":   (ask_groq, GROQ_SMART),
    "harvest":    (ask_groq, GROQ_SMART),
    "strategy":   (ask_groq, GROQ_SMART),
}


async def ai(task: str, prompt: str) -> str:
    fn, model = TASK_MODEL_MAP.get(task, (ask_groq, GROQ_SMART))
    return await fn(prompt, model)


async def ai_json(task: str, prompt: str, fallback: dict) -> dict:
    text = await ai(task, prompt)
    return extract_json(text, fallback)
