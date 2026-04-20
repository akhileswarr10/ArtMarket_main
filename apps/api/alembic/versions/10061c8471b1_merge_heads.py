"""merge_heads

Revision ID: 10061c8471b1
Revises: 17aff5347951, 271f844c4a8b, e1d0e708db9a
Create Date: 2026-04-19 18:46:05.071664

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '10061c8471b1'
down_revision: Union[str, None] = ('17aff5347951', '271f844c4a8b', 'e1d0e708db9a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
