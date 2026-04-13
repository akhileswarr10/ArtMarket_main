# diff.md — Build Phases & Delivery Order

---

## Phase 0 — Foundation Freeze
**Goal:** No code written. All decisions locked. Infrastructure spun up.

### What it Adds
- Supabase project created (Auth enabled, email provider configured)
- Supabase Storage bucket `artworks` created (private by default)
- Supabase Realtime enabled on `notifications` table
- 6 planning documents complete: context.md, claude.md, diff.md, api_contract.md, db_schema.md, role_model.md

### Dependencies
- Supabase account
- Stripe account (sandbox mode)
- Redis instance (local Docker for development)

### Done When
- [ ] Supabase project URL and anon/service keys are available
- [ ] Storage bucket `artworks` exists with upload policy configured
- [ ] Realtime is enabled on the Supabase project
- [ ] All 6 documents reviewed and signed off
- [ ] Local `.env` files for both apps are populated

---

## Phase 1 — Auth + Profiles + Artwork CRUD
**Goal:** An artist can sign up, log in, create an artwork, and upload images. A buyer can sign up and browse.

### What it Adds

#### Backend (FastAPI)
- Database migrations (Alembic) for: `users`, `artist_profiles`, `buyer_profiles`, `artworks`, `artwork_images`, `categories`, `tags`, `artwork_tags`
- `GET /api/health` — liveness check
- Auth webhook handler: `POST /api/auth/webhook` — creates User row on signup
- Onboarding: `POST /api/users/me/onboard` — sets role, creates profile
- User info: `GET /api/users/me`
- Artwork CRUD: `POST /api/artworks`, `GET /api/artworks/{id}`, `PATCH /api/artworks/{id}`, `DELETE /api/artworks/{id}`
- Artwork image upload: `POST /api/artworks/{id}/images/presign`, `POST /api/artworks/{id}/images/confirm`
- Artist artwork list: `GET /api/artworks/mine`
- Categories: `GET /api/categories`
- Tags: `GET /api/tags`
- JWT verification middleware (python-jose)
- Repository pattern: `UserRepository`, `ArtworkRepository`, `ArtworkImageRepository`

#### Frontend (Next.js)
- Auth pages: `/login`, `/register`
- Onboarding page: `/register/complete`
- Dashboard redirect: `/dashboard` → `/artist/dashboard` or `/buyer/dashboard`
- Artist dashboard: `/artist/dashboard` (artwork list)
- Artist upload page: `/artist/upload`
- Buyer dashboard: `/buyer/dashboard` (placeholder)
- `@supabase/ssr` auth integration (cookies, middleware)
- TanStack Query setup, Zustand auth store

### Dependencies
- Phase 0 complete

### Done When
- [ ] Artist can sign up and be redirected to onboarding
- [ ] Artist can create an artwork with metadata
- [ ] Artist can upload an image via presign/confirm flow
- [ ] Image appears in artist dashboard
- [ ] Buyer can sign up and reach buyer dashboard
- [ ] `GET /api/artworks/{id}` returns artwork with images
- [ ] All authenticated routes reject requests without valid JWT
- [ ] `GET /api/users/me` returns correct role from JWT

---

## Phase 2 — AI Pipeline
**Goal:** After an artwork is published, AI generates title/description suggestions and a pricing suggestion. Artist is notified.

### What it Adds

#### Backend (FastAPI + Celery)
- Database migrations for: `ai_jobs`, `notifications`
- Celery app setup with Redis broker
- `POST /api/artworks/{id}/publish` — sets status=published, enqueues AIJob
- `GET /api/artworks/{id}/ai-suggestions` — returns AIJob result
- `POST /api/ai/jobs/{id}/apply` — applies AI suggestions to artwork fields
- Celery task: `run_captioning(artwork_id)` — downloads image via signed URL, runs BLIP-2
- Celery task: `run_pricing(artwork_id)` — runs scikit-learn regression
- On task completion: writes AIJob.result, creates Notification row
- Notifications: `GET /api/notifications`, `PATCH /api/notifications/{id}/read`

#### Frontend (Next.js)
- Artist dashboard: AI suggestions panel (shows pending/done state)
- Notification bell with unread count (Supabase Realtime subscription)
- Toast notification on AI job completion
- Apply suggestions UI (pre-fills form fields, artist confirms)

### Dependencies
- Phase 1 complete
- BLIP-2 model available (download checkpoint or use API)
- Trained scikit-learn pricing model (or stub returning price range)
- Redis running

### Done When
- [ ] Publishing an artwork creates an AIJob with status=queued
- [ ] Celery worker picks up task within 5 seconds
- [ ] BLIP-2 generates a caption for the uploaded image
- [ ] Pricing suggestion is returned
- [ ] AIJob.status transitions to `done`
- [ ] Notification row is created for the artist
- [ ] Artist's browser receives Realtime notification push without page refresh
- [ ] AI suggestions appear in artist dashboard
- [ ] Artist can apply suggestions (artwork fields update)

