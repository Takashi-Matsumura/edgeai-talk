#!/bin/bash

echo "=================================="
echo "🧪 RAG機能 手動動作確認スクリプト"
echo "=================================="
echo ""

# 色付き出力
GREEN='\033[0;32m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
NC='\033[0m' # No Color

# 1. ヘルスチェック
echo -e "${BLUE}1️⃣ ヘルスチェック${NC}"
curl -s http://localhost:8000/health | jq .
echo ""
echo ""

# 2. ドキュメント数確認
echo -e "${BLUE}2️⃣ ドキュメント数確認${NC}"
curl -s http://localhost:8000/api/documents/count | jq .
echo ""
echo ""

# 3. RAG統計情報
echo -e "${BLUE}3️⃣ RAG統計情報${NC}"
curl -s http://localhost:8000/api/rag/stats | jq .
echo ""
echo ""

# 4. RAGクエリテスト（音声認識について）
echo -e "${BLUE}4️⃣ RAGクエリテスト: 音声認識精度${NC}"
echo -e "${ORANGE}質問: EdgeAI Talkの音声認識の精度はどれくらいですか？${NC}"
curl -s -X POST http://localhost:8000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "EdgeAI Talkの音声認識の精度はどれくらいですか？",
    "top_k": 2
  }' | jq '.'
echo ""
echo ""

# 5. RAGクエリテスト（会社情報）
echo -e "${BLUE}5️⃣ RAGクエリテスト: 会社基本情報${NC}"
echo -e "${ORANGE}質問: EdgeAI株式会社の設立日と資本金を教えてください${NC}"
curl -s -X POST http://localhost:8000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "EdgeAI株式会社の設立日と資本金を教えてください",
    "top_k": 2
  }' | jq '.'
echo ""
echo ""

# 6. RAGクエリテスト（技術仕様）
echo -e "${BLUE}6️⃣ RAGクエリテスト: 技術仕様${NC}"
echo -e "${ORANGE}質問: RAGバックエンドの埋め込みモデルとベクトル次元を教えてください${NC}"
curl -s -X POST http://localhost:8000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "RAGバックエンドの埋め込みモデルとベクトル次元を教えてください",
    "top_k": 2
  }' | jq '.'
echo ""
echo ""

echo -e "${GREEN}=================================="
echo "✅ テスト完了"
echo "==================================${NC}"
echo ""
echo "📝 確認ポイント:"
echo "  - 各クエリで retrieved_count が 0 より大きいこと"
echo "  - context に関連する文章が含まれていること"
echo "  - score（類似度）が 0.5 以上であること"
echo ""
