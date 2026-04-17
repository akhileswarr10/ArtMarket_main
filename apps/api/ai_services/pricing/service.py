import joblib
import pathlib

class PricingService:
    _model = None

    @classmethod
    def load(cls):
        if cls._model is not None:
            return
        model_path = pathlib.Path(__file__).parent / "model.joblib"
        cls._model = joblib.load(model_path)

    @classmethod
    def predict(cls, medium: str, style: str, dimensions_cm2: float, artist_verified: bool, artist_artwork_count: int) -> dict:
        if cls._model is None:
            cls.load()
            
        import pandas as pd
        features = pd.DataFrame([{
            "medium": medium or "Unknown",
            "style": style or "Unknown",
            "dimensions_cm2": float(dimensions_cm2) if dimensions_cm2 else 0.0,
            "artist_verified": int(artist_verified) if artist_verified else 0,
            "artist_artwork_count": int(artist_artwork_count) if artist_artwork_count else 0
        }])
        
        prediction = cls._model.predict(features)[0]
        
        # Simple confidence rule
        confidence = "medium"
        if prediction < 100:
            confidence = "high"
        elif prediction > 5000:
            confidence = "low"
            
        # Ensure non-negative pricing
        price = max(0.0, round(float(prediction), 2))
            
        return {
            "suggested_price": price,
            "confidence": confidence
        }
