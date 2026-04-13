# api_contract.md — API Contract (OpenAPI-style)

> **Auth Note:** All Supabase Auth flows (register, login, refresh, password reset) happen client-side via Supabase JS SDK. FastAPI has **no** `/auth/login` or `/auth/register` endpoints. FastAPI only has the webhook receiver and the onboarding endpoint.

> **Auth Header:** All authenticated endpoints require `Authorization: Bearer <supabase_jwt>`.

---

## Health

| Method | Path          | Auth | Request Body | Response                     | Phase |
|--------|---------------|------|--------------|------------------------------|-------|
| GET    | `/api/health` | None | —            | `{status: "ok", version: string}` | 0 |

---

## Auth (Webhook + Onboarding)

| Method | Path                          | Auth           | Request Body                                      | Response                              | Phase |
|--------|-------------------------------|----------------|---------------------------------------------------|---------------------------------------|-------|
| POST   | `/api/auth/webhook`           | Webhook secret | `{event: "signup", user: {id, email}}`            | `{ok: true}`                          | 1     |
| POST   | `/api/users/me/onboard`       | JWT (any)      | `{role: "artist"\|"buyer", display_name: string}` | `UserResponse`                        | 1     |

---

## Users

| Method | Path                              | Auth       | Request Body                        | Response                     | Phase |
|--------|-----------------------------------|------------|-------------------------------------|------------------------------|-------|
| GET    | `/api/users/me`                   | JWT (any)  | —                                   | `UserResponse`               | 1     |
| PATCH  | `/api/users/me/profile`           | JWT (any)  | `{display_name?, bio?, avatar_url?, website_url?}` | `ProfileResponse` | 1 |
| GET    | `/api/users/me/profile`           | JWT (any)  | —                                   | `ProfileResponse`            | 1     |

---

## Artworks

| Method | Path                                      | Auth         | Request Body                                           | Response                       | Phase |
|--------|-------------------------------------------|--------------|--------------------------------------------------------|--------------------------------|-------|
| POST   | `/api/artworks`                           | JWT (artist) | `{title, description?, medium?, style?, dimensions?, price, category_id?, tags?: string[]}` | `ArtworkResponse` | 1 |
| GET    | `/api/artworks`                           | None         | Query: `?q&category_id&min_price&max_price&medium&style&sort&skip&limit` | `{artworks: ArtworkResponse[], total: int}` | 3 |
| GET    | `/api/artworks/mine`                      | JWT (artist) | Query: `?status&skip&limit`                            | `{artworks: ArtworkResponse[], total: int}` | 1 |
| GET    | `/api/artworks/{artwork_id}`              | None*        | —                                                      | `ArtworkResponse`              | 1     |
| PATCH  | `/api/artworks/{artwork_id}`              | JWT (artist) | `{title?, description?, medium?, style?, dimensions?, price?, category_id?, tags?}` | `ArtworkResponse` | 1 |
| DELETE | `/api/artworks/{artwork_id}`              | JWT (artist) | —                                                      | `{ok: true}`                   | 1     |
| POST   | `/api/artworks/{artwork_id}/publish`      | JWT (artist) | —                                                      | `ArtworkResponse`              | 2     |
| GET    | `/api/artworks/{artwork_id}/ai-suggestions` | JWT (artist) | —                                                    | `AIJobResponse`                | 2     |
| POST   | `/api/artworks/{artwork_id}/ai-suggestions/apply` | JWT (artist) | `{title?, description?, price?}`             | `ArtworkResponse`              | 2     |
| GET    | `/api/artworks/artist/{artist_id}`        | None         | Query: `?skip&limit`                                   | `{artworks: ArtworkResponse[], total: int}` | 3 |

> *`GET /api/artworks/{id}` returns draft artworks only to the owning artist (checked via JWT). Returns 404 to unauthenticated users for non-published artworks.

---

## Artwork Images

| Method | Path                                           | Auth         | Request Body                     | Response                           | Phase |
|--------|------------------------------------------------|--------------|----------------------------------|------------------------------------|-------|
| POST   | `/api/artworks/{artwork_id}/images/presign`    | JWT (artist) | —                                | `{signed_url, storage_path, image_id}` | 1 |
| POST   | `/api/artworks/{artwork_id}/images/confirm`    | JWT (artist) | `{image_id: uuid}`               | `ArtworkImageResponse`             | 1     |
| DELETE | `/api/artworks/{artwork_id}/images/{image_id}` | JWT (artist) | —                                | `{ok: true}`                       | 1     |

---

## Categories

| Method | Path                       | Auth | Request Body | Response                           | Phase |
|--------|----------------------------|------|--------------|------------------------------------|-------|
| GET    | `/api/categories`          | None | —            | `{categories: CategoryResponse[]}` | 1     |
| GET    | `/api/categories/{slug}`   | None | —            | `CategoryResponse`                 | 3     |

---

## Tags

| Method | Path        | Auth | Request Body | Response                    | Phase |
|--------|-------------|------|--------------|-----------------------------|-------|
| GET    | `/api/tags` | None | —            | `{tags: TagResponse[]}`     | 1     |

---

## Favorites

| Method | Path                             | Auth        | Request Body         | Response           | Phase |
|--------|----------------------------------|-------------|----------------------|--------------------|-------|
| GET    | `/api/favorites`                 | JWT (buyer) | —                    | `{artworks: ArtworkResponse[]}` | 3 |
| POST   | `/api/favorites`                 | JWT (buyer) | `{artwork_id: uuid}` | `{ok: true}`       | 3     |
| DELETE | `/api/favorites/{artwork_id}`    | JWT (buyer) | —                    | `{ok: true}`       | 3     |

