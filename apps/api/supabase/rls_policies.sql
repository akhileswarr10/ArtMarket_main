-- =====================================================================
-- ArtMarket RLS Policies — Phase 1
-- =====================================================================

-- Enable RLS on all application tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ── USERS ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT
  USING (auth.uid() = supabase_user_id);

DROP POLICY IF EXISTS "users_select_admin" ON users;
CREATE POLICY "users_select_admin" ON users FOR SELECT
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING (auth.uid() = supabase_user_id);

-- ── ARTIST_PROFILES ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "artist_profiles_select_all" ON artist_profiles;
CREATE POLICY "artist_profiles_select_all" ON artist_profiles FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "artist_profiles_insert_own" ON artist_profiles;
CREATE POLICY "artist_profiles_insert_own" ON artist_profiles FOR INSERT
  WITH CHECK (
    (SELECT supabase_user_id FROM users WHERE id = user_id) = auth.uid()
  );

DROP POLICY IF EXISTS "artist_profiles_update_own" ON artist_profiles;
CREATE POLICY "artist_profiles_update_own" ON artist_profiles FOR UPDATE
  USING (
    (SELECT supabase_user_id FROM users WHERE id = user_id) = auth.uid()
  );

-- ── BUYER_PROFILES ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "buyer_profiles_select_own" ON buyer_profiles;
CREATE POLICY "buyer_profiles_select_own" ON buyer_profiles FOR SELECT
  USING (
    (SELECT supabase_user_id FROM users WHERE id = user_id) = auth.uid()
    OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
  );

DROP POLICY IF EXISTS "buyer_profiles_insert_own" ON buyer_profiles;
CREATE POLICY "buyer_profiles_insert_own" ON buyer_profiles FOR INSERT
  WITH CHECK (
    (SELECT supabase_user_id FROM users WHERE id = user_id) = auth.uid()
  );

DROP POLICY IF EXISTS "buyer_profiles_update_own" ON buyer_profiles;
CREATE POLICY "buyer_profiles_update_own" ON buyer_profiles FOR UPDATE
  USING (
    (SELECT supabase_user_id FROM users WHERE id = user_id) = auth.uid()
  );

-- ── ARTWORKS ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "artworks_select_published" ON artworks;
CREATE POLICY "artworks_select_published" ON artworks FOR SELECT
  USING (
    status = 'published' AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "artworks_select_own" ON artworks;
CREATE POLICY "artworks_select_own" ON artworks FOR SELECT
  USING (
    (SELECT supabase_user_id FROM users WHERE id = artist_id) = auth.uid()
  );

DROP POLICY IF EXISTS "artworks_select_admin" ON artworks;
CREATE POLICY "artworks_select_admin" ON artworks FOR SELECT
  USING (
    (auth.jwt()->'app_metadata'->>'role') = 'admin'
  );

DROP POLICY IF EXISTS "artworks_insert_artist" ON artworks;
CREATE POLICY "artworks_insert_artist" ON artworks FOR INSERT
  WITH CHECK (
    (auth.jwt()->'app_metadata'->>'role') = 'artist'
    AND (SELECT supabase_user_id FROM users WHERE id = artist_id) = auth.uid()
  );

DROP POLICY IF EXISTS "artworks_update_own" ON artworks;
CREATE POLICY "artworks_update_own" ON artworks FOR UPDATE
  USING (
    (SELECT supabase_user_id FROM users WHERE id = artist_id) = auth.uid()
    OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
  );

DROP POLICY IF EXISTS "artworks_delete_own" ON artworks;
CREATE POLICY "artworks_delete_own" ON artworks FOR DELETE
  USING (
    (SELECT supabase_user_id FROM users WHERE id = artist_id) = auth.uid()
    OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
  );

-- ── ARTWORK_IMAGES ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "artwork_images_select_confirmed" ON artwork_images;
CREATE POLICY "artwork_images_select_confirmed" ON artwork_images FOR SELECT
  USING (
    is_confirmed = TRUE
    AND (SELECT status FROM artworks WHERE id = artwork_id) = 'published'
  );

DROP POLICY IF EXISTS "artwork_images_select_own" ON artwork_images;
CREATE POLICY "artwork_images_select_own" ON artwork_images FOR SELECT
  USING (
    (SELECT supabase_user_id FROM users u
     JOIN artworks a ON a.artist_id = u.id
     WHERE a.id = artwork_id) = auth.uid()
  );

DROP POLICY IF EXISTS "artwork_images_insert_own" ON artwork_images;
CREATE POLICY "artwork_images_insert_own" ON artwork_images FOR INSERT
  WITH CHECK (
    (SELECT supabase_user_id FROM users u
     JOIN artworks a ON a.artist_id = u.id
     WHERE a.id = artwork_id) = auth.uid()
  );

DROP POLICY IF EXISTS "artwork_images_update_own" ON artwork_images;
CREATE POLICY "artwork_images_update_own" ON artwork_images FOR UPDATE
  USING (
    (SELECT supabase_user_id FROM users u
     JOIN artworks a ON a.artist_id = u.id
     WHERE a.id = artwork_id) = auth.uid()
  );

-- ── ARTWORK_TAGS ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "artwork_tags_select_all" ON artwork_tags;
CREATE POLICY "artwork_tags_select_all" ON artwork_tags FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "artwork_tags_insert_own" ON artwork_tags;
CREATE POLICY "artwork_tags_insert_own" ON artwork_tags FOR INSERT
  WITH CHECK (
    (SELECT supabase_user_id FROM users u
     JOIN artworks a ON a.artist_id = u.id
     WHERE a.id = artwork_id) = auth.uid()
  );

DROP POLICY IF EXISTS "artwork_tags_delete_own" ON artwork_tags;
CREATE POLICY "artwork_tags_delete_own" ON artwork_tags FOR DELETE
  USING (
    (SELECT supabase_user_id FROM users u
     JOIN artworks a ON a.artist_id = u.id
     WHERE a.id = artwork_id) = auth.uid()
  );

-- ── FAVORITES ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "favorites_select_own" ON favorites;
CREATE POLICY "favorites_select_own" ON favorites FOR SELECT
  USING (
    (SELECT supabase_user_id FROM users WHERE id = user_id) = auth.uid()
  );

DROP POLICY IF EXISTS "favorites_insert_own" ON favorites;
CREATE POLICY "favorites_insert_own" ON favorites FOR INSERT
  WITH CHECK (
    (SELECT supabase_user_id FROM users WHERE id = user_id) = auth.uid()
  );

DROP POLICY IF EXISTS "favorites_delete_own" ON favorites;
CREATE POLICY "favorites_delete_own" ON favorites FOR DELETE
  USING (
    (SELECT supabase_user_id FROM users WHERE id = user_id) = auth.uid()
  );

-- ── AUDIT_LOGS ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "audit_logs_select_admin" ON audit_logs;
CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT
  USING (
    (auth.jwt()->'app_metadata'->>'role') = 'admin'
  );
