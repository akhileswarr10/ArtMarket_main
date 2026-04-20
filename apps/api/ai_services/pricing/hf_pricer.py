import re
import hashlib
from groq import Groq
from core.config import get_settings

settings = get_settings()

# Fast text model for pricing
TEXT_MODEL = "llama-3.3-70b-versatile"


async def generate_price_suggestion(
    caption: str | None,
    medium: str | None,
    style: str | None,
    dimensions: str | None,
) -> float:
    """
    Uses Groq (Llama 3.3 70B) to suggest a fair market price for an artwork.
    Falls back to Gemini or a hash-based price if no key is configured.
    """
    if not settings.GROQ_API_KEY:
        if settings.GEMINI_API_KEY:
            return await _gemini_price(caption, medium, style, dimensions)
        return _fallback_price(caption)

    prompt_lines = [
        "You are an expert professional art appraiser with 20 years of experience.",
        "Based on the following artwork details, provide a fair market retail price in GBP (British Pounds £) for an original artwork:",
        "",
    ]
    if caption:
        prompt_lines.append(f"- Description: {caption}")
    if medium:
        prompt_lines.append(f"- Medium: {medium}")
    if style:
        prompt_lines.append(f"- Style: {style}")
    if dimensions:
        prompt_lines.append(f"- Dimensions: {dimensions}")

    prompt_lines += [
        "",
        "Consider: original artwork (not a print), emerging-to-mid-career artist, current UK market.",
        "Reply with ONLY a single number in GBP (e.g. 950 or 680.50). No currency symbol, no explanation.",
    ]

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)

        response = client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[{"role": "user", "content": "\n".join(prompt_lines)}],
            max_tokens=20,
            temperature=0.4,
        )
        text = response.choices[0].message.content.strip()
        print(f"DEBUG: Groq raw response: '{text}'")
        matches = re.findall(r"[-+]?\d*\.?\d+", text)
        if matches:
            return float(matches[0])

        return _fallback_price(caption)

    except Exception as e:
        print(f"Groq Pricer Error: {e}")
        return _fallback_price(caption)


async def _gemini_price(
    caption: str | None, medium: str | None, style: str | None, dimensions: str | None
) -> float:
    try:
        from google import genai
        from google.genai import types

        prompt_lines = [
            "You are a professional art appraiser. Give a fair market USD price for this artwork:",
        ]
        if caption: prompt_lines.append(f"- Description: {caption}")
        if medium: prompt_lines.append(f"- Medium: {medium}")
        if style: prompt_lines.append(f"- Style: {style}")
        if dimensions: prompt_lines.append(f"- Dimensions: {dimensions}")
        prompt_lines.append("Reply with ONLY a single number in GBP (e.g. 800 or 1200.50). No currency symbol.")

        gclient = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = gclient.models.generate_content(
            model="gemini-2.0-flash",
            contents="\n".join(prompt_lines),
            config=types.GenerateContentConfig(temperature=0.4, max_output_tokens=20),
        )
        text = response.text.strip()
        matches = re.findall(r"[-+]?\d*\.?\d+", text)
        if matches:
            return float(matches[0])
    except Exception as e:
        print(f"Gemini Pricer Error: {e}")

    return _fallback_price(caption)


def _fallback_price(caption: str | None) -> float:
    if caption:
        hash_val = int(hashlib.md5(caption.encode()).hexdigest()[:8], 16)
        return float((hash_val % 4000) + 100)
    return 500.0
