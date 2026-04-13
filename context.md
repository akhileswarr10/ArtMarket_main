# context.md — ArtMarket System Context

## 1. Domain Entities

### User
Mirrors `auth.users` from Supabase. One User row per Supabase Auth account.

| Column            | Type      | Notes                                     |
|-------------------|-----------|-------------------------------------------|
| id                | UUID PK   | Matches `auth.users.id`                   |
| supabase_user_id  | UUID UQ   | FK → auth.users.id (logical, not enforced in app DB) |
| email             | TEXT UQ   | Synced from Supabase Auth webhook         |
| role              | TEXT      | 'buyer' \| 'artist' \| 'admin'            |
| is_active         | BOOL      | Default true. Set false to deactivate     |
| created_at        | TIMESTAMP | Server default                            |
| updated_at        | TIMESTAMP | Server default, on update                 |
| deleted_at        | TIMESTAMP | Soft delete                               |

### ArtistProfile
| Column         | Type    | Notes                              |
|----------------|---------|------------------------------------|
| id             | UUID PK |                                    |
| user_id        | UUID FK | → users.id, unique, cascade delete |
| display_name   | TEXT    |                                    |
| bio            | TEXT    |                                    |
| avatar_url     | TEXT    | Supabase Storage public URL        |
| website_url    | TEXT    |                                    |
| stripe_account_id | TEXT | Stripe Connect account             |
| is_verified    | BOOL    | Admin-verified artist              |
| created_at     | TIMESTAMP |                                  |
| updated_at     | TIMESTAMP |                                  |

### BuyerProfile
| Column           | Type    | Notes                              |
|------------------|---------|------------------------------------|
| id               | UUID PK |                                    |
| user_id          | UUID FK | → users.id, unique, cascade delete |
| display_name     | TEXT    |                                    |
| avatar_url       | TEXT    |                                    |
| shipping_address | JSONB   | {line1, city, state, zip, country} |
| created_at       | TIMESTAMP |                                  |
| updated_at       | TIMESTAMP |                                  |

### Artwork
| Column        | Type          | Notes                              |
|---------------|---------------|------------------------------------|
| id            | UUID PK       |                                    |
| artist_id     | UUID FK       | → users.id, cascade delete         |
| category_id   | UUID FK       | → categories.id, set null          |
| title         | TEXT          |                                    |
| description   | TEXT          |                                    |
| medium        | TEXT          | Oil, watercolor, digital…          |
| style         | TEXT          | Abstract, realism…                 |
| dimensions    | TEXT          | "24x36 inches"                     |
| price         | NUMERIC(10,2) |                                    |
| status        | TEXT          | draft \| published \| sold \| archived |
| view_count    | INT           | Default 0                          |
| search_vector | TSVECTOR      | Full-text search index             |
| created_at    | TIMESTAMP     |                                    |
| updated_at    | TIMESTAMP     |                                    |
| deleted_at    | TIMESTAMP     | Soft delete                        |

### ArtworkImage
| Column          | Type    | Notes                              |
|-----------------|---------|------------------------------------|
| id              | UUID PK |                                    |
| artwork_id      | UUID FK | → artworks.id, cascade delete      |
| storage_path    | TEXT    | Supabase Storage path              |
| is_primary      | BOOL    | First confirmed image              |
| display_order   | INT     | Default 0                          |
| is_confirmed    | BOOL    | False until frontend confirms      |
| width           | INT     |                                    |
| height          | INT     |                                    |
| file_size_bytes | INT     |                                    |
| created_at      | TIMESTAMP |                                  |

### Category
| Column      | Type      | Notes          |
|-------------|-----------|----------------|
| id          | UUID PK   |                |
| name        | TEXT UQ   |                |
| slug        | TEXT UQ   |                |
| description | TEXT      |                |
| created_at  | TIMESTAMP |                |

### Tag
| Column | Type    | Notes  |
|--------|---------|--------|
| id     | UUID PK |        |
| name   | TEXT UQ |        |
| slug   | TEXT UQ |        |

