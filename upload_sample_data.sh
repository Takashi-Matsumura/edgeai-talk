#!/bin/bash

# プロキシ設定を一時的に無効化
export http_proxy=""
export https_proxy=""
export HTTP_PROXY=""
export HTTPS_PROXY=""

# RAGバックエンドのヘルスチェック
echo "RAGバックエンドのヘルスチェック中..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "RAGバックエンドが正常に起動しました"
        break
    fi
    echo "待機中... ($((attempt+1))/$max_attempts)"
    sleep 2
    attempt=$((attempt+1))
done

if [ $attempt -eq $max_attempts ]; then
    echo "エラー: RAGバックエンドが起動しませんでした"
    exit 1
fi

# サンプルデータのアップロード
echo "サンプルデータをアップロード中..."

# company_info.md
echo "1. company_info.mdをアップロード..."
curl -X POST "http://localhost:8000/api/documents/upload" \
  -F "file=@backend/sample_data/company_info.md"

echo -e "\n"

# product_faq.md
echo "2. product_faq.mdをアップロード..."
curl -X POST "http://localhost:8000/api/documents/upload" \
  -F "file=@backend/sample_data/product_faq.md"

echo -e "\n"

# technical_specs.txt
echo "3. technical_specs.txtをアップロード..."
curl -X POST "http://localhost:8000/api/documents/upload" \
  -F "file=@backend/sample_data/technical_specs.txt"

echo -e "\n\n全ドキュメントのアップロード完了"

# アップロードされたドキュメントの確認
echo -e "\nアップロードされたドキュメントの一覧:"
curl -s http://localhost:8000/api/documents/list | jq .