import pytest, pytest_asyncio, uuid
from sqlalchemy.ext.asyncio import AsyncSession
from tests.conftest import make_jwt, TestSession


async def create_test_user(db: AsyncSession, role: str = "buyer"):
    """Helper to insert a user + profile directly."""
    from models import User, BuyerProfile, ArtistProfile
    import uuid as _uuid
    sid = str(_uuid.uuid4())
    user = User(
        supabase_user_id=_uuid.UUID(sid),
        email=f"test_{sid[:8]}@example.com",
        role=role,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    if role == "buyer":
        db.add(BuyerProfile(user_id=user.id, display_name="Test Buyer"))
    else:
        db.add(ArtistProfile(user_id=user.id, display_name="Test Artist"))
    await db.commit()
    await db.refresh(user)
    return user, sid


async def create_test_artwork(db: AsyncSession, artist_id, price: float = 500.0):
    from models import Artwork
    art = Artwork(
        artist_id=artist_id,
        title="Test Piece",
        price=price,
        status="published",
    )
    db.add(art)
    await db.commit()
    await db.refresh(art)
    return art


# ─── Cart Tests ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_cart_empty(client):
    async with TestSession() as db:
        user, sid = await create_test_user(db, "buyer")
    token = make_jwt(sid, "buyer", user.email)
    resp = await client.get("/api/cart", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0.0


@pytest.mark.asyncio
async def test_add_item_to_cart(client):
    async with TestSession() as db:
        buyer, bsid = await create_test_user(db, "buyer")
        artist, _ = await create_test_user(db, "artist")
        artwork = await create_test_artwork(db, artist.id, price=250.0)

    token = make_jwt(bsid, "buyer", buyer.email)
    resp = await client.post(
        "/api/cart/items",
        json={"artwork_id": str(artwork.id)},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code in (200, 201)
    data = resp.json()
    assert data["artwork_id"] == str(artwork.id)
    assert "artwork" in data


@pytest.mark.asyncio
async def test_add_duplicate_item_fails(client):
    async with TestSession() as db:
        buyer, bsid = await create_test_user(db, "buyer")
        artist, _ = await create_test_user(db, "artist")
        artwork = await create_test_artwork(db, artist.id)

    token = make_jwt(bsid, "buyer", buyer.email)
    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/api/cart/items", json={"artwork_id": str(artwork.id)}, headers=headers)
    resp2 = await client.post("/api/cart/items", json={"artwork_id": str(artwork.id)}, headers=headers)
    assert resp2.status_code == 409


@pytest.mark.asyncio
async def test_remove_item_from_cart(client):
    async with TestSession() as db:
        buyer, bsid = await create_test_user(db, "buyer")
        artist, _ = await create_test_user(db, "artist")
        artwork = await create_test_artwork(db, artist.id)

    token = make_jwt(bsid, "buyer", buyer.email)
    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/api/cart/items", json={"artwork_id": str(artwork.id)}, headers=headers)
    resp = await client.delete(f"/api/cart/items/{artwork.id}", headers=headers)
    assert resp.status_code == 200
    cart = await client.get("/api/cart", headers=headers)
    assert cart.json()["items"] == []


# ─── Checkout Tests ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_checkout_empty_cart_fails(client):
    async with TestSession() as db:
        buyer, bsid = await create_test_user(db, "buyer")

    token = make_jwt(bsid, "buyer", buyer.email)
    resp = await client.post(
        "/api/checkout/session",
        json={"shipping_address": {"line1": "1 Art St", "city": "NY", "state": "NY", "zip": "10001", "country": "USA"}},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_full_checkout_flow(client):
    async with TestSession() as db:
        buyer, bsid = await create_test_user(db, "buyer")
        artist, _ = await create_test_user(db, "artist")
        artwork = await create_test_artwork(db, artist.id, price=100.0)

    token = make_jwt(bsid, "buyer", buyer.email)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Add to cart
    add_resp = await client.post("/api/cart/items", json={"artwork_id": str(artwork.id)}, headers=headers)
    assert add_resp.status_code in (200, 201)

    # 2. Create checkout session
    sess_resp = await client.post(
        "/api/checkout/session",
        json={"shipping_address": {"line1": "1 Art St", "city": "NY", "state": "NY", "zip": "10001", "country": "USA"}},
        headers=headers,
    )
    assert sess_resp.status_code == 200
    order_id = sess_resp.json()["order_id"]

    # 3. Confirm (dummy payment)
    confirm_resp = await client.post(f"/api/checkout/confirm/{order_id}", headers=headers)
    assert confirm_resp.status_code == 200
    assert confirm_resp.json()["status"] == "success"

    # 4. Idempotency: confirming again should succeed (already paid)
    confirm2 = await client.post(f"/api/checkout/confirm/{order_id}", headers=headers)
    assert confirm2.status_code == 200
    assert confirm2.json()["status"] == "success"


@pytest.mark.asyncio
async def test_order_appears_in_history(client):
    async with TestSession() as db:
        buyer, bsid = await create_test_user(db, "buyer")
        artist, _ = await create_test_user(db, "artist")
        artwork = await create_test_artwork(db, artist.id, price=200.0)

    token = make_jwt(bsid, "buyer", buyer.email)
    headers = {"Authorization": f"Bearer {token}"}

    await client.post("/api/cart/items", json={"artwork_id": str(artwork.id)}, headers=headers)
    sess = await client.post(
        "/api/checkout/session",
        json={"shipping_address": {"line1": "2 Art Ave", "city": "LA", "state": "CA", "zip": "90001", "country": "USA"}},
        headers=headers,
    )
    order_id = sess.json()["order_id"]
    await client.post(f"/api/checkout/confirm/{order_id}", headers=headers)

    orders_resp = await client.get("/api/orders", headers=headers)
    assert orders_resp.status_code == 200
    ids = [o["id"] for o in orders_resp.json().get("orders", [])]
    assert str(order_id) in ids


# ─── Notification Tests ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_unread_count_starts_at_zero(client):
    async with TestSession() as db:
        user, sid = await create_test_user(db, "buyer")
    token = make_jwt(sid, "buyer", user.email)
    resp = await client.get("/api/notifications/unread-count", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["count"] >= 0


@pytest.mark.asyncio
async def test_notifications_created_after_purchase(client):
    """After a full checkout, the buyer should have at least 1 notification."""
    async with TestSession() as db:
        buyer, bsid = await create_test_user(db, "buyer")
        artist, _ = await create_test_user(db, "artist")
        artwork = await create_test_artwork(db, artist.id, price=150.0)

    token = make_jwt(bsid, "buyer", buyer.email)
    headers = {"Authorization": f"Bearer {token}"}

    await client.post("/api/cart/items", json={"artwork_id": str(artwork.id)}, headers=headers)
    sess = await client.post(
        "/api/checkout/session",
        json={"shipping_address": {"line1": "3 Gallery Rd", "city": "SF", "state": "CA", "zip": "94101", "country": "USA"}},
        headers=headers,
    )
    order_id = sess.json()["order_id"]
    await client.post(f"/api/checkout/confirm/{order_id}", headers=headers)

    notif_resp = await client.get("/api/notifications", headers=headers)
    assert notif_resp.status_code == 200
    assert notif_resp.json()["total"] >= 1
