# role_model.md — Role Model

## 1. Roles

There are exactly three roles in the system: `buyer`, `artist`, `admin`.

| Role   | Who they are                                   | How they get the role        |
|--------|------------------------------------------------|------------------------------|
| buyer  | Browses and purchases artworks                 | Self-selected during onboarding |
| artist | Uploads artworks, receives payouts             | Self-selected during onboarding |
| admin  | Manages platform, moderates content, analytics | Assigned by another admin via Supabase Admin API |

A user with `null` role has completed Supabase Auth signup but has not yet completed onboarding. They are blocked from all role-protected routes.

---

## 2. How Roles Are Set

### Buyer / Artist (Self-service)
1. User completes Supabase Auth signup (email + password or OAuth).
2. Supabase Auth webhook fires → FastAPI creates `User` row with `role=null`.
3. Frontend redirects to `/register/complete`.
4. User selects "I'm an Artist" or "I'm a Buyer".
5. Frontend calls `POST /api/users/me/onboard` with `{role, display_name}`.
6. FastAPI:
   a. Creates `ArtistProfile` or `BuyerProfile` in DB.
   b. Calls Supabase Admin Auth API (`update_user_by_id`) to set `app_metadata.role`.
   c. Updates `users.role` in local DB.
7. User is instructed to sign out and back in (or frontend calls `supabase.auth.refreshSession()`), so the new JWT includes the `app_metadata.role` claim.

### Admin (Manual elevation)
Only existing admins can create other admins. The first admin is created manually via the Supabase Studio dashboard:

```
Supabase Studio → Authentication → Users → [user] → Update user_metadata (service role only) → set app_metadata.role = "admin"
```

Or via script using the Supabase Admin API:
```python
supabase_admin.auth.admin.update_user_by_id(
    uid=user.supabase_user_id,
    attributes={"app_metadata": {"role": "admin"}}
)
```

After update: FastAPI also updates `users.role = 'admin'` in its own DB for consistency.

---

## 3. FastAPI Role Enforcement

### Dependency Hierarchy

```python
# deps.py

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    """Verifies JWT and loads User from DB. Raises 401 if invalid."""
    payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
    supabase_user_id = payload["sub"]
    user = await UserRepository(db).get_by_supabase_id(supabase_user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401)
    return user

def require_role(role: str):
    """Factory for role-specific dependencies."""
    async def check_role(user: User = Depends(get_current_user)) -> User:
        if user.role != role:
            raise HTTPException(status_code=403, detail=f"Requires {role} role")
        return user
    return check_role

# Convenience aliases
require_artist = lambda: Depends(require_role("artist"))
require_buyer  = lambda: Depends(require_role("buyer"))
require_admin  = lambda: Depends(require_role("admin"))
```

### Usage in Routers
```python
@router.post("/artworks")
async def create_artwork(user: User = Depends(require_artist()), ...):
    ...

@router.post("/payments/checkout")
async def checkout(user: User = Depends(require_buyer()), ...):
    ...

@router.get("/admin/users")
async def list_users(user: User = Depends(require_admin()), ...):
    ...
```

**Role reads from DB, not JWT.** The JWT is used only to identify the user (via `sub` claim). The role is read from `users.role` in FastAPI's own DB. This means:
- Role changes take effect immediately for subsequent requests (no JWT refresh needed).
- Avoids trusting the JWT claim for authorization (defense in depth).

> **Exception:** The onboarding endpoint (`POST /api/users/me/onboard`) accepts `null` role users. It uses `get_current_user` without a role check.

---

## 4. RLS Policies that Enforce Role at DB Level

RLS enforces role via `auth.jwt()->'app_metadata'->>'role'`. This reads from the Supabase JWT, which is populated from `app_metadata` (server-writable only).

Key role-based RLS policies:

```sql
-- Only artists can insert artworks
CREATE POLICY "artworks_insert_artist_only" ON artworks FOR INSERT
  WITH CHECK (auth.jwt()->'app_metadata'->>'role' = 'artist');

-- Only admins can read audit logs
CREATE POLICY "audit_logs_admin_only" ON audit_logs FOR SELECT
  USING (auth.jwt()->'app_metadata'->>'role' = 'admin');

-- Buyers can only modify their own cart
CREATE POLICY "cart_buyer_only" ON cart FOR ALL
  USING (
    (SELECT supabase_user_id FROM users WHERE id = buyer_id) = auth.uid()
    AND auth.jwt()->'app_metadata'->>'role' = 'buyer'
  );
```

