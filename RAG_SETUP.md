# RAG機能セットアップガイド

EdgeAI TalkにRAG（Retrieval-Augmented Generation）機能を追加して、特定のドキュメント情報を基に回答できるようにします。

## 📋 概要

### RAGとは？

RAG（Retrieval-Augmented Generation）は、LLMに外部知識を与える技術です。

**通常のLLM**
```
ユーザー質問 → LLM → 回答
```

**RAG対応LLM**
```
ユーザー質問 → ベクトル検索 → 関連ドキュメント取得
              ↓
         質問 + コンテキスト → LLM → 回答
```

### このシステムの構成

```
┌─────────────────┐
│  Next.js        │  既存のフロントエンド
│  (localhost:3000)│
└────────┬────────┘
         │
         ├─→ LM Studio (localhost:1234)  ← 既存
         │
         └─→ FastAPI Backend (localhost:8000)  ← 新規
              ├── ChromaDB（ベクトルDB）
              ├── Sentence Transformers（ベクトル化）
              └── RAG検索エンジン
```

## 🚀 セットアップ手順

### ステップ1: Python環境構築

```bash
# プロジェクトルートから
cd backend

# 仮想環境作成（推奨）
python3 -m venv venv

# 仮想環境を有効化
source venv/bin/activate  # macOS/Linux
# Windows: venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt
```

**初回インストール時の注意:**
- Sentence Transformersモデル（約500MB）が自動ダウンロードされます
- インターネット接続が必要です（初回のみ）
- 完了まで5-10分かかる場合があります

### ステップ2: 環境変数確認

`backend/.env`ファイルを確認：

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
EMBEDDING_DEVICE=cpu  # GPU使用時: cuda または mps

# RAG Configuration
RAG_TOP_K=3
RAG_SIMILARITY_THRESHOLD=0.5
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://localhost:3000
```

### ステップ3: FastAPIサーバー起動

```bash
# backend/ ディレクトリで実行
python main.py
```

**起動確認:**
- コンソールに以下のようなログが表示されればOK:
  ```
  🚀 Starting RAG backend server...
  📊 ChromaDB persist dir: ../chroma_data
  🤖 Embedding model: intfloat/multilingual-e5-base
  ✅ VectorDB initialized with 0 documents
  ✅ Embedding model ready (dim: 768)
  ```

- ブラウザで以下にアクセス:
  - http://localhost:8000 （ルート）
  - http://localhost:8000/docs （API ドキュメント）
  - http://localhost:8000/health （ヘルスチェック）

### ステップ4: サンプルデータをアップロード

```bash
# backend/ ディレクトリで実行
python test_rag.py
```

このスクリプトは以下を実行します：
1. `sample_data/` 配下のドキュメントをChromaDBに登録
2. ドキュメント一覧を表示
3. サンプルクエリでRAG検索をテスト

**成功時の出力例:**
```
🧪 Testing Document Upload
==========================================
📄 Processing: company_info.md
  📊 Text length: 1234 characters
  📦 Created 2 chunks
  🔢 Generating embeddings...
  ✅ Uploaded successfully

✅ Total documents in database: 8
```

### ステップ5: 動作確認

#### 5-1. ドキュメント一覧確認

```bash
curl http://localhost:8000/api/documents/list
```

#### 5-2. RAG検索テスト

```bash
curl -X POST "http://localhost:8000/api/rag/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "EdgeAI株式会社について教えてください",
    "top_k": 3
  }'
```

**成功時のレスポンス例:**
```json
{
  "context": [
    {
      "content": "# EdgeAI株式会社について...",
      "metadata": {
        "filename": "company_info.md",
        "chunk_index": 0
      },
      "score": 0.8523
    }
  ],
  "query": "EdgeAI株式会社について教えてください",
  "retrieved_count": 1
}
```

#### 5-3. RAG対応チャットテスト

```bash
curl -X POST "http://localhost:8000/api/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "EdgeAI Talkの主な機能は何ですか？"}
    ],
    "use_rag": true,
    "stream": false
  }'
```

## 📱 Next.jsフロントエンドとの統合（今後の実装）

### フェーズ4で実装予定:

1. **RAGクライアント作成**
   - `app/lib/ragClient.ts`
   - FastAPI APIラッパー関数

2. **ドキュメント管理UI**
   - `app/documents/page.tsx`
   - ファイルアップロード
   - ドキュメント一覧・削除

3. **チャットUI拡張**
   - RAG有効/無効トグル
   - コンテキスト情報の表示
   - 引用元表示

## 📚 ドキュメント管理

### ドキュメントのアップロード

#### APIを使用

```bash
curl -X POST "http://localhost:8000/api/documents/upload" \
  -F "file=@/path/to/document.md"
