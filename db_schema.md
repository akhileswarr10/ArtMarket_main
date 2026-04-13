# db_schema.md — Database Schema

## Supabase Auth Reference
`auth.users` is Supabase-managed. Our `users` table references it via `supabase_user_id` (logical FK — not enforced by SQLAlchemy, as `auth` schema is in a different schema). All identity operations go through Supabase Auth. Our DB never stores passwords.

---

## Tables

### `users`
```sql
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id  UUID NOT NULL UNIQUE,   -- auth.users.id
  email             TEXT NOT NULL UNIQUE,
  role              TEXT CHECK (role IN ('buyer', 'artist', 'admin')),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_users_supabase_user_id ON users (supabase_user_id);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_deleted_at ON users (deleted_at) WHERE deleted_at IS NULL;
```

### `artist_profiles`
```sql
CREATE TABLE artist_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name      TEXT NOT NULL,
  bio               TEXT,
  avatar_url        TEXT,
  website_url       TEXT,
  stripe_account_id TEXT,
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_artist_profiles_user_id ON artist_profiles (user_id);
```

### `buyer_profiles`
```sql
CREATE TABLE buyer_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name      TEXT NOT NULL,
  avatar_url        TEXT,
  shipping_address  JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_buyer_profiles_user_id ON buyer_profiles (user_id);
```

### `categories`
```sql
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `tags`
```sql
CREATE TABLE tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE
);
```

### `artworks`
```sql
CREATE TABLE artworks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id     UUID NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  title         TEXT,
  description   TEXT,
  medium        TEXT,
  style         TEXT,
  dimensions    TEXT,
  price         NUMERIC(10, 2),
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'published', 'sold', 'archived')),
  view_count    INTEGER NOT NULL DEFAULT 0,
  search_vector TSVECTOR,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_artworks_artist_id    ON artworks (artist_id);
CREATE INDEX idx_artworks_status       ON artworks (status);
CREATE INDEX idx_artworks_category_id  ON artworks (category_id);
CREATE INDEX idx_artworks_created_at   ON artworks (created_at DESC);
CREATE INDEX idx_artworks_price        ON artworks (price);
CREATE INDEX idx_artworks_deleted_at   ON artworks (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_artworks_search       ON artworks USING GIN (search_vector);
```

**Search vector maintenance:**
```sql
-- Trigger to update search_vector on insert/update
CREATE OR REPLACE FUNCTION artworks_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.medium, '') || ' ' ||
    coalesce(NEW.style, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER artworks_search_vector_trigger
  BEFORE INSERT OR UPDATE ON artworks
  FOR EACH ROW EXECUTE FUNCTION artworks_search_vector_update();
```

### `artwork_images`
```sql
CREATE TABLE artwork_images (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id       UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  storage_path     TEXT NOT NULL,
  is_primary       BOOLEAN NOT NULL DEFAULT FALSE,
  display_order    INTEGER NOT NULL DEFAULT 0,
  is_confirmed     BOOLEAN NOT NULL DEFAULT FALSE,
  width            INTEGER,
  height           INTEGER,
  file_size_bytes  INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_artwork_images_artwork_id ON artwork_images (artwork_id);
```

### `artwork_tags`
```sql
CREATE TABLE artwork_tags (
  artwork_id  UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (artwork_id, tag_id)
);

CREATE INDEX idx_artwork_tags_tag_id ON artwork_tags (tag_id);
```

### `favorites`
```sql
CREATE TABLE favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artwork_id  UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, artwork_id)
);

