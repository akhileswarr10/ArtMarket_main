# Replaced dummy so it doesn't need joblib/sklearn
from core.config import get_settings

class PricingService:
    @classmethod
    def load(cls):
        pass

    @classmethod
    def predict(cls, medium: str, style: str, dimensions_cm2: float, artist_verified: bool, artist_artwork_count: int) -> dict:
        settings = get_settings()
        # In the future, this will connect to Groq API
        # GROQ_API_KEY = settings.GROQ_API_KEY
        
        # Basic heuristic for placeholder
        base = 100.0
        if medium and "oil" in medium.lower():
            base = 500.0
        
        price = base + (dimensions_cm2 * 0.5)
        if artist_verified:
            price *= 1.5
            
        return {
            "suggested_price": round(price, 2),
            "confidence": "low"
        }