```

#### Swagger UIを使用

1. http://localhost:8000/docs にアクセス
2. `POST /api/documents/upload` をクリック
3. "Try it out" をクリック
4. ファイルを選択してアップロード

### サポートするファイル形式

- **テキスト**: `.txt`, `.md`, `.markdown`
- **JSON**: `.json`
- **PDF**: `.pdf`（テキスト抽出可能なもの）

### ドキュメントの削除

```bash
curl -X DELETE "http://localhost:8000/api/documents/company_info.md"
```

### コレクションのリセット

```bash
curl -X POST "http://localhost:8000/api/documents/reset"
```

## ⚙️ 設定のカスタマイズ

### チャンクサイズの調整

大きなドキュメントを扱う場合：

```env
CHUNK_SIZE=1500        # デフォルト: 1000
CHUNK_OVERLAP=300      # デフォルト: 200
```

### 検索パラメータの調整

より多くのコンテキストを取得：

```env
RAG_TOP_K=5                      # デフォルト: 3
RAG_SIMILARITY_THRESHOLD=0.4     # デフォルト: 0.5（低いほど緩い）
```

### GPU利用（推奨）

M1/M2 Macの場合：

```env
EMBEDDING_DEVICE=mps
```

NVIDIA GPUの場合：

```env
EMBEDDING_DEVICE=cuda
```

## 🐛 トラブルシューティング

### 1. Embeddingモデルのダウンロードエラー

**症状:**
```
Failed to download model...
```

**解決方法:**
```bash
# キャッシュを削除して再試行
rm -rf ~/.cache/torch/sentence_transformers/
python main.py
```

### 2. ChromaDBの初期化エラー

**症状:**
```
Failed to initialize ChromaDB...
```

**解決方法:**
```bash
# データディレクトリを削除
rm -rf chroma_data/
python main.py
```

### 3. LM Studioに接続できない

**症状:**
```
LM Studio API HTTP error...
```

**確認事項:**
1. LM Studioが起動しているか
2. サーバーがポート1234で起動しているか
3. モデルがロードされているか

**テスト:**
```bash
curl http://localhost:1234/v1/models
```

### 4. メモリ不足エラー

**症状:**
```
Out of memory...
```

**解決方法:**
```env
# より小さいチャンクサイズに設定
CHUNK_SIZE=500
CHUNK_OVERLAP=100

# バッチサイズを調整（embeddings.pyで変更）
```

### 5. RAG検索結果が返らない

**原因:**
- 類似度閾値が高すぎる
- ドキュメントが登録されていない

**解決方法:**
```env
# 閾値を下げる
RAG_SIMILARITY_THRESHOLD=0.3
```

```bash
# ドキュメント数を確認
curl http://localhost:8000/api/documents/count
```

## 📊 パフォーマンス最適化

### 推奨スペック

**最小構成:**
- CPU: 4コア以上
- メモリ: 8GB
- ストレージ: 5GB

**推奨構成:**
- CPU: 8コア以上（Apple M1以降推奨）
- メモリ: 16GB
- GPU: MPS（M1/M2）またはCUDA対応GPU
- ストレージ: 10GB（SSD推奨）

### ベンチマーク（参考値）

**M1 Max（CPU mode）:**
- ドキュメントアップロード: 約2秒/ファイル
- 埋め込み生成: 約10文書/秒
- RAG検索: 約100ms
- チャット応答（初回トークン）: 約500ms

**M1 Max（MPS mode）:**
- 埋め込み生成: 約30文書/秒（3倍高速）
- その他の指標は同様

## 🔄 アップデートとメンテナンス

### 依存関係の更新

```bash
pip install --upgrade -r requirements.txt
```

### モデルの更新

異なる埋め込みモデルを試す場合：

```env
# 例: より小さいモデル
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2

# 例: より高精度なモデル
EMBEDDING_MODEL=intfloat/multilingual-e5-large
```

### データのバックアップ

```bash
# ChromaDBデータをバックアップ
tar -czf chroma_backup_$(date +%Y%m%d).tar.gz chroma_data/
```

### データの復元

```bash
# バックアップから復元
tar -xzf chroma_backup_20250113.tar.gz
```

## 📖 参考資料

- [ChromaDB公式ドキュメント](https://docs.trychroma.com/)
- [Sentence Transformers](https://www.sbert.net/)
- [FastAPI公式ドキュメント](https://fastapi.tiangolo.com/)
- [LM Studio](https://lmstudio.ai/)

## 🎯 次のステップ

1. ✅ バックエンドのセットアップ完了
2. ⏳ フロントエンドとの統合（フェーズ4）
3. ⏳ Docker化（フェーズ6）
4. ⏳ 本番環境デプロイ

---

質問や問題がある場合は、GitHubのIssuesまでお願いします。