CREATE INDEX idx_favorites_user_id ON favorites (user_id);
```

### `cart`
```sql
CREATE TABLE cart (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `cart_items`
```sql
CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id     UUID NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
  artwork_id  UUID NOT NULL REFERENCES artworks(id) ON DELETE NO ACTION,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, artwork_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items (cart_id);
```

### `orders`
```sql
CREATE TABLE orders (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id                 UUID NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
  status                   TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal                 NUMERIC(10, 2) NOT NULL,
  shipping_cost            NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax_amount               NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount             NUMERIC(10, 2) NOT NULL,
  shipping_address         JSONB NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer_id    ON orders (buyer_id);
CREATE INDEX idx_orders_status      ON orders (status);
CREATE INDEX idx_orders_created_at  ON orders (created_at DESC);
```

### `order_items`
```sql
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE NO ACTION,
  artwork_id  UUID NOT NULL REFERENCES artworks(id) ON DELETE NO ACTION,
  artist_id   UUID NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
  price_paid  NUMERIC(10, 2) NOT NULL,
  title       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX idx_order_items_artist_id  ON order_items (artist_id);
```

### `transactions`
```sql
CREATE TABLE transactions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id               UUID NOT NULL REFERENCES orders(id) ON DELETE NO ACTION,
  stripe_payment_intent  TEXT NOT NULL,
  stripe_charge_id       TEXT,
  amount                 NUMERIC(10, 2) NOT NULL,
  currency               TEXT NOT NULL DEFAULT 'usd',
  status                 TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'refunded')),
  stripe_raw_event       JSONB,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_order_id ON transactions (order_id);
```

### `notifications`
```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id         ON notifications (user_id);
CREATE INDEX idx_notifications_user_unread      ON notifications (user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at       ON notifications (created_at DESC);
```

### `ai_jobs`
```sql
CREATE TABLE ai_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id      UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  job_type        TEXT NOT NULL CHECK (job_type IN ('captioning', 'pricing', 'recommendations')),
  status          TEXT NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued', 'running', 'done', 'failed')),
  celery_task_id  TEXT,
  result          JSONB,
  error           TEXT,
  retries         INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_jobs_artwork_id  ON ai_jobs (artwork_id);
CREATE INDEX idx_ai_jobs_status      ON ai_jobs (status);
```

### `audit_logs`
```sql
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    UUID,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id       ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_entity        ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at    ON audit_logs (created_at DESC);
```

---

## Relationship Summary

```
auth.users (Supabase-managed)
  └── users (supabase_user_id FK, logical)
        ├── artist_profiles (1:1)
        ├── buyer_profiles (1:1)
        ├── artworks (1:many, artist_id)
        │     ├── artwork_images (1:many)
        │     ├── artwork_tags (many:many via tags)
        │     └── ai_jobs (1:many)
        ├── orders (1:many, buyer_id)
        │     ├── order_items (1:many)
        │     └── transactions (1:many)
        ├── cart (1:1)
        │     └── cart_items (1:many)
        ├── favorites (1:many)
        ├── notifications (1:many)
        └── audit_logs (1:many, nullable)
```

---

## Index Purpose Summary

| Index                              | Serves                                         |
|------------------------------------|------------------------------------------------|
| `users.supabase_user_id`           | JWT auth lookup on every request               |
| `artworks.artist_id`               | Artist dashboard: list own artworks            |
| `artworks.status`                  | Public browse: WHERE status='published'        |
| `artworks.search_vector` (GIN)     | Full-text search: WHERE search_vector @@ plainto_tsquery |
| `artworks.category_id`             | Browse by category                             |
| `artworks.price`                   | Filter by price range                          |
| `artworks.created_at DESC`         | Sort by newest                                 |
| `artwork_images.artwork_id`        | Load images for artwork detail                 |
| `notifications.user_id + is_read`  | Unread count badge                             |
| `orders.buyer_id`                  | Order history page                             |
| `order_items.artist_id`            | Artist sales dashboard                         |

---

## Soft Delete Strategy

Soft deletes use `deleted_at TIMESTAMPTZ NULL`. A NULL value means the record is active.

**Tables with soft deletes:**
- `artworks` — Never hard-delete. Buyers may reference order history.
- `users` — Deactivation only (`is_active=false`, `deleted_at` set). Auth account may persist.

**All queries on soft-deleted tables must include:**
```sql
WHERE deleted_at IS NULL
```
This is enforced at repository level, not at DB level, to avoid accidental exposure.

---

## RLS Policies

RLS is enabled on all tables. FastAPI uses the **service role key** (bypasses RLS). RLS guards Supabase's PostgREST API surface only.

### `users`
```sql
-- Users can read their own row. Admins can read all.
CREATE POLICY "users_select" ON users FOR SELECT
  USING (auth.uid() = supabase_user_id OR (auth.jwt()->'app_metadata'->>'role' = 'admin'));

-- Users can update their own row.
CREATE POLICY "users_update" ON users FOR UPDATE
  USING (auth.uid() = supabase_user_id);
```

### `artworks`
```sql
-- Published artworks are public. Drafts only visible to owner or admin.
CREATE POLICY "artworks_select" ON artworks FOR SELECT
  USING (
    status = 'published'
    OR (SELECT supabase_user_id FROM users WHERE id = artist_id) = auth.uid()
    OR (auth.jwt()->'app_metadata'->>'role' = 'admin')
  );

-- Only artists can insert (their own artworks).
CREATE POLICY "artworks_insert" ON artworks FOR INSERT
  WITH CHECK (
    (auth.jwt()->'app_metadata'->>'role' = 'artist')
    AND (SELECT supabase_user_id FROM users WHERE id = artist_id) = auth.uid()
  );

-- Artist or admin can update.
CREATE POLICY "artworks_update" ON artworks FOR UPDATE
  USING (
    (SELECT supabase_user_id FROM users WHERE id = artist_id) = auth.uid()
    OR (auth.jwt()->'app_metadata'->>'role' = 'admin')
  );
```

### `notifications`
```sql
-- Users can only see and update their own notifications.
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING ((SELECT supabase_user_id FROM users WHERE id = user_id) = auth.uid());

CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING ((SELECT supabase_user_id FROM users WHERE id = user_id) = auth.uid());
```

### `orders`, `cart`, `cart_items`
```sql
-- Buyers see only their own data.
CREATE POLICY "orders_select" ON orders FOR SELECT
  USING ((SELECT supabase_user_id FROM users WHERE id = buyer_id) = auth.uid()
         OR (auth.jwt()->'app_metadata'->>'role' = 'admin'));
-- Same pattern for cart and cart_items.
```

### `audit_logs`, `transactions`
```sql
-- Admin only via RLS (service role bypasses anyway).
CREATE POLICY "audit_logs_admin_only" ON audit_logs FOR SELECT
  USING (auth.jwt()->'app_metadata'->>'role' = 'admin');
```