---

## Cart

| Method | Path                            | Auth        | Request Body         | Response           | Phase |
|--------|---------------------------------|-------------|----------------------|--------------------|-------|
| GET    | `/api/cart`                     | JWT (buyer) | —                    | `CartResponse`     | 4     |
| POST   | `/api/cart/items`               | JWT (buyer) | `{artwork_id: uuid}` | `CartResponse`     | 4     |
| DELETE | `/api/cart/items/{artwork_id}`  | JWT (buyer) | —                    | `CartResponse`     | 4     |
| DELETE | `/api/cart`                     | JWT (buyer) | —                    | `{ok: true}`       | 4     |

---

## Payments

| Method | Path                              | Auth        | Request Body                                       | Response                          | Phase |
|--------|-----------------------------------|-------------|----------------------------------------------------|------------------------------------|-------|
| POST   | `/api/payments/checkout`          | JWT (buyer) | `{artwork_ids: uuid[], shipping_address: Address}` | `{client_secret, order_id}`       | 4     |
| POST   | `/api/payments/webhook`           | Stripe sig  | Raw Stripe event body                              | `{ok: true}`                      | 4     |
| POST   | `/api/payments/connect/onboard`   | JWT (artist)| —                                                  | `{onboarding_url: string}`        | 4     |
| GET    | `/api/payments/connect/status`    | JWT (artist)| —                                                  | `{connected: bool, charges_enabled: bool}` | 4 |

---

## Orders

| Method | Path                   | Auth         | Request Body | Response                         | Phase |
|--------|------------------------|--------------|--------------|----------------------------------|-------|
| GET    | `/api/orders`          | JWT (buyer)  | —            | `{orders: OrderResponse[]}`      | 4     |
| GET    | `/api/orders/{id}`     | JWT (any)    | —            | `OrderResponse`                  | 4     |
| GET    | `/api/orders/sales`    | JWT (artist) | —            | `{orders: OrderResponse[]}`      | 4     |

---

## Notifications

| Method | Path                              | Auth      | Request Body | Response                              | Phase |
|--------|-----------------------------------|-----------|--------------|---------------------------------------|-------|
| GET    | `/api/notifications`              | JWT (any) | Query: `?unread_only` | `{notifications: NotificationResponse[]}` | 2 |
| PATCH  | `/api/notifications/{id}/read`    | JWT (any) | —            | `{ok: true}`                          | 2     |
| PATCH  | `/api/notifications/read-all`     | JWT (any) | —            | `{ok: true}`                          | 5     |

---

## AI

| Method | Path                     | Auth         | Request Body | Response       | Phase |
|--------|--------------------------|--------------|--------------|----------------|-------|
| GET    | `/api/ai/jobs/{id}`      | JWT (artist) | —            | `AIJobResponse`| 2     |

---

## Admin

| Method | Path                                   | Auth         | Request Body                    | Response              | Phase |
|--------|----------------------------------------|--------------|---------------------------------|-----------------------|-------|
| GET    | `/api/admin/users`                     | JWT (admin)  | Query: `?role&skip&limit`       | `{users: UserResponse[]}` | 5 |
| PATCH  | `/api/admin/users/{id}/role`           | JWT (admin)  | `{role: "artist"\|"buyer"\|"admin"}` | `{ok: true}`     | 5     |
| PATCH  | `/api/admin/users/{id}/deactivate`     | JWT (admin)  | —                               | `{ok: true}`          | 5     |
| GET    | `/api/admin/artworks`                  | JWT (admin)  | Query: `?status&skip&limit`     | `{artworks: ArtworkResponse[]}` | 5 |
| POST   | `/api/admin/artworks/{id}/approve`     | JWT (admin)  | —                               | `ArtworkResponse`     | 5     |
| POST   | `/api/admin/artworks/{id}/reject`      | JWT (admin)  | `{reason: string}`              | `{ok: true}`          | 5     |
| GET    | `/api/admin/audit-logs`                | JWT (admin)  | Query: `?entity_type&entity_id&skip&limit` | `{logs: AuditLogResponse[]}` | 5 |
| GET    | `/api/admin/analytics`                 | JWT (admin)  | Query: `?from&to`               | `AnalyticsResponse`   | 5     |

---

## Response Schema Reference

### ArtworkResponse
```json
{
  "id": "uuid",
  "artist_id": "uuid",
  "category_id": "uuid | null",
  "title": "string",
  "description": "string | null",
  "medium": "string | null",
  "style": "string | null",
  "dimensions": "string | null",
  "price": 0.00,
  "status": "draft | published | sold | archived",
  "view_count": 0,
  "images": [ArtworkImageResponse],
  "tags": [TagResponse],
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### UserResponse
```json
{
  "id": "uuid",
  "email": "string",
  "role": "buyer | artist | admin | null",
  "is_active": true,
  "profile": { ArtistProfileResponse | BuyerProfileResponse | null },
  "created_at": "ISO8601"
}
```

### AIJobResponse
```json
{
  "id": "uuid",
  "artwork_id": "uuid",
  "job_type": "captioning | pricing",
  "status": "queued | running | done | failed",
  "result": {
    "title": "string | null",
    "description": "string | null",
    "suggested_price": 0.00
  },
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### Error Response (all errors)
```json
{
  "detail": "Human-readable error message",
  "code": "machine_readable_code"
}
```