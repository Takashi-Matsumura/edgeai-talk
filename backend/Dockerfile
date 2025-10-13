# RAG Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# システムパッケージのインストール
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 依存関係のインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションファイルのコピー
COPY . .

# ChromaDB用のディレクトリを作成
RUN mkdir -p /app/chroma_data

# 環境変数の設定
ENV PYTHONUNBUFFERED=1
ENV BACKEND_HOST=0.0.0.0
ENV BACKEND_PORT=8000
ENV CHROMA_PERSIST_DIR=/app/chroma_data

# ポートの公開
EXPOSE 8000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# uvicornでアプリケーションを起動
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