### ArtworkTag (join table)
| Column     | Type      | Notes                         |
|------------|-----------|-------------------------------|
| artwork_id | UUID FK   | → artworks.id, cascade delete |
| tag_id     | UUID FK   | → tags.id, cascade delete     |
| created_at | TIMESTAMP |                               |
PK: (artwork_id, tag_id)

### Order
| Column          | Type          | Notes                               |
|-----------------|---------------|-------------------------------------|
| id              | UUID PK       |                                     |
| buyer_id        | UUID FK       | → users.id                          |
| status          | TEXT          | pending \| paid \| shipped \| delivered \| cancelled \| refunded |
| subtotal        | NUMERIC(10,2) |                                     |
| shipping_cost   | NUMERIC(10,2) |                                     |
| tax_amount      | NUMERIC(10,2) |                                     |
| total_amount    | NUMERIC(10,2) |                                     |
| shipping_address| JSONB         | Snapshot at time of order           |
| stripe_payment_intent_id | TEXT |                              |
| created_at      | TIMESTAMP     |                                     |
| updated_at      | TIMESTAMP     |                                     |

### OrderItem
| Column      | Type          | Notes                          |
|-------------|---------------|--------------------------------|
| id          | UUID PK       |                                |
| order_id    | UUID FK       | → orders.id                    |
| artwork_id  | UUID FK       | → artworks.id (no cascade, keep history) |
| artist_id   | UUID FK       | → users.id (snapshot)          |
| price_paid  | NUMERIC(10,2) | Snapshot at purchase time      |
| title       | TEXT          | Snapshot of artwork title      |
| created_at  | TIMESTAMP     |                                |

### Cart
| Column     | Type      | Notes                     |
|------------|-----------|---------------------------|
| id         | UUID PK   |                           |
| buyer_id   | UUID FK   | → users.id, unique        |
| created_at | TIMESTAMP |                           |
| updated_at | TIMESTAMP |                           |

### CartItem
| Column     | Type      | Notes                    |
|------------|-----------|--------------------------|
| id         | UUID PK   |                          |
| cart_id    | UUID FK   | → carts.id               |
| artwork_id | UUID FK   | → artworks.id            |
| added_at   | TIMESTAMP |                          |
UNIQUE: (cart_id, artwork_id)

### Transaction
| Column                | Type          | Notes                               |
|-----------------------|---------------|-------------------------------------|
| id                    | UUID PK       |                                     |
| order_id              | UUID FK       | → orders.id                         |
| stripe_payment_intent | TEXT          |                                     |
| stripe_charge_id      | TEXT          |                                     |
| amount                | NUMERIC(10,2) |                                     |
| currency              | TEXT          | Default 'usd'                       |
| status                | TEXT          | succeeded \| failed \| refunded     |
| stripe_raw_event      | JSONB         | Raw Stripe webhook payload (audit)  |
| created_at            | TIMESTAMP     |                                     |

### Notification
| Column     | Type      | Notes                                    |
|------------|-----------|------------------------------------------|
| id         | UUID PK   |                                          |
| user_id    | UUID FK   | → users.id                               |
| type       | TEXT      | artwork_sold \| order_shipped \| ai_done \| new_follower |
| title      | TEXT      |                                          |
| body       | TEXT      |                                          |
| data       | JSONB     | Contextual payload (artwork_id, etc.)    |
| is_read    | BOOL      | Default false                            |
| created_at | TIMESTAMP |                                          |

### AuditLog
| Column      | Type      | Notes                              |
|-------------|-----------|------------------------------------|
| id          | UUID PK   |                                    |
| user_id     | UUID FK   | → users.id, nullable (system events) |
| action      | TEXT      | e.g. artwork.published, order.refunded |
| entity_type | TEXT      |                                    |
| entity_id   | UUID      |                                    |
| old_data    | JSONB     |                                    |
| new_data    | JSONB     |                                    |
| ip_address  | TEXT      |                                    |
| created_at  | TIMESTAMP |                                    |

