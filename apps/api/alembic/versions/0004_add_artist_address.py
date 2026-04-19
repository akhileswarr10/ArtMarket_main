"""add_artist_address

Revision ID: 0004_add_address
Revises: fcb4ba4350e9
Create Date: 2026-04-14

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0004_add_address'
down_revision: Union[str, None] = 'fcb4ba4350e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('artist_profiles', sa.Column('address', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column('artist_profiles', 'address')
