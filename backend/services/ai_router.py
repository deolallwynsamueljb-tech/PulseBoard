"""
AI routing — Groq Llama 70B (analysis) + Groq Llama 8B (fast) + Mistral (chat).
Full fallback chain: SMART → FAST → "{}"
"""

import httpx
import json
import re
import logging
from config import settings

log = logging.getLogger("ai_router")

GROQ_URL    = "https://api.groq.com/openai/v1/chat/completions"
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"

MISTRAL_SMALL  = "mistral-small-latest"
GROQ_FAST      = "llama-3.1-8b-instant"
GROQ_SMART     = "llama-3.3-70b-versatile"
GROQ_VISION    = "meta-llama/llama-4-scout-17b-16e-instruct"


class RateLimitError(Exception):
    pass


async def _call_openai_compat(url: str, api_key: str, model: str, prompt: str, max_tokens: int = 1400) -> str:
    """Shared OpenAI-compatible POST — Groq and Mistral."""
    async with httpx.AsyncClient(timeout=25) as client:
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
        if res.status_code == 429:
            err = res.text[:200]
            log.warning(f"Rate limited ({model}): {err[:120]}")
            raise RateLimitError(f"429 {model}")
        if res.status_code != 200:
            err = res.text[:300]
            log.error(f"API {res.status_code} from {url} model={model}: {err}")
            raise httpx.HTTPStatusError(f"HTTP {res.status_code}: {err}", request=res.request, response=res)
        data = res.json()
        if "choices" not in data or not data["choices"]:
            log.error(f"No choices in response from {model}: {data}")
            raise ValueError(f"Empty choices: {data.get('error', data)}")
        return data["choices"][0]["message"]["content"]


async def ask_groq(prompt: str, model: str = GROQ_SMART) -> str:
    if not settings.GROQ_API_KEY:
        return "{}"
    try:
        return await _call_openai_compat(GROQ_URL, settings.GROQ_API_KEY, model, prompt)
    except RateLimitError:
        if model != GROQ_FAST:
            log.warning(f"Groq 70B rate limited, trying {GROQ_FAST}…")
            try:
                return await _call_openai_compat(GROQ_URL, settings.GROQ_API_KEY, GROQ_FAST, prompt)
            except (RateLimitError, Exception) as e2:
                log.warning(f"Groq fast also rate limited: {e2}")
        return "{}"
    except Exception as e:
        log.error(f"Groq error ({model}): {e}")
        if model != GROQ_FAST:
            log.warning(f"Retrying with {GROQ_FAST}…")
            try:
                return await _call_openai_compat(GROQ_URL, settings.GROQ_API_KEY, GROQ_FAST, prompt)
            except Exception as e2:
                log.error(f"Groq fast fallback also failed: {e2}")
        return "{}"


async def ask_mistral(prompt: str, model: str = MISTRAL_SMALL) -> str:
    if not settings.MISTRAL_API_KEY:
        return await ask_groq(prompt, GROQ_FAST)
    try:
        return await _call_openai_compat(MISTRAL_URL, settings.MISTRAL_API_KEY, model, prompt)
    except Exception as e:
        log.warning(f"Mistral error, falling back to Groq: {e}")
        return await ask_groq(prompt, GROQ_FAST)


def extract_json(text: str, fallback: dict) -> dict:
    if not text or text.strip() in ("{}", ""):
        return fallback
    clean = re.sub(r"```(?:json)?\s*", "", text).strip()
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
    "chat":       (ask_groq, GROQ_SMART),
    "sentiment":  (ask_mistral, MISTRAL_SMALL),
    "anomaly":    (ask_mistral, MISTRAL_SMALL),
    "sensor":     (ask_mistral, MISTRAL_SMALL),
    "complaints": (ask_groq, GROQ_FAST),
    "summary":    (ask_groq, GROQ_FAST),
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


async def ask_groq_vision(image_base64: str, herb_name: str = "", image_type: str = "image/jpeg") -> str:
    """Send image + text prompt to Groq vision model."""
    if not settings.GROQ_API_KEY:
        return "{}"
    prompt_text = (
        f"You are a strict agricultural quality inspector. The user claims this image shows: {herb_name or 'an herb'}.\n\n"
        "STEP 1 — Validate the image:\n"
        "If the image does NOT show any plant, herb, or vegetable (e.g. it's a face, object, random photo, "
        "screenshot, or is too dark/blurry to assess), you MUST set invalid_image:true and quality_score:0. "
        "Do NOT fabricate a plant inspection for non-plant images.\n\n"
        "STEP 2 — If it IS a plant/herb, be a strict inspector. Deduct heavily for:\n"
        "- Yellowing or browning leaves\n"
        "- Wilting or drooping stems\n"
        "- Pest holes, bite marks, or visible insects\n"
        "- Mold, slime, rot, or dark spots\n"
        "- Dryness, curling, or pale colour\n\n"
        "Grading (strict — do NOT round up):\n"
        "Premium 85-100: Perfect, vibrant, zero visible issues\n"
        "Good 65-84: Minor cosmetic issues only, still market-ready\n"
        "Fair 45-64: Noticeable wilt, slight yellowing, minor pest marks\n"
        "Poor 25-44: Significant wilt, yellowing/browning, moderate damage\n"
        "Spoiled 0-24: Mold, rot, severe damage, unsafe to serve\n\n"
        "Return ONLY valid JSON, no markdown:\n"
        '{"invalid_image":false,"quality_score":0-100,"grade":"Premium/Good/Fair/Poor/Spoiled",'
        '"confidence":0-100,"issues":["specific visible issues or empty array"],'
        '"freshness_estimate":"X-Y days remaining","color_analysis":"specific colour/texture description",'
        '"wilt_detected":false,"pest_damage":false,'
        '"recommendation":"one specific actionable recommendation",'
        '"refund_eligible":false,"refund_percentage":0}'
    )
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": GROQ_VISION,
                    "messages": [{
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": f"data:{image_type};base64,{image_base64}"}},
                            {"type": "text", "text": prompt_text},
                        ],
                    }],
                    "max_tokens": 500,
                    "temperature": 0.1,
                },
            )
            if res.status_code != 200:
                log.error(f"Groq vision {res.status_code}: {res.text[:200]}")
                return "{}"
            data = res.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        log.error(f"Groq vision error: {e}")
        return "{}"
