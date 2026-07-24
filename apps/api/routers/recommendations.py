"""
Personalised recommendations for authenticated buyers.
GET /api/recommendations/for-me

Returns:
  - Buyer's favorited artworks
  - PLUS 3 recommended artworks (AI picks via vector similarity + trending top-up)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text as sql_text
from core.deps import get_db, get_current_user
from repositories.artwork import ArtworkRepository
from routers.artworks import _build_artwork_response, SimilarArtworksResponse
from models import User

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/for-me", response_model=SimilarArtworksResponse)
async def get_recommendations_for_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 12,
):
    """
    Personalised feed for the authenticated buyer:
    Includes the buyer's favorited artworks PLUS 3 recommended artworks.
    """
    user_id = str(current_user.id)
    rec_limit = 3

    # ── 1. Buyer's favorited artworks ─────────────────────────────────────────
    fav_rows = (await db.execute(
        sql_text("""
            SELECT f.artwork_id 
            FROM favorites f
            JOIN artworks a ON a.id = f.artwork_id
            WHERE f.user_id = :user_id
              AND a.status = 'published'
              AND a.deleted_at IS NULL
            ORDER BY f.created_at DESC
        """),
        {"user_id": user_id},
    )).fetchall()
    fav_ids = [row[0] for row in fav_rows]

    # ── 2. Centroid of favorited artwork embeddings ───────────────────────────
    centroid_row = (await db.execute(
        sql_text("""
            SELECT avg(ae.embedding) AS centroid
            FROM favorites f
            JOIN artwork_embeddings ae ON ae.artwork_id = f.artwork_id
            WHERE f.user_id = :user_id
        """),
        {"user_id": user_id},
    )).fetchone()

    ai_rec_ids: list = []

    # ── 3. Embedding-based recommendations (up to 3 items) ─────────────────────
    if centroid_row and centroid_row[0] is not None:
        rows = (await db.execute(
            sql_text("""
                SELECT ae.artwork_id
                FROM artwork_embeddings ae
                JOIN artworks a ON a.id = ae.artwork_id
                WHERE a.status = 'published'
                  AND a.deleted_at IS NULL
                  AND ae.artwork_id NOT IN (
                      SELECT artwork_id FROM favorites WHERE user_id = :user_id
                      UNION
                      SELECT oi.artwork_id FROM order_items oi
                      JOIN orders o ON o.id = oi.order_id
                      WHERE o.buyer_id = :user_id
                  )
                ORDER BY ae.embedding <=> CAST(:centroid AS vector(384))
                LIMIT :limit
            """),
            {"user_id": user_id, "centroid": str(centroid_row[0]), "limit": rec_limit},
        )).fetchall()
        ai_rec_ids = [row[0] for row in rows]

    # ── 4. Trending top-up if less than 3 AI recommendations found ────────────
    if len(ai_rec_ids) < rec_limit:
        needed = rec_limit - len(ai_rec_ids)
        already_picked_clause = ""
        if ai_rec_ids:
            uuid_list = ", ".join(f"'{str(uid)}'" for uid in ai_rec_ids)
            already_picked_clause = f"AND id NOT IN ({uuid_list})"

        fallback_rows = (await db.execute(
            sql_text(f"""
                SELECT id FROM artworks
                WHERE status = 'published'
                  AND deleted_at IS NULL
                  AND id NOT IN (
                      SELECT artwork_id FROM favorites WHERE user_id = :user_id
                      UNION
                      SELECT oi.artwork_id FROM order_items oi
                      JOIN orders o ON o.id = oi.order_id
                      WHERE o.buyer_id = :user_id
                  )
                  {already_picked_clause}
                ORDER BY view_count DESC
                LIMIT :needed
            """),
            {"user_id": user_id, "needed": needed},
        )).fetchall()

        ai_rec_ids += [row[0] for row in fallback_rows]

    # ── 5. Combine favorited artworks + 3 recommended artworks ────────────────
    all_ids = fav_ids + ai_rec_ids

    # ── 6. Load full artwork objects and build response ───────────────────────
    repo = ArtworkRepository(db)
    artworks = [a for aid in all_ids if (a := await repo.get_by_id(aid))]
    return SimilarArtworksResponse(artworks=[_build_artwork_response(a) for a in artworks])
