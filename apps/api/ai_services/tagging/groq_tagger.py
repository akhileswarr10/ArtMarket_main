import re
from groq import Groq
from core.config import get_settings

settings = get_settings()

TEXT_MODEL = "llama-3.1-8b-instant"


async def generate_tags(caption: str | None, medium: str | None, style: str | None) -> list[str]:
    """
    Uses Groq to generate 5-7 relevant art tags for marketplace discovery.
    Returns a list of lowercase single-word or short-phrase tags.
    """
    if not settings.GROQ_API_KEY:
        return _fallback_tags(caption, style, medium)

    prompt_parts = ["Generate 6 short searchable tags for an artwork with these details:"]
    if caption:
        prompt_parts.append(f"- Description: {caption}")
    if medium:
        prompt_parts.append(f"- Medium: {medium}")
    if style:
        prompt_parts.append(f"- Style: {style}")
    prompt_parts += [
        "",
        "Output ONLY a comma-separated list of tags (e.g.: impressionism, oil painting, landscape, nature, warm tones, contemporary).",
        "Each tag should be 1-3 words, lowercase. No numbering, no explanation.",
    ]

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[{"role": "user", "content": "\n".join(prompt_parts)}],
            max_tokens=80,
            temperature=0.5,
        )
        raw = response.choices[0].message.content.strip()
        tags = [t.strip().lower() for t in raw.split(",") if t.strip()]
        return tags[:7]  # cap at 7
    except Exception as e:
        print(f"Groq Tagger Error: {e}")
        return _fallback_tags(caption, style, medium)


def _fallback_tags(caption: str | None, style: str | None, medium: str | None) -> list[str]:
    tags = []
    if style:
        tags.append(style.lower())
    if medium:
        tags.append(medium.lower())
    tags += ["original artwork", "fine art", "collectible"]
    return tags[:6]
