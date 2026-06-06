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
    # Visual fingerprints for each of the 9 supported herbs
    HERB_VISUAL = {
        "Basil":     "broad oval leaves, deep to bright green, smooth surface, slightly glossy, strong upright stems",
        "Mint":      "small to medium oval leaves with serrated edges, bright green, slightly wrinkled texture, square stems",
        "Rosemary":  "needle-like narrow leaves, dark green on top / pale underside, woody stems, dense clusters",
        "Thyme":     "very tiny oval leaves, grey-green colour, thin woody stems, leaves arranged in opposite pairs",
        "Coriander": "flat feathery leaves, bright fresh green, delicate lacy edges (like flat parsley but rounder)",
        "Lettuce":   "large ruffled or smooth broad leaves, pale to mid-green or red-tinged, crisp and watery-looking",
        "Spinach":   "dark green oval leaves, smooth or slightly crinkled, thick midrib, short stems",
        "Chives":    "long hollow tubular grass-like leaves, bright green, uniform thin cylinders standing upright",
        "Parsley":   "bright green curly or flat leaves, deeply divided, crisp texture, multi-branched stems",
    }
    herb_visual_hint = HERB_VISUAL.get(herb_name, "green plant leaves")
    supported = ", ".join(HERB_VISUAL.keys())

    prompt_text = (
        f"You are an expert agricultural quality inspector for AgriIntel urban herb farm.\n"
        f"This system only handles 9 herbs: {supported}.\n\n"

        f"The user selected herb: {herb_name or 'Unknown'}.\n"
        f"Visual profile of {herb_name or 'this herb'}: {herb_visual_hint}.\n\n"

        "STEP 1 — IMAGE VALIDATION (critical):\n"
        f"Look at the image carefully. Ask: does this image show {herb_name or 'a supported herb'}?\n"
        "Set invalid_image:true if ANY of these are true:\n"
        "  - The image is a screenshot, UI, text, chart, diagram, or computer screen\n"
        "  - The image shows a person, face, animal, vehicle, building, or non-plant object\n"
        "  - The image shows cooked food, a dish, or processed product\n"
        "  - The image is too dark, blurry, or low-resolution to identify the plant\n"
        "  - The plant does NOT visually match ANY of the 9 supported herbs\n"
        "If invalid_image is true, stop — return quality_score:0, do not fabricate herb data.\n\n"

        "STEP 2 — HERB MATCH CHECK:\n"
        f"If the image shows a herb but it does NOT look like {herb_name}, still analyse it but note the mismatch in issues.\n\n"

        "STEP 3 — QUALITY INSPECTION (be strict, do NOT round up scores):\n"
        "Inspect leaf colour, texture, stem condition, and any visible damage:\n"
        "  Premium  85-100: Vibrant colour, firm leaves, zero defects — restaurant-ready\n"
        "  Good     65-84 : Slight cosmetic marks only, still fully market-ready\n"
        "  Fair     45-64 : Noticeable wilt, yellowing, or minor pest marks — use today\n"
        "  Poor     25-44 : Significant yellowing/browning, wilting, moderate pest damage\n"
        "  Spoiled   0-24 : Mold, rot, slime, severe damage — do not serve\n\n"

        "Return ONLY valid JSON (no markdown, no extra text):\n"
        '{"invalid_image":false,"quality_score":0,"grade":"Premium/Good/Fair/Poor/Spoiled",'
        '"confidence":0,"issues":["list specific visible defects or empty array"],'
        '"freshness_estimate":"X-Y days remaining",'
        '"color_analysis":"describe exact colour and texture you see",'
        '"wilt_detected":false,"pest_damage":false,'
        '"recommendation":"one specific actionable step for this herb",'
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
