import uuid
import re
from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from models import Tag
from schemas.artwork import TagResponse

router = APIRouter(prefix="/tags", tags=["tags"])


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-") or "tag"


@router.get("", response_model=list[TagResponse])
async def list_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tag).order_by(Tag.name))
    return result.scalars().all()


@router.post("/resolve", response_model=list[TagResponse])
async def resolve_tags(names: list[str] = Body(...), db: AsyncSession = Depends(get_db)):
    """Find or create tags by name. Returns Tag objects (with IDs) for each name."""
    resolved = []
    for raw_name in names:
        name = raw_name.strip().lower()
        if not name:
            continue
        result = await db.execute(select(Tag).where(Tag.name == name))
        tag = result.scalar_one_or_none()
        if not tag:
            base_slug = _slugify(name)
            slug = base_slug
            counter = 0
            while True:
                existing = await db.execute(select(Tag).where(Tag.slug == slug))
                if not existing.scalar_one_or_none():
                    break
                counter += 1
                slug = f"{base_slug}-{counter}"
            tag = Tag(id=uuid.uuid4(), name=name, slug=slug)
            db.add(tag)
            await db.flush()
        resolved.append(tag)
    await db.commit()
    # Re-fetch to get fresh state after commit
    for i, tag in enumerate(resolved):
        await db.refresh(tag)
    return resolved
