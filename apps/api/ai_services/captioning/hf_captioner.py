import base64
import hashlib
import httpx
from groq import Groq
from core.config import get_settings

settings = get_settings()

# Groq vision model — supports image understanding
VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


async def analyze_artwork(image_url: str) -> dict:
    """
    Analyzes an artwork image using Groq's high-fidelity vision model.
    Returns a dict with 'caption' and 'style' keys.
    Falls back to Gemini or hardcoded values if Groq fails.
    """
    if not settings.GROQ_API_KEY:
        if settings.GEMINI_API_KEY:
            return await _gemini_analyze(image_url)
        return {"caption": _fallback_caption(image_url), "style": "Contemporary"}

    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as http:
            img_response = await http.get(image_url)
            img_response.raise_for_status()
            image_bytes = img_response.content
            content_type = img_response.headers.get("content-type", "image/jpeg").split(";")[0]

        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{content_type};base64,{b64_image}"

        client = Groq(api_key=settings.GROQ_API_KEY)

        response = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": data_url}},
                        {
                            "type": "text",
                            "text": (
                                "You are a professional art historian and curator at a major gallery. Analyze this artwork image with extreme accuracy.\n\n"
                                "1. GENERATE A TITLE: Create a short, evocative, creative title for this artwork (2-6 words). It should feel like a real gallery title — poetic, not generic.\n"
                                "2. PROVIDE A DESCRIPTION: Write 1 evocative, professional sentence (under 30 words) describing the visual essence, "
                                "composition, and mood. Do not start with 'A painting of'.\n"
                                "3. IDENTIFY THE STYLE: Identify the specific historical or contemporary art style (e.g., Abstract Expressionism, "
                                "Surrealism, Photorealism, Street Art, Minimalist, Ukiyo-e, Baroque). Response must be 1-3 words only.\n"
                                "4. SUGGEST TAGS: Provide exactly 6 short, lowercase, searchable tags relevant to this artwork "
                                "for marketplace discovery (e.g., oil painting, landscape, warm tones, nature, impressionism, original art). "
                                "Each tag must be 1-3 words. Comma-separated.\n\n"
                                "RESPONSE FORMAT:\n"
                                "TITLE: [Artwork title]\n"
                                "DESCRIPTION: [Your analysis]\n"
                                "STYLE: [Style label]\n"
                                "TAGS: [tag1, tag2, tag3, tag4, tag5, tag6]"
                            ),
                        },
                    ],
                }
            ],
            max_tokens=220,
            temperature=0.4,
        )

        raw = response.choices[0].message.content.strip()
        caption, style, tags, title = _parse_analysis(raw, image_url)
        return {"caption": caption, "style": style, "tags": tags, "title": title}

    except Exception as e:
        print(f"Groq Captioner Error: {e}")
        if settings.GEMINI_API_KEY:
            return await _gemini_analyze(image_url)
        return {"caption": _fallback_caption(image_url), "style": "Contemporary", "tags": [], "title": None}


# Keep backward-compat alias
async def generate_caption(image_url: str) -> str | None:
    result = await analyze_artwork(image_url)
    return result.get("caption")


def _parse_analysis(raw: str, image_url: str) -> tuple[str, str | None, list[str], str | None]:
    """Parse the TITLE/DESCRIPTION/STYLE/TAGS structured response."""
    caption = _fallback_caption(image_url)
    style = None
    tags: list[str] = []
    title: str | None = None
    for line in raw.splitlines():
        line = line.strip()
        if line.upper().startswith("TITLE:"):
            raw_title = line.split(":", 1)[1].strip().strip("[]\"'")
            title = raw_title.title() if raw_title else None
        elif line.upper().startswith("DESCRIPTION:"):
            caption = line.split(":", 1)[1].strip()
        elif line.upper().startswith("STYLE:"):
            style_raw = line.split(":", 1)[1].strip()
            style = style_raw.strip("[]\"'").strip()
        elif line.upper().startswith("TAGS:"):
            tags_raw = line.split(":", 1)[1].strip().strip("[]")
            tags = [t.strip().lower().strip("'\"") for t in tags_raw.split(",") if t.strip()][:7]
    return caption, style or None, tags, title


async def _gemini_caption(image_url: str) -> str:
    """Fallback path using Google Gemini if Groq key not set."""
    try:
        from google import genai
        from google.genai import types

        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as http:
            img_response = await http.get(image_url)
            img_response.raise_for_status()
            image_bytes = img_response.content
            content_type = img_response.headers.get("content-type", "image/jpeg").split(";")[0]

        gclient = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = (
            "Describe this artwork in 2-3 evocative sentences for an art marketplace: "
            "composition, colors, style, mood, subject. Under 60 words."
        )
        response = gclient.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Content(parts=[
                    types.Part(text=prompt),
                    types.Part(inline_data=types.Blob(mime_type=content_type, data=image_bytes)),
                ])
            ],
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini Captioner Error: {e}")
        return _fallback_caption(image_url)


async def _gemini_analyze(image_url: str) -> dict:
    """Fallback path using Gemini for both caption and style."""
    try:
        from google import genai
        from google.genai import types

        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as http:
            img_response = await http.get(image_url)
            img_response.raise_for_status()
            image_bytes = img_response.content
            content_type = img_response.headers.get("content-type", "image/jpeg").split(";")[0]

        gclient = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = (
            "Analyze this artwork and respond in this EXACT format:\n\n"
            "DESCRIPTION: [2-3 evocative sentences about composition, colors, mood. Under 60 words.]\n"
            "STYLE: [Single art style label, 1-3 words, e.g. Impressionism, Abstract, Realism]"
        )
        response = gclient.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Content(parts=[
                    types.Part(text=prompt),
                    types.Part(inline_data=types.Blob(mime_type=content_type, data=image_bytes)),
                ])
            ],
        )
        caption, style, tags, title = _parse_analysis(response.text.strip(), image_url)
        return {"caption": caption, "style": style, "tags": tags, "title": title}
    except Exception as e:
        print(f"Gemini Analyze Error: {e}")
        return {"caption": _fallback_caption(image_url), "style": None, "tags": [], "title": None}



def _fallback_caption(image_url: str) -> str:
    hash_val = int(hashlib.md5(image_url.encode()).hexdigest()[:8], 16)
    adjectives = ["stunning", "vibrant", "moody", "ethereal", "bold", "expressive", "luminous", "dramatic"]
    subjects = [
        "landscape bathed in golden light",
        "portrait full of quiet emotion",
        "abstract composition of sweeping color",
        "floral arrangement of delicate beauty",
        "cityscape alive with texture and energy",
        "geometric study of form and contrast",
    ]
    return f"A {adjectives[hash_val % len(adjectives)]} {subjects[(hash_val // 10) % len(subjects)]}."
