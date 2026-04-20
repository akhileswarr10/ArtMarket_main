import asyncio
from ai_services.pricing.hf_pricer import generate_price_suggestion, _fallback_price
from core.config import get_settings

async def debug_pricing():
    settings = get_settings()
    print(f"GROQ_API_KEY set: {bool(settings.GROQ_API_KEY)}")
    
    test_data = [
        {"caption": "A colorful peacock painting", "medium": "Oil", "style": "Naive Art", "dimensions": "20x30 cm"},
        {"caption": "A sunset over the ocean", "medium": "Acrylic", "style": "Impressionism", "dimensions": "50x70 cm"},
        {"caption": "Abstract geometry", "medium": "Ink", "style": "Minimalist", "dimensions": "10x10 cm"},
    ]
    
    print("\n--- Testing generate_price_suggestion ---")
    for data in test_data:
        # We'll temporarily mock/wrap the internal call to see the raw text
        # Or just modify hf_pricer.py for a moment
        price = await generate_price_suggestion(
            data["caption"], data["medium"], data["style"], data["dimensions"]
        )
        print(f"Input: {data['caption']} -> Price: {price}")
        
    print("\n--- Testing _fallback_price ---")
    for data in test_data:
        fallback = _fallback_price(data["caption"])
        print(f"Input: {data['caption']} -> Fallback Price: {fallback}")

if __name__ == "__main__":
    asyncio.run(debug_pricing())
