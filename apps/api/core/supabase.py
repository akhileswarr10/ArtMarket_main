from supabase import create_client, Client
from core.config import get_settings

settings = get_settings()

# Admin client — uses SERVICE_ROLE_KEY, bypasses RLS
# Used ONLY for: Storage signed URLs, Admin Auth API calls
supabase_admin: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)