### AIJob
| Column       | Type      | Notes                                      |
|--------------|-----------|--------------------------------------------|
| id           | UUID PK   |                                            |
| artwork_id   | UUID FK   | → artworks.id                              |
| job_type     | TEXT      | captioning \| pricing \| recommendations  |
| status       | TEXT      | queued \| running \| done \| failed        |
| celery_task_id | TEXT    |                                            |
| result       | JSONB     | AI output payload                          |
| error        | TEXT      | Error message if failed                    |
| retries      | INT       | Default 0                                  |
| created_at   | TIMESTAMP |                                            |
| updated_at   | TIMESTAMP |                                            |

### Favorite
| Column     | Type      | Notes                         |
|------------|-----------|-------------------------------|
| id         | UUID PK   |                               |
| user_id    | UUID FK   | → users.id                    |
| artwork_id | UUID FK   | → artworks.id                 |
| created_at | TIMESTAMP |                               |
UNIQUE: (user_id, artwork_id)

---

## 2. Supabase Auth Integration

### How auth.users maps to app User table
- Supabase Auth manages `auth.users` internally. Our app DB has a `users` table.
- The `users.supabase_user_id` column stores the UUID from `auth.users.id`.
- This is a **logical foreign key** — not enforced at DB level (cross-schema).
- The app trusts Supabase's JWT as user identity proof.

### Sync Trigger
- When a user signs up, Supabase Auth fires a **webhook** (type: `signup`) to `POST /api/auth/webhook`.
- FastAPI verifies the webhook secret header, then creates the `User` row.
- Role assignment happens via a separate `POST /api/users/me/onboard` call after signup.
- Email updates in Supabase Auth do NOT automatically sync — for Phase 1 this is accepted tech debt.

### What lives in JWT
Supabase JWT claims relevant to FastAPI:
```json
{
  "sub": "<supabase_user_id>",          // auth.users.id
  "email": "user@example.com",
  "app_metadata": {
    "role": "artist"                    // Set by admin via service role key
  },
  "aud": "authenticated",
  "iat": 1234567890,
  "exp": 1234571490
}
```
FastAPI reads `app_metadata.role` for authorization. It never trusts `user_metadata`.

---

## 3. Module Map

| FastAPI Router       | Path Prefix           | Owns                                         |
|----------------------|-----------------------|----------------------------------------------|
| `auth`               | `/api/auth`           | Webhook sync, onboarding                     |
| `users`              | `/api/users`          | User profile CRUD, role info                 |
| `artworks`           | `/api/artworks`       | Artwork CRUD, image upload flow              |
| `categories`         | `/api/categories`     | Category listing                             |
| `tags`               | `/api/tags`           | Tag listing                                  |
| `orders`             | `/api/orders`         | Order creation, status, history              |
| `cart`               | `/api/cart`           | Cart CRUD                                    |
| `payments`           | `/api/payments`       | Stripe checkout, webhook handling            |
| `ai`                 | `/api/ai`             | Trigger AI jobs, fetch results               |
| `notifications`      | `/api/notifications`  | Mark read, list                              |
| `favorites`          | `/api/favorites`      | Add/remove favorites                         |
| `admin`              | `/api/admin`          | User management, analytics, moderation       |

---

## 4. Request Flows

### 4.1 Auth Flow
```
1. User enters email/password on frontend
2. Frontend calls supabase.auth.signInWithPassword()
3. Supabase Auth validates credentials
4. Supabase returns JWT + refresh token to frontend
5. Frontend stores JWT in cookies via @supabase/ssr
6. For protected API calls, frontend sends JWT in Authorization: Bearer <token>
7. FastAPI middleware extracts token from header
8. python-jose verifies JWT signature using SUPABASE_JWT_SECRET
9. FastAPI extracts sub (supabase_user_id) and app_metadata.role from claims
10. FastAPI loads User row from DB using supabase_user_id
11. Request proceeds with authenticated user context
```

