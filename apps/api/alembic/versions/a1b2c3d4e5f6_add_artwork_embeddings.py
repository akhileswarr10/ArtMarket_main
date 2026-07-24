"""add_artwork_embeddings

Revision ID: a1b2c3d4e5f6
Revises: 10061c8471b1
Create Date: 2026-07-24 15:47:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '10061c8471b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("""
        CREATE TABLE artwork_embeddings (
            artwork_id   UUID PRIMARY KEY REFERENCES artworks(id) ON DELETE CASCADE,
            embedding    vector(384) NOT NULL,
            model_name   VARCHAR(100) NOT NULL DEFAULT 'all-MiniLM-L6-v2',
            generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute(
        "CREATE INDEX ON artwork_embeddings "
        "USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS artwork_embeddings")
