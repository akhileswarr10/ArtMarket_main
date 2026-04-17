"""Add ai_jobs and notifications

Revision ID: e1d0e708db9a
Revises: 8472d213561d
Create Date: 2026-04-16 23:40:42.982098

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e1d0e708db9a'
down_revision: Union[str, None] = '8472d213561d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('ai_jobs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('artwork_id', sa.UUID(), nullable=False),
    sa.Column('job_type', sa.String(length=50), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('celery_task_id', sa.String(length=100), nullable=True),
    sa.Column('result', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('error_message', sa.Text(), nullable=True),
    sa.Column('attempts', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['artwork_id'], ['artworks.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.add_column('artworks', sa.Column('ai_title_suggestion', sa.Text(), nullable=True))
    op.add_column('artworks', sa.Column('ai_description_suggestion', sa.Text(), nullable=True))
    op.add_column('artworks', sa.Column('ai_style_suggestion', sa.String(length=100), nullable=True))
    op.add_column('artworks', sa.Column('ai_medium_suggestion', sa.String(length=100), nullable=True))
    op.add_column('artworks', sa.Column('ai_price_suggestion', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('artworks', sa.Column('ai_price_confidence', sa.String(length=20), nullable=True))
    op.add_column('artworks', sa.Column('ai_tags_suggestion', postgresql.ARRAY(sa.String()), nullable=True))
    op.add_column('artworks', sa.Column('ai_generated_at', sa.TIMESTAMP(timezone=True), nullable=True))
    op.add_column('notifications', sa.Column('data', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.alter_column('notifications', 'body', existing_type=sa.TEXT(), nullable=True)
    op.drop_column('notifications', 'metadata')
    pass


def downgrade() -> None:
    op.add_column('notifications', sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True))
    op.alter_column('notifications', 'body', existing_type=sa.TEXT(), nullable=False)
    op.drop_column('notifications', 'data')
    op.drop_column('artworks', 'ai_generated_at')
    op.drop_column('artworks', 'ai_tags_suggestion')
    op.drop_column('artworks', 'ai_price_confidence')
    op.drop_column('artworks', 'ai_price_suggestion')
    op.drop_column('artworks', 'ai_medium_suggestion')
    op.drop_column('artworks', 'ai_style_suggestion')
    op.drop_column('artworks', 'ai_description_suggestion')
    op.drop_column('artworks', 'ai_title_suggestion')
    op.drop_table('ai_jobs')
    pass