### 4.2 Artwork Image Upload Flow
```
1. Artist fills artwork form and selects files
2. Frontend calls POST /api/artworks (creates Artwork with status=draft)
3. For each image:
   a. Frontend calls POST /api/artworks/{id}/images/presign
   b. FastAPI generates uuid for image_id, creates ArtworkImage row (is_confirmed=false)
   c. FastAPI calls Supabase Storage createSignedUploadUrl(path)
   d. FastAPI returns signed_url, storage_path, image_id to frontend
   e. Frontend uploads file directly to Supabase Storage using signed_url (PUT)
   f. Frontend calls POST /api/artworks/{id}/images/confirm with {image_id}
   g. FastAPI sets image.is_confirmed=true, sets is_primary if first
4. Artist calls PATCH /api/artworks/{id} to set status=published
5. FastAPI queues AIJob for captioning + pricing via Celery
```

### 4.3 AI Job Flow
```
1. POST /api/artworks/{id}/publish triggers Celery task
2. Celery worker downloads image via Supabase Storage signed URL
3. BLIP-2 generates caption (title + description suggestions)
4. scikit-learn regression suggests price
5. Worker updates AIJob.status=done, AIJob.result={title, description, price}
6. Worker writes Notification row for artist: "AI suggestions ready"
7. Supabase Realtime delivers INSERT event to artist's browser subscription
8. Artist reviews suggestions on dashboard
```

### 4.4 Realtime Notification Flow
```
1. FastAPI event (order placed, AI done) writes row to notifications table
2. Supabase Realtime detects INSERT via PostgreSQL logical replication
3. Supabase Realtime pushes event on channel: realtime:public:notifications
4. Frontend has active supabase.channel('notifications')
   .on('postgres_changes', {event: 'INSERT', table: 'notifications', filter: `user_id=eq.${userId}`}, handler)
5. Handler updates notification badge, shows toast
```

### 4.5 Order + Payment Flow
```
1. Buyer clicks "Buy Now" or checks out cart
2. Frontend calls POST /api/payments/checkout
3. FastAPI validates artwork availability (status=published, not sold)
4. FastAPI creates Order (status=pending), creates OrderItems
5. FastAPI calls Stripe API to create PaymentIntent
6. FastAPI returns client_secret to frontend
7. Frontend uses Stripe.js Elements to collect card, confirms PaymentIntent
8. Stripe calls POST /api/payments/webhook (async)
9. FastAPI verifies Stripe webhook signature (stripe.WebhookSignature.verify_header)
10. On payment_intent.succeeded:
    - FastAPI updates Order.status=paid, sets artwork.status=sold
    - FastAPI writes notifications for buyer and artist
    - FastAPI creates Transaction record
```

### 4.6 Supabase Auth Webhook (User Sync) Flow
```
1. User signs up via Supabase Auth (any method)
2. Supabase fires HTTP POST to /api/auth/webhook
3. FastAPI verifies webhook using shared secret header (X-Supabase-Webhook-Secret)
4. On event=signup: FastAPI creates User row with supabase_user_id, email, role=null
5. Frontend redirects user to /register/complete (onboarding page)
6. User selects role (artist or buyer) and profile info
7. Frontend calls POST /api/users/me/onboard with {role, display_name}
8. FastAPI creates ArtistProfile or BuyerProfile
9. FastAPI calls Supabase Admin API to set app_metadata.role in auth.users
10. Next JWT refresh includes role in app_metadata claim
```

---

## 5. System Boundaries by Phase

### Phase 0 — Foundation Freeze
- Supabase project created (Auth, Storage bucket `artworks`, Realtime enabled)
- 6 planning documents written (this file and siblings)
- No code written

### Phase 1 — Auth + Profiles + Artwork CRUD
- Supabase Auth webhooks, user sync, onboarding
- Artist/Buyer profile creation
- Artwork CRUD + image upload (presign/confirm flow)
- Category/Tag management
- FastAPI JWT verification middleware