---

## Phase 3 — Browse + Discovery
**Goal:** Buyers can browse published artworks, search, filter, and save favorites.

### What it Adds

#### Backend (FastAPI)
- Database migrations for: `favorites`
- `GET /api/artworks` — public listing with filters (category, price range, style, medium), sort (newest, price, views), pagination
- Full-text search: `GET /api/artworks?q=seascape` via PostgreSQL `tsvector`
- `GET /api/artworks/{id}` — increments view count (background task)
- `GET /api/artworks/artist/{artist_id}` — public artist page
- Favorites: `POST /api/favorites`, `DELETE /api/favorites/{artwork_id}`, `GET /api/favorites`
- `GET /api/categories/{slug}` — category browse

#### Frontend (Next.js)
- Public artworks browse page: `/artworks` (filters sidebar, grid)
- Artwork detail page: `/artworks/{id}`
- Artist public profile page: `/artists/{id}`
- Buyer dashboard with favorited artworks
- Search bar with query param routing
- Category browse navigation

### Dependencies
- Phase 2 complete (artworks need published status)

### Done When
- [ ] `/artworks` returns only published, non-deleted artworks
- [ ] Filter by category, price range, medium works correctly
- [ ] Full-text search returns relevant results
- [ ] View count increments on artwork detail page (background task, not blocking)
- [ ] Buyer can favorite an artwork and see it in dashboard
- [ ] Buyer cannot favorite the same artwork twice (409 on second attempt)
- [ ] Artist public profile shows their published artworks
- [ ] Response time for `/api/artworks` < 300ms for 1000 artworks

---

## Phase 4 — Payments + Orders
**Goal:** Buyers can purchase artworks. Artists receive payouts. Orders are tracked.

### What it Adds

#### Backend (FastAPI)
- Database migrations for: `orders`, `order_items`, `transactions`, `cart`, `cart_items`
- Stripe Connect onboarding for artists: `POST /api/payments/connect/onboard`
- Cart: `GET /api/cart`, `POST /api/cart/items`, `DELETE /api/cart/items/{artwork_id}`
- Checkout: `POST /api/payments/checkout` — creates Order + PaymentIntent
- Stripe webhook: `POST /api/payments/webhook` — handles payment events
- Order history: `GET /api/orders`, `GET /api/orders/{id}`
- Artist sales: `GET /api/orders/sales` (orders where artist sold an item)

#### Frontend (Next.js)
- Cart sidebar / page
- Checkout page with Stripe Elements
- Order success page
- Order history page: `/orders`
- Artist dashboard: sales tab
- Stripe Connect onboarding redirect

### Dependencies
- Phase 3 complete
- Stripe account with Connect enabled
- Stripe secret key and webhook endpoint configured

### Done When
- [ ] Buyer can add artwork to cart
- [ ] Buyer cannot add already-sold artwork to cart (returns 409)
- [ ] Checkout creates a Stripe PaymentIntent
- [ ] Payment succeeds in Stripe test mode (card 4242 4242 4242 4242)
- [ ] `payment_intent.succeeded` webhook updates Order to paid, Artwork to sold
- [ ] Buyer receives confirmation notification
- [ ] Artist receives sale notification
- [ ] Order history shows correct details
- [ ] Artwork appears as sold (no longer purchasable)

---

## Phase 5 — Admin + Polish
**Goal:** Admins can moderate content. Artists get email confirmations. System is production-ready.

### What it Adds

#### Backend (FastAPI)
- Admin endpoints: `GET /api/admin/users`, `PATCH /api/admin/users/{id}/role`, `PATCH /api/admin/users/{id}/deactivate`
- Admin artwork moderation: `POST /api/admin/artworks/{id}/reject`, `POST /api/admin/artworks/{id}/approve`
- Email via Resend: order confirmation, artwork approved/rejected, AI done
- Celery tasks for email delivery
- Audit log reads: `GET /api/admin/audit-logs`
- Analytics: `GET /api/admin/analytics` (artwork count, order volume, revenue)

#### Frontend (Next.js)
- Admin panel: `/admin` (user list, artwork list)
- Email templates (Resend)
- Error boundary components
- Loading skeleton states throughout
- SEO meta tags on all public pages

### Dependencies
- Phase 4 complete
- Resend account + API key

### Done When
- [ ] Admin can change user role (effect visible on next login)
- [ ] Admin can reject an artwork (artist notified via email)
- [ ] Order confirmation email sent to buyer on payment success
- [ ] All 500 errors have been replaced with structured error responses
- [ ] All public pages have correct Open Graph meta tags
- [ ] Alembic migration history is clean and reversible
- [ ] Staging environment passes all Phase 1-5 done criteria