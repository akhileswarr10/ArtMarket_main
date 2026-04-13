from jose import jwt
import os

secret = "n6hBUgoiXS+j7m2karW5ta9dBljcH2GtPKHZBZ/Qr05QAyUJD0yowaZmF92xeGy2fs5hs2FxIbhIPMlHFeEi1g=="
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGN6a3RiYWl1ZWF6bHB3dGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTQyMTQsImV4cCI6MjA5MTUzMDIxNH0.Vj13xr5rOEiLnJTx9vSjn-xHaq5fVAitoIV9pGTN_BE"

try:
    # Try as direct string
    payload = jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
    print("Success with direct string!")
    print(payload)
except Exception as e:
    print(f"Failed with direct string: {e}")

try:
    # Try as base64 decoded
    import base64
    decoded_secret = base64.b64decode(secret)
    payload = jwt.decode(token, decoded_secret, algorithms=["HS256"], options={"verify_aud": False})
    print("Success with base64 decoded secret!")
    print(payload)
except Exception as e:
    print(f"Failed with base64 decoded: {e}")
