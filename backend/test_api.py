"""Quick API test script."""

import requests
import json

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("🧪 RAG API Test")
print("=" * 60)

# Test 1: RAG Query
print("\n1️⃣ Testing RAG Query...")
query_data = {
    "query": "EdgeAI Talkの音声認識について教えて",
    "top_k": 2
}

response = requests.post(f"{BASE_URL}/api/rag/query", json=query_data)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    result = response.json()
    print(f"✅ Retrieved {result['retrieved_count']} contexts")
    for i, ctx in enumerate(result['context'], 1):
        print(f"\n  Context {i}:")
        print(f"  - Source: {ctx['metadata']['filename']}")
        print(f"  - Score: {ctx['score']}")
        print(f"  - Preview: {ctx['content'][:100]}...")
else:
    print(f"❌ Error: {response.text}")

# Test 2: Document Stats
print("\n2️⃣ Testing Document Stats...")
response = requests.get(f"{BASE_URL}/api/documents/count")
print(f"Status: {response.status_code}")
if response.status_code == 200:
    print(f"Result: {response.json()}")

print("\n" + "=" * 60)
print("✅ API Tests Complete")
print("=" * 60)
