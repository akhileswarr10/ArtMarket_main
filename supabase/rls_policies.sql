-- RLS Policies for ArtMarket
-- Run this SQL in Supabase Dashboard or via psql to set up RLS

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ===================
-- USERS TABLE
-- ===================

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = supabase_user_id);

-- No insert allowed via RLS (sync via webhook)
-- No update allowed via RLS
-- No delete allowed via RLS


-- ===================
-- ARTIST PROFILES
-- ===================

-- Anyone can read artist profiles (public)
CREATE POLICY "Anyone can read artist profiles" ON artist_profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Artists can insert their own profile
CREATE POLICY "Artists can insert own profile" ON artist_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id IN (
        SELECT id FROM users WHERE supabase_user_id = auth.uid()
    ));

-- Artists can update own profile
CREATE POLICY "Artists can update own profile" ON artist_profiles
    FOR UPDATE
    TO authenticated
    USING (user_id IN (
        SELECT id FROM users WHERE supabase_user_id = auth.uid()
    ));


-- ===================
-- BUYER PROFILES
-- ===================

-- Buyers can read their own profile
CREATE POLICY "Buyers can read own profile" ON buyer_profiles
    FOR SELECT
    TO authenticated
    USING (user_id IN (
        SELECT id FROM users WHERE supabase_user_id = auth.uid()
    ));

-- Buyers can insert own profile
CREATE POLICY "Buyers can insert own profile" ON buyer_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id IN (
        SELECT id FROM users WHERE supabase_user_id = auth.uid()
    ));

-- Buyers can update own profile
CREATE POLICY "Buyers can update own profile" ON buyer_profiles
    FOR UPDATE
    TO authenticated
    USING (user_id IN (
        SELECT id FROM users WHERE supabase_user_id = auth.uid()
    ));


-- ===================
-- CATEGORIES
-- ===================

-- Anyone can read categories
CREATE POLICY "Anyone can read categories" ON categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can insert/update/delete (handled in FastAPI, not RLS)
-- Admin check is done at application level


-- ===================
-- TAGS
-- ===================

-- Anyone can read tags
CREATE POLICY "Anyone can read tags" ON tags
    FOR SELECT
    TO authenticated
    USING (true);


-- ===================
-- ARTWORKS
-- ===================

-- Public can read published artworks
CREATE POLICY "Public can read published artworks" ON artworks
    FOR SELECT
    TO authenticated
    USING (status = 'published' AND deleted_at IS NULL);

-- Artists can read own artworks (including drafts)
CREATE POLICY "Artists can read own artworks" ON artworks
    FOR SELECT
    TO authenticated
    USING (artist_id IN (
        SELECT id FROM users WHERE supabase_user_id = auth.uid()
    ));

-- Admins can read all
CREATE POLICY "Admins can read all artworks" ON artworks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid() AND role = 'admin')
    );

-- Only artists can insert
CREATE POLICY "Artists can insert artworks" ON artworks
    FOR INSERT
    TO authenticated
    WITH CHECK (artist_id IN (
        SELECT id FROM users WHERE supabase_user_id = auth.uid() AND role = 'artist'
    ));

-- Only artwork owner can update
CREATE POLICY "Owner can update artwork" ON artworks
    FOR UPDATE
    TO authenticated
    USING (artist_id IN (
        SELECT id FROM users WHERE supabase_user_id = auth.uid()
    ));

-- Only artwork owner can delete (must be draft)
CREATE POLICY "Owner can delete draft artwork" ON artworks
    FOR DELETE
    TO authenticated
    USING (
        artist_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
        AND status = 'draft'
    );


-- ===================
-- ARTWORK IMAGES
-- ===================

-- Authenticated users can view confirmed images
CREATE POLICY "Users can view confirmed images" ON artwork_images
    FOR SELECT
    TO authenticated
    USING (is_confirmed = true);

-- Only artwork owner can insert images
CREATE POLICY "Owner can insert images" ON artwork_images
    FOR INSERT
    TO authenticated
    WITH CHECK (artwork_id IN (
        SELECT id FROM artworks WHERE artist_id IN (
            SELECT id FROM users WHERE supabase_user_id = auth.uid()
        )
    ));

-- Only artwork owner can update/delete images
CREATE POLICY "Owner can update images" ON artwork_images
    FOR UPDATE
    TO authenticated
    USING (artwork_id IN (
        SELECT id FROM artworks WHERE artist_id IN (
            SELECT id FROM users WHERE supabase_user_id = auth.uid()
        )
    ));


-- ===================
-- ARTWORK TAGS
-- ===================

-- Authenticated users can read artwork tags
CREATE POLICY "Users can read artwork tags" ON artwork_tags
    FOR SELECT
    TO authenticated
    USING (true);

-- Only artwork owner can add/remove tags
CREATE POLICY "Owner can manage tags" ON artwork_tags
    FOR ALL
    TO authenticated
    USING (
        artwork_id IN (
            SELECT id FROM artworks WHERE artist_id IN (
                SELECT id FROM users WHERE supabase_user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        artwork_id IN (
            SELECT id FROM artworks WHERE artist_id IN (
                SELECT id FROM users WHERE supabase_user_id = auth.uid()
            )
        )
    );


-- ===================
-- FAVORITES
-- ===================

-- Users can read own favorites
CREATE POLICY "Users can read own favorites" ON favorites
    FOR SELECT
    TO authenticated
    USING (user_id IN (
        SELECT id FROM users WHERE supabase_user_id = auth.uid()
    ));

-- Users can insert own favorites
CREATE POLICY "Users can insert own favorites" ON favorites
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id IN (
        SELECT id FROM users WHERE supabase_user_id = auth.uid()
    ));

-- Users can delete own favorites
CREATE POLICY "Users can delete own favorites" ON favorites
    FOR DELETE
    TO authenticated
    USING (user_id IN (
        SELECT id FROM users WHERE supabase_user_id = auth.uid()
    ));


-- ===================
-- AUDIT LOGS
-- ===================

-- Admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid() AND role = 'admin')
    );

-- Only service role can insert (handled in FastAPI)
-- No update/delete


-- ===================
-- STORAGE POLICIES
-- ===================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Users can upload to their own folder
CREATE POLICY "Users can upload to own folder" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'artworks'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can read public files (published artwork images)
CREATE POLICY "Users can read artwork files" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'artworks'
        AND name LIKE 'artworks/%'
    );

-- Users can delete own files
CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'artworks'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );


-- ===================
-- NOTIFICATIONS (for Realtime)
-- ===================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read own notifications
CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT
    TO authenticated
    USING (user_id IN (
        SELECT id FROM users WHERE supabase_user_id = auth.uid()
    ));

-- Only system can insert (handled in FastAPI)
-- Users can update own notifications
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE
    TO authenticated
    USING (user_id IN (
        SELECT id FROM users WHERE supabase_user_id = auth.uid()
    ));