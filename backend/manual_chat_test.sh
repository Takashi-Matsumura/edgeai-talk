#!/bin/bash

echo "=============================================="
echo "🤖 RAG統合チャット 手動動作確認スクリプト"
echo "=============================================="
echo ""

# 色付き出力
GREEN='\033[0;32m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}テストケース: EdgeAI Talkの音声認識精度${NC}"
echo -e "${ORANGE}質問: EdgeAI Talkの音声認識の精度はどれくらいですか？${NC}"
echo ""

# LM Studioが起動しているか確認
echo -e "${BLUE}1️⃣ LM Studioの起動確認...${NC}"
if curl -s http://localhost:1234/v1/models > /dev/null 2>&1; then
    echo -e "${GREEN}✅ LM Studio is running${NC}"
    curl -s http://localhost:1234/v1/models | jq '.data[0].id' 2>/dev/null || echo "Model info not available"
else
    echo -e "${RED}❌ LM Studio is not running on port 1234${NC}"
    echo "Please start LM Studio with a model loaded."
    exit 1
fi
echo ""

# RAGバックエンドが起動しているか確認
echo -e "${BLUE}2️⃣ RAGバックエンドの起動確認...${NC}"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ RAG Backend is running${NC}"
    curl -s http://localhost:8000/api/documents/count | jq .
else
    echo -e "${RED}❌ RAG Backend is not running on port 8000${NC}"
    echo "Please start the FastAPI server."
    exit 1
fi
echo ""

# RAG統合チャットのテスト
echo -e "${BLUE}3️⃣ RAG統合チャットのテスト...${NC}"
echo ""
echo -e "${ORANGE}送信するメッセージ:${NC}"
echo "EdgeAI Talkの音声認識の精度はどれくらいですか？"
echo ""
echo -e "${GREEN}📥 レスポンス:${NC}"
echo "---"

curl -s -X POST http://localhost:8000/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "EdgeAI Talkの音声認識の精度はどれくらいですか？"
      }
    ],
    "use_rag": true,
    "model": "google/gemma-3n-e4b"
  }' | while IFS= read -r line; do
    # SSE形式のデータをパース
    if [[ $line == data:* ]]; then
        # "data: " プレフィックスを削除
        json_data="${line#data: }"
        # [DONE]は無視
        if [[ $json_data != "[DONE]" ]]; then
            # contentフィールドを抽出して表示（改行なし）
            echo "$json_data" | jq -r '.choices[0].delta.content // empty' | tr -d '\n'
        fi
    fi
done

echo ""
echo "---"
echo ""

echo -e "${BLUE}4️⃣ 比較: RAG無効時のレスポンス${NC}"
echo ""
echo -e "${ORANGE}送信するメッセージ（RAG無効）:${NC}"
echo "EdgeAI Talkの音声認識の精度はどれくらいですか？"
echo ""
echo -e "${GREEN}📥 レスポンス:${NC}"
echo "---"

curl -s -X POST http://localhost:8000/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "EdgeAI Talkの音声認識の精度はどれくらいですか？"
      }
    ],
    "use_rag": false,
    "model": "google/gemma-3n-e4b"
  }' | while IFS= read -r line; do
    if [[ $line == data:* ]]; then
        json_data="${line#data: }"
        if [[ $json_data != "[DONE]" ]]; then
            echo "$json_data" | jq -r '.choices[0].delta.content // empty' | tr -d '\n'
        fi
    fi
done

echo ""
echo "---"
echo ""

echo -e "${GREEN}=============================================="
echo "✅ テスト完了"
echo "==============================================${NC}"
echo ""
echo "📝 確認ポイント:"
echo "  ✅ RAG有効時: 「約95%」や「Web Speech API」などの"
echo "     具体的な情報が含まれているか"
echo "  ❌ RAG無効時: 一般的な回答や「不明」という内容か"
echo ""
