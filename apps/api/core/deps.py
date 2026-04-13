import uuid
from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import verify_supabase_token
from models import User

bearer_scheme = HTTPBearer()

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Verify JWT, look up User in DB by supabase_user_id.
    Lazy-creates User row if first access (email must be in JWT).
    Returns User ORM model.
    """
    from repositories.user import UserRepository
    try:
        payload = await verify_supabase_token(credentials.credentials)
    except HTTPException as e:
        print(f"Auth failure: {e.detail}")
        raise e

    if "sub" not in payload:
        print("Auth failure: Token missing subject claim")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    supabase_user_id = uuid.UUID(payload["sub"])
    email = payload.get("email", "")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_supabase_id(supabase_user_id)

    if not user:
        # Lazy sync — first request from this Supabase user
        print(f"Lazy-syncing new user: {email} ({supabase_user_id})")
        user = await user_repo.create_from_jwt(
            supabase_user_id=supabase_user_id,
            email=email,
        )

    if not user.is_active:
        print(f"Auth failure: Account deactivated for user {email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    return user


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        from core.security import verify_supabase_token
        from repositories.user import UserRepository
        import uuid
        payload = await verify_supabase_token(token)
        supabase_user_id = uuid.UUID(payload["sub"])
        user_repo = UserRepository(db)
        return await user_repo.get_by_supabase_id(supabase_user_id)
    except Exception:
        return None


def require_role(*roles: str):
    """
    Dependency factory. Raises 403 if user's DB role is not in the allowed set.
    Pass multiple roles for OR logic: require_role("artist", "admin")
    """
    async def _check(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(roles)}",
            )
        return user
    return _check


# Type aliases for clean router signatures
CurrentUser = Annotated[User, Depends(get_current_user)]

require_artist = require_role("artist", "admin")
require_buyer = require_role("buyer", "admin")
require_admin = require_role("admin")

# Annotated versions for even cleaner signatures
RequiredArtist = Annotated[User, Depends(require_artist)]
RequiredBuyer = Annotated[User, Depends(require_buyer)]
RequiredAdmin = Annotated[User, Depends(require_admin)]