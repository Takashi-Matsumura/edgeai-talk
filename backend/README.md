# RAG Backend for EdgeAI Talk

RAG（Retrieval-Augmented Generation）機能を提供するFastAPIバックエンド。

## 機能

- 📄 ドキュメント管理（アップロード、一覧、削除）
- 🔍 ベクトル検索（ChromaDB）
- 🤖 LM Studio連携
- 💬 RAG対応チャットAPI

## セットアップ

### 1. Python環境構築

```bash
cd backend

# 仮想環境作成（推奨）
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt
```

### 2. 環境変数設定

`.env`ファイルを編集（既に作成済み）：

```env
# Backend Configuration
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0

# LM Studio Configuration
LM_STUDIO_BASE_URL=http://localhost:1234/v1
LM_STUDIO_MODEL=google/gemma-3n-e4b

# ChromaDB Configuration
CHROMA_PERSIST_DIR=../chroma_data
CHROMA_COLLECTION_NAME=edgeai_documents

# Embeddings Configuration
EMBEDDING_MODEL=intfloat/multilingual-e5-base
EMBEDDING_DEVICE=cpu

# RAG Configuration
RAG_TOP_K=3
RAG_SIMILARITY_THRESHOLD=0.5
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

### 3. サーバー起動

```bash
# 開発モード（自動リロード有効）
python main.py

# または
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

サーバーが起動したら以下にアクセス：
- **API**: http://localhost:8000
- **ドキュメント**: http://localhost:8000/docs（Swagger UI）
- **ヘルスチェック**: http://localhost:8000/health

## API エンドポイント

### ドキュメント管理

#### ドキュメントアップロード
```bash
POST /api/documents/upload
Content-Type: multipart/form-data

# 例
curl -X POST "http://localhost:8000/api/documents/upload" \
  -F "file=@sample_data/company_info.md"
```

#### ドキュメント一覧
```bash
GET /api/documents/list

# 例
curl "http://localhost:8000/api/documents/list"
```

#### ドキュメント削除
```bash
DELETE /api/documents/{filename}

# 例
curl -X DELETE "http://localhost:8000/api/documents/company_info.md"
```

#### ドキュメント数取得
```bash
GET /api/documents/count
```

#### コレクションリセット
```bash
POST /api/documents/reset
```

### RAG検索

#### クエリ実行
```bash
POST /api/rag/query
Content-Type: application/json

{
  "query": "EdgeAI株式会社について教えてください",
  "top_k": 3,
  "threshold": 0.5
}

# 例
curl -X POST "http://localhost:8000/api/rag/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "EdgeAI株式会社について", "top_k": 3}'
```

#### RAG統計情報
```bash
GET /api/rag/stats
```

### チャット

#### RAG対応チャット
```bash
POST /api/chat/completions
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "EdgeAI Talkの主な機能は？"}
  ],
  "use_rag": true,
  "top_k": 3,
  "stream": true
}

# 例（ストリーミング）
curl -X POST "http://localhost:8000/api/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "EdgeAI Talkについて教えて"}],
    "use_rag": true,
    "stream": true
  }'
```

## テスト

### サンプルデータのアップロードとテスト

```bash
python test_rag.py
```

このスクリプトは以下を実行します：
1. サンプルドキュメントをChromaDBにアップロード
2. ドキュメント一覧を表示
3. RAGクエリのテスト

## ディレクトリ構造

```
backend/
├── main.py                 # FastAPIアプリケーション
├── config.py              # 設定管理
├── models.py              # Pydanticモデル
├── vectordb.py            # ChromaDB操作
├── embeddings.py          # ベクトル化
├── llm.py                 # LM Studio連携
├── text_processing.py     # テキスト処理
├── routes/
│   ├── __init__.py
│   ├── documents.py       # ドキュメント管理API
│   ├── rag.py            # RAG検索API
│   └── chat.py           # チャットAPI
├── sample_data/           # サンプルドキュメント
│   ├── company_info.md
│   ├── product_faq.md
│   └── technical_specs.txt
├── test_rag.py           # テストスクリプト
├── requirements.txt      # Python依存関係
├── .env                  # 環境変数
└── README.md            # このファイル
```

## トラブルシューティング

### Embeddingモデルのダウンロードエラー

初回起動時、Sentence Transformersモデル（約500MB）がダウンロードされます。

```bash
# ダウンロード状況確認
ls ~/.cache/torch/sentence_transformers/
```

### ChromaDBの初期化エラー

```bash
# データディレクトリを削除して再起動
rm -rf ../chroma_data
python main.py
```

### LM Studioに接続できない

1. LM Studioが起動しているか確認
2. ポート1234でサーバーが起動しているか確認
3. `.env`の`LM_STUDIO_BASE_URL`を確認

```bash
# LM Studio APIテスト
curl http://localhost:1234/v1/models
```

## パフォーマンス最適化

### GPU利用（推奨）

`.env`でGPUを有効化：

```env
EMBEDDING_DEVICE=cuda  # または mps (macOS)
```

### チャンクサイズ調整

大きなドキュメントの場合：

```env
CHUNK_SIZE=1500
CHUNK_OVERLAP=300
```

### 検索結果数の調整

より多くのコンテキストを取得：

```env
RAG_TOP_K=5
RAG_SIMILARITY_THRESHOLD=0.4
```

## ライセンス

MIT License