These policies only apply to direct PostgREST API access. FastAPI uses the service role key and bypasses RLS entirely. The RLS is a safety net in case of:
- Developer testing via Supabase Studio
- Accidental use of `anon` key instead of service role key
- Misconfigured frontend making direct PostgREST calls

---

## 5. Permission Matrix

| Action                              | buyer | artist | admin |
|-------------------------------------|:-----:|:------:|:-----:|
| **Auth & Profile**                  |       |        |       |
| Complete onboarding (set own role)  | ✓     | ✓      | ✓     |
| Update own profile                  | ✓     | ✓      | ✓     |
| View own profile                    | ✓     | ✓      | ✓     |
| View other user's public profile    | ✓     | ✓      | ✓     |
| Change any user's role              | ✗     | ✗      | ✓     |
| Deactivate any user                 | ✗     | ✗      | ✓     |
| **Artworks**                        |       |        |       |
| Create artwork                      | ✗     | ✓      | ✓     |
| Update own artwork                  | ✗     | ✓      | ✓     |
| Delete (soft) own artwork           | ✗     | ✓      | ✓     |
| Publish own artwork                 | ✗     | ✓      | ✓     |
| View published artworks             | ✓     | ✓      | ✓     |
| View own draft artworks             | ✗     | ✓      | ✓     |
| View any draft artwork              | ✗     | ✗      | ✓     |
| Approve/reject artwork              | ✗     | ✗      | ✓     |
| Upload image to own artwork         | ✗     | ✓      | ✓     |
| **Browse & Discovery**              |       |        |       |
| Browse public artworks              | ✓     | ✓      | ✓     |
| Search artworks                     | ✓     | ✓      | ✓     |
| Add/remove favorite                 | ✓     | ✓      | ✓     |
| View own favorites                  | ✓     | ✓      | ✓     |
| **AI**                              |       |        |       |
| View AI job results for own artwork | ✗     | ✓      | ✓     |
| Apply AI suggestions                | ✗     | ✓      | ✓     |
| **Cart & Checkout**                 |       |        |       |
| Add to cart                         | ✓     | ✗      | ✗     |
| View own cart                       | ✓     | ✗      | ✗     |
| Checkout                            | ✓     | ✗      | ✗     |
| **Orders**                          |       |        |       |
| View own purchase orders            | ✓     | ✗      | ✓     |
| View own sales (as artist)          | ✗     | ✓      | ✓     |
| View all orders                     | ✗     | ✗      | ✓     |
| **Notifications**                   |       |        |       |
| View own notifications              | ✓     | ✓      | ✓     |
| Mark notification read              | ✓     | ✓      | ✓     |
| **Admin**                           |       |        |       |
| View audit logs                     | ✗     | ✗      | ✓     |
| View analytics                      | ✗     | ✗      | ✓     |
| Manage categories and tags          | ✗     | ✗      | ✓     |

---

## 6. Edge Cases & Guard Rails

### Artist Buying Art
Artists have the `artist` role and cannot add to cart or checkout. If an artist wants to buy art, they must register a separate buyer account. This is a deliberate simplification — mixed roles in a single account add significant complexity to every permission check.

### Admin Overrides
Admins can perform any artist action (create, update, delete artworks) for moderation purposes. All admin actions are recorded in `audit_logs` with the admin's user_id.

### Role Change Mid-Session
When an admin changes a user's role:
1. FastAPI updates `users.role` in DB immediately.
2. FastAPI calls Supabase Admin API to update `app_metadata.role`.
3. The user's *current* JWT still contains the old role until refresh.
4. FastAPI reads role from DB, so the change is **effective immediately** for the next API request.

### No Role = No Access
A user with `role=null` can only call:
- `GET /api/users/me`
- `POST /api/users/me/onboard`
- `GET /api/health`

All other endpoints return 403.