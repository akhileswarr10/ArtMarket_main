import pytest
import uuid
from tests.conftest import make_jwt

@pytest.mark.asyncio
async def test_artist_can_create_artwork(client):
    sup_id = str(uuid.uuid4())
    token = make_jwt(sup_id, role="artist")
    await client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    await client.post("/api/users/me/onboard",
        json={"role": "artist", "display_name": "Test Artist"},
        headers={"Authorization": f"Bearer {token}"}
    )
    response = await client.post("/api/artworks",
        json={"title": "Sunset", "price": 500.0, "medium": "oil"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Sunset"
    assert data["status"] == "draft"
    assert data["images"] == []

@pytest.mark.asyncio
async def test_artwork_soft_delete(client):
    sup_id = str(uuid.uuid4())
    token = make_jwt(sup_id, role="artist")
    await client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    await client.post("/api/users/me/onboard",
        json={"role": "artist", "display_name": "Artist2"},
        headers={"Authorization": f"Bearer {token}"}
    )
    create_resp = await client.post("/api/artworks",
        json={"title": "To Delete"},
        headers={"Authorization": f"Bearer {token}"}
    )
    artwork_id = create_resp.json()["id"]
    delete_resp = await client.delete(f"/api/artworks/{artwork_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert delete_resp.status_code == 204
    get_resp = await client.get(f"/api/artworks/{artwork_id}")
    assert get_resp.status_code == 404

@pytest.mark.asyncio
async def test_ownership_check(client):
    sup1 = str(uuid.uuid4())
    sup2 = str(uuid.uuid4())
    token1 = make_jwt(sup1, role="artist")
    token2 = make_jwt(sup2, role="artist")
    for sup, token, name in [(sup1, token1, "A1"), (sup2, token2, "A2")]:
        await client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
        await client.post("/api/users/me/onboard",
            json={"role": "artist", "display_name": name},
            headers={"Authorization": f"Bearer {token}"}
        )
    resp = await client.post("/api/artworks",
        json={"title": "Artist1 Work"},
        headers={"Authorization": f"Bearer {token1}"}
    )
    artwork_id = resp.json()["id"]
    update_resp = await client.patch(f"/api/artworks/{artwork_id}",
        json={"title": "Hijacked"},
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert update_resp.status_code == 403
