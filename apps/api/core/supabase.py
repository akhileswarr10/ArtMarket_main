from supabase import create_client, Client
from core.config import get_settings

# Use the real Supabase client to handle storage and auth admin tasks
settings = get_settings()

supabase_admin: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)