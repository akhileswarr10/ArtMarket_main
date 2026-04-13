import pytest
import uuid
from tests.conftest import make_jwt

@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_jwt_verification_rejects_invalid_token(client):
    response = await client.get("/api/users/me", headers={"Authorization": "Bearer invalid_token"})
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_lazy_user_creation_on_first_request(client):
    sup_id = str(uuid.uuid4())
    token = make_jwt(sup_id, role=None, email="new@example.com")
    response = await client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "new@example.com"
    assert data["role"] is None

@pytest.mark.asyncio
async def test_role_enforcement_artist_required(client):
    sup_id = str(uuid.uuid4())
    buyer_token = make_jwt(sup_id, role="buyer")
    await client.get("/api/users/me", headers={"Authorization": f"Bearer {buyer_token}"})
    await client.post("/api/users/me/onboard",
        json={"role": "buyer", "display_name": "Test Buyer"},
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    response = await client.post("/api/artworks",
        json={"title": "Test"},
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_unauthenticated_request_rejected(client):
    response = await client.get("/api/users/me")
    assert response.status_code == 401