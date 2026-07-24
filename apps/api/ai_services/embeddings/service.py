"""
Text embedding service using HuggingFace Inference API.
Model: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions, free tier).
Token: settings.HF_TOKEN — already defined in core/config.py.
"""
import httpx
from core.config import get_settings

settings = get_settings()

HF_EMBED_URL = (
    "https://router.huggingface.co/hf-inference/models/"
    "sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"
)
HF_EMBED_URL_FALLBACK = (
    "https://api-inference.huggingface.co/pipeline/feature-extraction/"
    "sentence-transformers/all-MiniLM-L6-v2"
)


async def generate_artwork_embedding(
    title: str | None,
    description: str | None,
    medium: str | None,
    style: str | None,
    tags: list[str] | None,
) -> list[float] | None:
    """
    Returns a 384-dim embedding vector built from the artwork's text metadata.
    Returns None on any failure — never raises, so the pipeline stays alive.
    """
    parts = [
        title or "",
        description or "",
        medium or "",
        style or "",
        " ".join(tags or []),
    ]
    text = " ".join(p for p in parts if p).strip()
    if not text:
        return None

    headers = {"Authorization": f"Bearer {settings.HF_TOKEN}"}
    payload = {"inputs": text, "options": {"wait_for_model": True}}

    for url in [HF_EMBED_URL, HF_EMBED_URL_FALLBACK]:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                if isinstance(data, list) and len(data) > 0:
                    if isinstance(data[0], float):
                        return data
                    if isinstance(data[0], list):
                        # mean-pool token embeddings (fallback for some model variants)
                        n = len(data[0])
                        return [sum(row[i] for row in data) / len(data) for i in range(n)]
        except Exception as e:
            print(f"[embeddings] HF API error on {url}: {e}")
    return None
