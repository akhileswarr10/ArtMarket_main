import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, case, cast, Float, and_, or_, literal, text
from sqlalchemy.orm import selectinload
from typing import Optional, List, Tuple

from models import Artwork, ArtworkImage, ArtworkTag, Tag, Favorite, User


class ArtworkRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _base_query_with_relations(self):
        return select(Artwork).options(
            selectinload(Artwork.images),
            selectinload(Artwork.artwork_tags).selectinload(ArtworkTag.tag),
            selectinload(Artwork.artist).selectinload(User.artist_profile),
        )

    async def get_by_id(self, artwork_id: uuid.UUID, include_deleted: bool = False) -> Optional[Artwork]:
        query = self._base_query_with_relations().where(Artwork.id == artwork_id)
        if not include_deleted:
            query = query.where(Artwork.deleted_at == None)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_artist(self, artist_id: uuid.UUID, status: str = None, skip: int = 0, limit: int = 20) -> Tuple[List[Artwork], int]:
        query = self._base_query_with_relations().where(
            Artwork.deleted_at == None
        )
        if artist_id:
            query = query.where(Artwork.artist_id == artist_id)
        if status:
            query = query.where(Artwork.status == status)
        
        count_query = select(func.count()).select_from(Artwork).where(Artwork.deleted_at == None)
        if artist_id:
            count_query = count_query.where(Artwork.artist_id == artist_id)
        if status:
            count_query = count_query.where(Artwork.status == status)
            
        count = (await self.db.execute(count_query)).scalar()
        result = await self.db.execute(query.offset(skip).limit(limit))
        return result.scalars().unique().all(), count

    async def get_published(self, skip: int = 0, limit: int = 20, category_id: uuid.UUID = None,
                             min_price: float = None, max_price: float = None,
                             medium: str = None, style: str = None, search: str = None,
                             tag_name: str = None,
                             current_user_id: uuid.UUID = None) -> Tuple[List[Artwork], int]:
        query = self._base_query_with_relations().where(
            Artwork.status == "published",
            Artwork.deleted_at == None
        )
        count_query = select(func.count()).select_from(Artwork).where(
            Artwork.status == "published", Artwork.deleted_at == None
        )
        if category_id:
            query = query.where(Artwork.category_id == category_id)
            count_query = count_query.where(Artwork.category_id == category_id)
        if min_price is not None:
            query = query.where(Artwork.price >= min_price)
            count_query = count_query.where(Artwork.price >= min_price)
        if max_price is not None:
            query = query.where(Artwork.price <= max_price)
            count_query = count_query.where(Artwork.price <= max_price)
        if medium:
            query = query.where(Artwork.medium.ilike(f"%{medium}%"))
            count_query = count_query.where(Artwork.medium.ilike(f"%{medium}%"))
        if style:
            query = query.where(Artwork.style.ilike(f"%{style}%"))
            count_query = count_query.where(Artwork.style.ilike(f"%{style}%"))
        if search:
            from sqlalchemy import or_
            search_term = f"%{search}%"
            tag_exists = select(ArtworkTag.artwork_id).join(Tag, Tag.id == ArtworkTag.tag_id).where(
                ArtworkTag.artwork_id == Artwork.id,
                Tag.name.ilike(search_term)
            ).exists()
            
            search_condition = or_(
                Artwork.title.ilike(search_term),
                Artwork.medium.ilike(search_term),
                Artwork.style.ilike(search_term),
                tag_exists
            )
            query = query.where(search_condition)
            count_query = count_query.where(search_condition)
        if tag_name:
            # Confirmed-tag match: EXISTS on artwork_tags → tags
            confirmed_tag_exists = (
                select(ArtworkTag.artwork_id)
                .join(Tag, Tag.id == ArtworkTag.tag_id)
                .where(
                    ArtworkTag.artwork_id == Artwork.id,
                    Tag.name.ilike(f"%{tag_name}%"),
                )
                .exists()
            )
            # AI-suggested-tag match: EXISTS on unnest(ai_tags_suggestion)
            # unnest produces a set of rows; we filter for case-insensitive equality.
            ai_tag_exists = (
                select(literal(1))
                .select_from(
                    func.unnest(Artwork.ai_tags_suggestion).column_valued("ai_tag")
                )
                .where(
                    func.lower(text("ai_tag")).ilike(f"%{tag_name.lower()}%")
                )
                .correlate(Artwork)
                .exists()
            )
            tag_condition = or_(confirmed_tag_exists, ai_tag_exists)
            query = query.where(tag_condition)
            count_query = count_query.where(tag_condition)
        
        total = (await self.db.execute(count_query)).scalar()
        result = await self.db.execute(query.order_by(Artwork.created_at.desc()).offset(skip).limit(limit))
        artworks = result.scalars().unique().all()

        # If user is logged in, check which artworks are favorited
        if current_user_id and artworks:
            artwork_ids = [a.id for a in artworks]
            fav_result = await self.db.execute(
                select(Favorite.artwork_id).where(
                    Favorite.user_id == current_user_id,
                    Favorite.artwork_id.in_(artwork_ids)
                )
            )
            favorited_ids = set(fav_result.scalars().all())
            for a in artworks:
                # We can't set an attribute on the model that isn't in __dict__ easily without SQLAlchemy complaining,
                # but since we're using Pydantic for response, we can set a transient attribute.
                a.is_favorited = a.id in favorited_ids

        return artworks, total

    async def get_similar_by_metadata(self, artwork: Artwork, limit: int = 8) -> List[Artwork]:
        """
        Tier-2 content-based similarity for the 'You might also like' section.

        Scoring (Python-side after a cheap candidate fetch):
          +2  for each shared tag between source and candidate
          +1  if candidate.medium == source.medium  (when source.medium is set)
          +1  if candidate.style  == source.style   (when source.style  is set)

        Only candidates with score > 0 are returned, ordered by score desc then
        created_at desc. Falls back to most-recent published artworks when the
        source has no metadata signals (no tags, no medium, no style).

        All returned Artwork objects are fetched via _base_query_with_relations()
        so images / artwork_tags / artist are already eager-loaded for
        _build_artwork_response() to consume without extra queries.
        """
        source_tag_ids = {at.tag_id for at in artwork.artwork_tags}
        has_signals = bool(source_tag_ids or artwork.medium or artwork.style)

        if not has_signals:
            # Fallback: most-recent published artworks, excluding self
            fallback_q = (
                self._base_query_with_relations()
                .where(
                    Artwork.status == "published",
                    Artwork.deleted_at == None,
                    Artwork.id != artwork.id,
                )
                .order_by(Artwork.created_at.desc())
                .limit(limit)
            )
            result = await self.db.execute(fallback_q)
            return result.scalars().unique().all()

        # ── Step 1: fetch candidate IDs that share at least one tag ────────────
        # We union the tag-overlap candidates with all published artworks so that
        # medium/style-only matches are also considered.
        base_filters = and_(
            Artwork.status == "published",
            Artwork.deleted_at == None,
            Artwork.id != artwork.id,
        )

        # Fetch all candidate artworks with full relations (we'll score in Python)
        candidate_q = (
            self._base_query_with_relations()
            .where(base_filters)
        )
        result = await self.db.execute(candidate_q)
        candidates = result.scalars().unique().all()

        # ── Step 2: score each candidate in Python ──────────────────────────────
        scored: List[tuple] = []  # (score, created_at, artwork_obj)
        for candidate in candidates:
            score = 0
            candidate_tag_ids = {at.tag_id for at in candidate.artwork_tags}
            # +2 per shared tag
            score += 2 * len(source_tag_ids & candidate_tag_ids)
            # +1 for medium match
            if artwork.medium and candidate.medium == artwork.medium:
                score += 1
            # +1 for style match
            if artwork.style and candidate.style == artwork.style:
                score += 1
            if score > 0:
                scored.append((score, candidate.created_at, candidate))

        # Sort: score desc, created_at desc, slice to limit
        scored.sort(key=lambda t: (t[0], t[1]), reverse=True)
        return [t[2] for t in scored[:limit]]

    async def get_similar_by_price(self, artwork: Artwork, limit: int = 8) -> List[Artwork]:
        """
        'At this price' section — candidates within ±20% of the source artwork's price.

        Ordering:
          1. Artworks whose style matches the source artwork's style come first
             (when source.style is set).
          2. Within each style bucket, ordered by smallest absolute price difference.

        Returns an empty list when the source artwork has no price set.
        All returned Artwork objects are eager-loaded via _base_query_with_relations().
        """
        if artwork.price is None:
            return []

        price = float(artwork.price)
        low  = price * 0.8
        high = price * 1.2

        # style_order: 0 for matching style, 1 for everything else
        if artwork.style:
            style_order = case(
                (Artwork.style == artwork.style, 0),
                else_=1,
            )
        else:
            style_order = 1  # no style signal — skip the bucket entirely

        price_diff = func.abs(cast(Artwork.price, Float) - price)

        query = (
            self._base_query_with_relations()
            .where(
                Artwork.status == "published",
                Artwork.deleted_at == None,
                Artwork.id != artwork.id,
                Artwork.price != None,
                cast(Artwork.price, Float) >= low,
                cast(Artwork.price, Float) <= high,
            )
            .order_by(style_order, price_diff)
            .limit(limit)
        )

        result = await self.db.execute(query)
        return result.scalars().unique().all()

    async def get_similar_by_embedding(self, artwork: Artwork, limit: int = 8) -> List[Artwork]:
        """
        Cosine similarity via pgvector.
        Falls back to get_similar_by_metadata() if no embedding exists yet.
        """
        from sqlalchemy import text as sql_text

        check = await self.db.execute(
            sql_text("SELECT 1 FROM artwork_embeddings WHERE artwork_id = :id"),
            {"id": str(artwork.id)},
        )
        if not check.fetchone():
            return await self.get_similar_by_metadata(artwork, limit=limit)

        nn_result = await self.db.execute(
            sql_text("""
                SELECT ae.artwork_id
                FROM artwork_embeddings ae
                JOIN artwork_embeddings ref ON ref.artwork_id = :source_id
                JOIN artworks a ON a.id = ae.artwork_id
                WHERE ae.artwork_id != :source_id
                  AND a.status = 'published'
                  AND a.deleted_at IS NULL
                ORDER BY ae.embedding <=> ref.embedding
                LIMIT :limit
            """),
            {"source_id": str(artwork.id), "limit": limit},
        )
        similar_ids = [row[0] for row in nn_result.fetchall()]

        if not similar_ids:
            return await self.get_similar_by_metadata(artwork, limit=limit)

        candidate_q = (
            self._base_query_with_relations()
            .where(
                Artwork.id.in_(similar_ids),
                Artwork.status == "published",
                Artwork.deleted_at == None,
            )
            .limit(limit)
        )
        result = await self.db.execute(candidate_q)
        artworks = result.scalars().unique().all()

        id_order = {uid: idx for idx, uid in enumerate(similar_ids)}
        return sorted(artworks, key=lambda a: id_order.get(a.id, 999))

    async def get_discovery_tags(self, limit: int = 30) -> List[dict]:
        """
        Returns a merged tag-cloud for the browse page combining:
          - confirmed tags: Tag rows linked to published artworks via ArtworkTag
          - AI-suggested tags: strings from Artwork.ai_tags_suggestion (unnested)

        When the same tag text appears in both sources the counts are summed and
        the source is recorded as 'confirmed'. Sorted by count desc.
        """
        published_filter = and_(
            Artwork.status == "published",
            Artwork.deleted_at == None,
        )

        # ── Confirmed tags ────────────────────────────────────────────────────
        confirmed_q = (
            select(
                func.lower(Tag.name).label("name"),
                func.count(ArtworkTag.artwork_id).label("count"),
            )
            .join(ArtworkTag, ArtworkTag.tag_id == Tag.id)
            .join(Artwork, Artwork.id == ArtworkTag.artwork_id)
            .where(published_filter)
            .group_by(func.lower(Tag.name))
        )
        confirmed_rows = (await self.db.execute(confirmed_q)).fetchall()
        # {lowercased_name: count}
        confirmed_map: dict[str, int] = {row.name: row.count for row in confirmed_rows}

        # ── AI-suggested tags (unnested) ──────────────────────────────────────
        # column_valued() turns unnest() into a scalar column expression that
        # SQLAlchemy adds as an implicit LATERAL in the FROM clause when used
        # inside select() alongside a table. Postgres renders this as:
        #   SELECT lower(unnest(ai_tags_suggestion)) AS name, count(*) AS count
        #   FROM artworks
        #   WHERE ... GROUP BY 1
        unnest_col = func.unnest(Artwork.ai_tags_suggestion).column_valued("ai_tag")
        lowered = func.lower(unnest_col)
        ai_q = (
            select(
                lowered.label("name"),
                func.count().label("count"),
            )
            .select_from(Artwork)
            .where(published_filter)
            .group_by(lowered)
        )
        ai_rows = (await self.db.execute(ai_q)).fetchall()
        ai_map: dict[str, int] = {row.name: row.count for row in ai_rows}

        # ── Merge ─────────────────────────────────────────────────────────────
        merged: dict[str, dict] = {}
        for name, count in confirmed_map.items():
            merged[name] = {"name": name, "count": count, "source": "confirmed"}
        for name, count in ai_map.items():
            if name in merged:
                # same text in both: sum counts, keep 'confirmed' source
                merged[name]["count"] += count
            else:
                merged[name] = {"name": name, "count": count, "source": "ai"}

        sorted_tags = sorted(merged.values(), key=lambda t: t["count"], reverse=True)
        return sorted_tags[:limit]

    async def create(self, artist_id: uuid.UUID, data: dict, tag_ids: List[uuid.UUID] = None) -> Artwork:
        artwork = Artwork(artist_id=artist_id, **data)
        self.db.add(artwork)
        await self.db.flush()  # Get ID before commit
        if tag_ids:
            for tag_id in tag_ids:
                self.db.add(ArtworkTag(artwork_id=artwork.id, tag_id=tag_id))
        await self.db.commit()
        return await self.get_by_id(artwork.id)

    async def update(self, artwork: Artwork, data: dict, tag_ids: List[uuid.UUID] = None) -> Artwork:
        for key, val in data.items():
            if val is not None:
                setattr(artwork, key, val)
        if tag_ids is not None:
            # Replace all tags
            await self.db.execute(
                ArtworkTag.__table__.delete().where(ArtworkTag.artwork_id == artwork.id)
            )
            for tag_id in tag_ids:
                self.db.add(ArtworkTag(artwork_id=artwork.id, tag_id=tag_id))
        await self.db.commit()
        return await self.get_by_id(artwork.id)

    async def soft_delete(self, artwork: Artwork) -> None:
        from datetime import datetime
        artwork.deleted_at = datetime.utcnow()
        await self.db.commit()

    async def publish(self, artwork: Artwork) -> Artwork:
        artwork.status = "published"
        await self.db.commit()
        return await self.get_by_id(artwork.id)

    async def increment_view_count(self, artwork_id: uuid.UUID) -> None:
        """Called from BackgroundTask — gets its own session via dependency."""
        await self.db.execute(
            update(Artwork)
            .where(Artwork.id == artwork_id)
            .values(view_count=Artwork.view_count + 1)
        )
        await self.db.commit()


class ArtworkImageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, image_id: uuid.UUID) -> Optional[ArtworkImage]:
        result = await self.db.execute(
            select(ArtworkImage).where(ArtworkImage.id == image_id)
        )
        return result.scalar_one_or_none()

    async def create(self, image_data: dict) -> ArtworkImage:
        image = ArtworkImage(**image_data)
        self.db.add(image)
        await self.db.commit()
        return image

    async def confirm(self, image_id: uuid.UUID) -> Optional[ArtworkImage]:
        image = await self.get_by_id(image_id)
        if not image:
            return None
        image.is_confirmed = True
        # Set as primary if it's the first confirmed image
        existing = await self.db.execute(
            select(ArtworkImage).where(
                ArtworkImage.artwork_id == image.artwork_id,
                ArtworkImage.is_primary == True,
                ArtworkImage.is_confirmed == True,
            )
        )
        if not existing.scalar_one_or_none():
            image.is_primary = True
        await self.db.commit()
        return image

    async def delete(self, image_id: uuid.UUID) -> bool:
        image = await self.get_by_id(image_id)
        if not image:
            return False
        await self.db.delete(image)
        await self.db.commit()
        return True


class FavoriteRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, user_id: uuid.UUID, artwork_id: uuid.UUID) -> Optional[Favorite]:
        result = await self.db.execute(
            select(Favorite).where(Favorite.user_id == user_id, Favorite.artwork_id == artwork_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: uuid.UUID, skip: int = 0, limit: int = 20):
        # We join with Artwork to get details
        result = await self.db.execute(
            select(Artwork)
            .join(Favorite, Favorite.artwork_id == Artwork.id)
            .where(Favorite.user_id == user_id)
            .options(
                selectinload(Artwork.images),
                selectinload(Artwork.artwork_tags).selectinload(ArtworkTag.tag),
                selectinload(Artwork.artist).selectinload(User.artist_profile),
            )
            .offset(skip).limit(limit)
        )
        artworks = result.scalars().unique().all()
        # Ensure is_favorited is True for all these
        for a in artworks:
            a.is_favorited = True
        return artworks

    async def toggle(self, user_id: uuid.UUID, artwork_id: uuid.UUID) -> bool:
        """Returns True if favorited, False if unfavorited."""
        existing = await self.get(user_id, artwork_id)
        if existing:
            await self.db.delete(existing)
            await self.db.commit()
            return False
        else:
            self.db.add(Favorite(user_id=user_id, artwork_id=artwork_id))
            await self.db.commit()
            return True