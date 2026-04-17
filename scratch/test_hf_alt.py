import httpx
import os
from dotenv import load_dotenv

load_dotenv('apps/api/.env', override=True)
token = os.getenv('HF_TOKEN')
print(f"Using token: {token[:10]}...")

# This model is usually available on the free Inference API
API_URL = "https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning"
headers = {"Authorization": f"Bearer {token}"}

# Tiny dummy image
image_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xff\xff?\x00\x05\xfe\x02\xfe\x0dcG\x04\x00\x00\x00\x00IEND\xaeB`\x82'

try:
    with httpx.Client(timeout=30.0) as client:
        response = client.post(API_URL, headers=headers, content=image_bytes)
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text}")
        else:
            print(f"Result: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
