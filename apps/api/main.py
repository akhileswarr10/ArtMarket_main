from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import get_settings
from routers import users, artworks, categories, tags, favorites, admin, orders, cart, checkout, notifications, verification

settings = get_settings()
app = FastAPI(
    title="ArtMarket API",
    description="AI-powered artwork marketplace",
    version="1.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


app.include_router(users.router, prefix="/api")
app.include_router(artworks.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(tags.router, prefix="/api")
app.include_router(favorites.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(cart.router, prefix="/api")
app.include_router(checkout.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(verification.router, prefix="/api")