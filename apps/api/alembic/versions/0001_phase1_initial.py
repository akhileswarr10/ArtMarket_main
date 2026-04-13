"""Phase 1 initial schema

Revision ID: 0001_phase1
Revises:
Create Date: 2026-04-13
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, TSVECTOR

revision = '0001_phase1'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── categories ──────────────────────────────────────────
    op.create_table('categories',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.Text(), nullable=False, unique=True),
        sa.Column('slug', sa.Text(), nullable=False, unique=True),
        sa.Column('description', sa.Text()),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )

    # ── tags ────────────────────────────────────────────────
    op.create_table('tags',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.Text(), nullable=False, unique=True),
        sa.Column('slug', sa.Text(), nullable=False, unique=True),
    )

    # ── users ───────────────────────────────────────────────
    op.create_table('users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('supabase_user_id', UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column('email', sa.Text(), nullable=False, unique=True),
        sa.Column('role', sa.Text()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('TRUE')),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('deleted_at', sa.TIMESTAMP(timezone=True)),
        sa.CheckConstraint("role IN ('buyer', 'artist', 'admin')", name='users_role_check'),
    )
    op.create_index('idx_users_supabase_user_id', 'users', ['supabase_user_id'], unique=True)
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_role', 'users', ['role'])

    # ── artist_profiles ──────────────────────────────────────
    op.create_table('artist_profiles',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('display_name', sa.Text(), nullable=False),
        sa.Column('bio', sa.Text()),
        sa.Column('avatar_url', sa.Text()),
        sa.Column('website_url', sa.Text()),
        sa.Column('stripe_account_id', sa.Text()),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('FALSE')),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('idx_artist_profiles_user_id', 'artist_profiles', ['user_id'])

    # ── buyer_profiles ───────────────────────────────────────
    op.create_table('buyer_profiles',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('display_name', sa.Text(), nullable=False),
        sa.Column('avatar_url', sa.Text()),
        sa.Column('shipping_address', JSONB()),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('idx_buyer_profiles_user_id', 'buyer_profiles', ['user_id'])

    # ── artworks ─────────────────────────────────────────────
    op.create_table('artworks',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('artist_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='NO ACTION'), nullable=False),
        sa.Column('category_id', UUID(as_uuid=True), sa.ForeignKey('categories.id', ondelete='SET NULL')),
        sa.Column('title', sa.Text()),
        sa.Column('description', sa.Text()),
        sa.Column('medium', sa.String(100)),
        sa.Column('style', sa.String(100)),
        sa.Column('dimensions', sa.String(100)),
        sa.Column('price', sa.Numeric(10, 2)),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('search_vector', TSVECTOR()),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('deleted_at', sa.TIMESTAMP(timezone=True)),
        sa.CheckConstraint("status IN ('draft', 'published', 'sold', 'archived')", name='artworks_status_check'),
    )
    op.create_index('idx_artworks_artist_id', 'artworks', ['artist_id'])
    op.create_index('idx_artworks_status', 'artworks', ['status'])
    op.create_index('idx_artworks_category_id', 'artworks', ['category_id'])
    op.create_index('idx_artworks_created_at', 'artworks', ['created_at'])
    op.create_index('idx_artworks_price', 'artworks', ['price'])
    op.create_index('idx_artworks_deleted_at', 'artworks', ['deleted_at'], postgresql_where=sa.text('deleted_at IS NULL'))
    op.execute("CREATE INDEX idx_artworks_search ON artworks USING GIN (search_vector)")

    # ── search vector trigger ─────────────────────────────────
    op.execute("""
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
    """)
    op.execute("""
        CREATE TRIGGER artworks_search_vector_trigger
        BEFORE INSERT OR UPDATE ON artworks
        FOR EACH ROW EXECUTE FUNCTION artworks_search_vector_update();
    """)

    # ── artwork_images ────────────────────────────────────────
    op.create_table('artwork_images',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('artwork_id', UUID(as_uuid=True), sa.ForeignKey('artworks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('storage_path', sa.String(500), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default=sa.text('FALSE')),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('is_confirmed', sa.Boolean(), nullable=False, server_default=sa.text('FALSE')),
        sa.Column('width', sa.Integer()),
        sa.Column('height', sa.Integer()),
        sa.Column('file_size_bytes', sa.Integer()),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('idx_artwork_images_artwork_id', 'artwork_images', ['artwork_id'])

    # ── artwork_tags ──────────────────────────────────────────
    op.create_table('artwork_tags',
        sa.Column('artwork_id', UUID(as_uuid=True), sa.ForeignKey('artworks.id', ondelete='CASCADE'), nullable=False, primary_key=True),
        sa.Column('tag_id', UUID(as_uuid=True), sa.ForeignKey('tags.id', ondelete='CASCADE'), nullable=False, primary_key=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('idx_artwork_tags_tag_id', 'artwork_tags', ['tag_id'])

    # ── favorites ─────────────────────────────────────────────
    op.create_table('favorites',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('artwork_id', UUID(as_uuid=True), sa.ForeignKey('artworks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.UniqueConstraint('user_id', 'artwork_id', name='uq_favorites_user_artwork'),
    )
    op.create_index('idx_favorites_user_id', 'favorites', ['user_id'])

    # ── audit_logs ────────────────────────────────────────────
    op.create_table('audit_logs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL')),
        sa.Column('action', sa.Text(), nullable=False),
        sa.Column('entity_type', sa.Text(), nullable=False),
        sa.Column('entity_id', UUID(as_uuid=True)),
        sa.Column('old_data', JSONB()),
        sa.Column('new_data', JSONB()),
        sa.Column('ip_address', sa.Text()),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('idx_audit_logs_user_id', 'audit_logs', ['user_id'])
    op.create_index('idx_audit_logs_entity', 'audit_logs', ['entity_type', 'entity_id'])
    op.create_index('idx_audit_logs_created_at', 'audit_logs', ['created_at'])


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS artworks_search_vector_trigger ON artworks")
    op.execute("DROP FUNCTION IF EXISTS artworks_search_vector_update()")
    op.drop_table('audit_logs')
    op.drop_table('favorites')
    op.drop_table('artwork_tags')
    op.drop_table('artwork_images')
    op.drop_table('artworks')
    op.drop_table('buyer_profiles')
    op.drop_table('artist_profiles')
    op.drop_table('users')
    op.drop_table('tags')
    op.drop_table('categories')