### Phase 2 — AI Pipeline
- Celery + Redis setup
- BLIP-2 captioning worker
- scikit-learn pricing suggestion model
- AIJob tracking
- Notification write on job completion

### Phase 3 — Browse + Discovery
- Public artwork listing with filters
- Full-text search via PostgreSQL tsvector
- Favorites
- Realtime notifications (frontend subscription)

### Phase 4 — Payments + Orders
- Stripe Connect for artist payouts
- Checkout flow
- Order management
- Stripe webhook handler
- Transaction records

### Phase 5 — Admin + Polish
- Admin panel (user moderation, artwork approval)
- Analytics endpoints
- Email via Resend (order confirmations, artist alerts)
- Audit log reads

---

## 6. PostgreSQL Schema Design Decisions

### Indexes
- `users.supabase_user_id` — UNIQUE INDEX, used on every auth lookup
- `artworks.artist_id` — for artist dashboard queries
- `artworks.status` — for public browse (WHERE status='published')
- `artworks.category_id` — for browse-by-category
- `artworks.search_vector` — GIN index for full-text search
- `artworks.deleted_at` — for soft-delete filtering
- `artwork_images.artwork_id` — for image list per artwork
- `orders.buyer_id` — for order history
- `notifications.user_id, is_read` — for unread count
- `ai_jobs.artwork_id` — for polling AI job status
- `favorites.user_id, artwork_id` — UNIQUE for dedup, lookup

### Foreign Keys
- All FK relationships use UUID types.
- `orders.buyer_id` → `users.id` NO ACTION on delete (preserve order history).
- `artworks.artist_id` → `users.id` NO ACTION (preserve artist work even if deactivated).
- `artwork_images.artwork_id` → `artworks.id` CASCADE DELETE.
- `cart_items.artwork_id` → `artworks.id` NO ACTION (handle in app layer).

### Soft Deletes
- `artworks.deleted_at` — never hard-delete artworks. Queries always add `WHERE deleted_at IS NULL`.
- `users.deleted_at` — deactivation only. Supabase Auth account may still exist.
- OrderItems, Transactions: never deleted (audit trail).

---

## 7. RLS Policy Map

| Table            | RLS Enabled | Policies                                                                       |
|------------------|-------------|--------------------------------------------------------------------------------|
| users            | Yes         | SELECT: own row or admin. UPDATE: own row.                                     |
| artist_profiles  | Yes         | SELECT: public. INSERT/UPDATE: own row.                                        |
| buyer_profiles   | Yes         | SELECT: own row or admin. INSERT/UPDATE: own row.                              |
| artworks         | Yes         | SELECT published: public. SELECT draft: own artist or admin. INSERT: artist role. UPDATE/DELETE: own artist or admin. |
| artwork_images   | Yes         | SELECT: matches artwork access. INSERT/UPDATE: artwork owner or admin.         |
| categories       | No          | Public read-only, managed via admin only (service role).                       |
| tags             | No          | Public read-only, managed via service role.                                    |
| orders           | Yes         | SELECT/UPDATE: own buyer or admin.                                             |
| order_items      | Yes         | SELECT: order owner or artist who sold. No INSERT/UPDATE from client.          |
| cart / cart_items| Yes         | All ops: own buyer only.                                                       |
| transactions     | Yes         | SELECT: admin only or indirectly via orders.                                   |
| notifications    | Yes         | SELECT/UPDATE (is_read): own user only. INSERT: service role only.             |
| audit_logs       | Yes         | SELECT: admin only. INSERT: service role only.                                 |
| ai_jobs          | Yes         | SELECT: artwork owner or admin. INSERT/UPDATE: service role only.              |
| favorites        | Yes         | SELECT/INSERT/DELETE: own user.                                                |

RLS is a **safety net**, not the primary authorization layer. FastAPI enforces all permissions via JWT claim checks before queries reach the DB.