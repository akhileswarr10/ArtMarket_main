from jose import jwt, JWTError, jwk
from fastapi import HTTPException, status
import httpx
from core.config import get_settings

settings = get_settings()

_jwks: dict = None

async def get_jwks() -> dict:
    """Fetch and cache Supabase JWKS."""
    global _jwks
    if _jwks is None:
        url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
                _jwks = response.json()
            except Exception as e:
                print(f"Error fetching JWKS: {e}")
                raise HTTPException(
                    status_code=500,
                    detail="Could not verify token: JWKS fetch failed"
                )
    return _jwks

async def verify_supabase_token(token: str) -> dict:
    """
    Verify a Supabase JWT and return the decoded payload.
    Supports both HS256 (symmetric) and ES256 (asymmetric via JWKS).
    """
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        
        if alg == "HS256":
            # Symmetric verification using secret
            try:
                # First attempt: raw secret
                return jwt.decode(
                    token, 
                    settings.SUPABASE_JWT_SECRET, 
                    algorithms=["HS256"], 
                    options={"verify_aud": False}
                )
            except JWTError:
                # Second attempt: base64 decoded secret
                import base64
                decoded_secret = base64.b64decode(settings.SUPABASE_JWT_SECRET)
                return jwt.decode(
                    token,
                    decoded_secret,
                    algorithms=["HS256"],
                    options={"verify_aud": False}
                )
        
        elif alg == "ES256":
            # Asymmetric verification using JWKS
            jwks = await get_jwks()
            kid = header.get("kid")
            key_data = next((k for k in jwks["keys"] if k["kid"] == kid), None)
            if not key_data:
                raise JWTError(f"Public key for kid {kid} not found in JWKS")
            
            public_key = jwk.construct(key_data)
            payload = jwt.decode(
                token,
                public_key.to_pem(),
                algorithms=["ES256"],
                options={"verify_aud": False}
            )
            
            # Manually verify audience
            if "aud" in payload and payload["aud"] != "authenticated":
                 raise JWTError("Invalid audience")
            return payload

        else:
            raise JWTError(f"Unsupported algorithm: {alg}")

    except JWTError as e:
        print(f"JWT Header: {jwt.get_unverified_header(token) if token else 'None'}")
        detail = f"Invalid token: {str(e)}"




        if "Expired" in str(e):
            detail = "Token has expired"
        elif "Invalid audience" in str(e):
            detail = "Invalid token audience"
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )