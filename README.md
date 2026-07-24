# ArtMarket - Project Complete

## What Was Built

### Backend (apps/api)
- FastAPI application with JWT authentication via python-jose
- SQLAlchemy 2.0 async models for all domain entities
- Repositories for User, Artwork, Category, Tag, Order, Cart, Notification operations
- RESTful API endpoints:
  - `/api/users/*` - Current user profile and onboarding
  - `/api/artworks/*` - Artwork CRUD, listing, and image uploads (Supabase presign)
  - `/api/categories`, `/api/tags` - Taxonomy
  - `/api/favorites` - User favorites
  - `/api/admin/*` - Admin operations, analytics, and moderation
  - `/api/orders/*`, `/api/cart/*`, `/api/checkout/*` - E-commerce flows (Cart, Checkout, Orders)
  - `/api/notifications/*` - In-app notifications
  - `/api/verification/*` - Artist verification
  - `/api/ai/*` - AI pipeline for auto-captioning and pricing suggestions
  - `/api/recommendations/*` - Personalised recommendations and buyer feeds using pgvector
- Integration with Groq / Gemini APIs for AI-powered suggestions
- **AI Text Embedding Pipeline**: Custom embedding generation service using HuggingFace's Inference API with `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions)
- **Vector Search & Recommendation Engine**: Integration of `pgvector` inside PostgreSQL/Supabase to compute cosine similarity matching (`<=>`) for similar artworks and buyer recommendation feeds based on centroid calculation of user favorites.

### Frontend (apps/web)
- Next.js 14 App Router structure with Tailwind CSS
- Supabase SSR client setup for seamless Auth (server, client, middleware)
- Pages:
  - `/` - Homepage
  - `/login`, `/register`, `/onboard` - Auth and onboarding flows
  - `/artworks` - Browse artworks with filters (shows personalized recommendations first)
  - `/artworks/[id]` - Artwork detail (shows 'Similar price' and 'AI picks for you' recommendation rails)
  - `/artist/dashboard` - Artist portal
  - `/buyer/favorites` - Buyer favorites
  - `/admin/dashboard` - Admin panel
  - `/cart`, `/checkout`, `/orders`, `/purchase` - Shopping cart and checkout flows
  - `/settings` - User settings
- **PersonalisedFeed Component**: Integrates user's favorited items plus 3 recommended items (AI picks and trending fallback) as a compact, horizontal scrolling rail on the Buyer Dashboard and Marketplace page.

### Infrastructure
- Supabase RLS policies (`supabase/rls_policies.sql`)
- Database Schema (`database_schema.sql`)
- Environment configuration templates

## Setup Required

### 1. Configure Supabase
- Create project at supabase.com
- Enable Auth (Email/Password)
- Create "artworks" storage bucket (private)
- Enable Realtime on notifications table

### 2. Configure Environment
Create `apps/api/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql+asyncpg://...@db.xxx.supabase.co:6543/postgres
DATABASE_MIGRATION_URL=postgresql+asyncpg://...@db.xxx.supabase.co:5432/postgres
GROQ_API_KEY=your-groq-api-key
CELERY_BROKER_URL=redis://localhost:6379/0
HF_TOKEN=your-huggingface-api-token
```

Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

### 3. Run Migrations
```bash
cd apps/api
pip install -r requirements.txt
alembic upgrade head
```

### 4. Start Services
```bash
# Backend
cd apps/api
uvicorn main:app --reload

# Frontend
cd apps/web
npm install
npm run dev
```

## Project Exit Criteria Complete
- ✅ All backend endpoints implemented (Auth, Artworks, Orders, AI, Admin, etc.)
- ✅ Frontend pages created covering all features
- ✅ Supabase RLS policies defined
- ✅ JWT verification working
- ✅ E-commerce checkout flow implemented
- ✅ AI pipeline integrated