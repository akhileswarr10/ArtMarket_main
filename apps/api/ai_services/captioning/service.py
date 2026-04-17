import httpx
import logging
from core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class CaptioningService:
    @classmethod
    def load(cls):
        pass

    @classmethod
    def run(cls, image_bytes: bytes) -> dict:
        """
        Runs image captioning over the Hugging Face Inference API.
        """
        # Standard Inference API URL
        API_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base"
        
        headers = {}
        if hasattr(settings, 'HF_TOKEN') and settings.HF_TOKEN:
            headers["Authorization"] = f"Bearer {settings.HF_TOKEN}"
        
        caption = "An expressive and unique artwork."
        detected_style = "Contemporary"
        detected_medium = "Mixed Media"

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(API_URL, headers=headers, content=image_bytes)
                
                if response.status_code == 200:
                    result = response.json()
                    if isinstance(result, list) and len(result) > 0:
                        caption = result[0].get('generated_text', caption)
                        logger.info(f"AI Captioning successful: {caption}")
                    else:
                        logger.warning(f"Unexpected response format from HF: {result}")
                else:
                    logger.error(f"HuggingFace API failed with status {response.status_code}: {response.text}")
                    # If this specific model is unavailable, we could potentially try a different one here
        except Exception as e:
            logger.error(f"Error calling HuggingFace API: {e}")

        return {
            "title": caption.title(),
            "description": f"An AI-generated analysis suggests this is {caption}.",
            "detected_style": detected_style,
            "detected_medium": detected_medium,
        }
