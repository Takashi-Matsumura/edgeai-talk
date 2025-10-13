# EdgeAI Talk

展示会デモ用の音声対話AIチャットアプリケーション。LM Studioで動作するローカルLLMと連携し、音声入力・テキストチャット・音声読み上げ機能を提供します。

## 特徴

- 🎤 **タップして話す**: ずんだもんをタップして音声入力、離すと自動送信
- 🍃 **ずんだもん読み上げ**: VOICEVOX連携で自然な日本語音声（自動フォールバック機能付き）
- 🎬 **動画アニメーション**: 状態に応じて3種類のずんだもんアニメーション表示（寝ている・聞いている・話している）
- 💬 **リアルタイムチャット**: ストリーミング応答でスムーズな会話体験
- 🔁 **リピート機能**: 各回答にリピートボタン表示で再読み上げ可能
- 📱 **iPad最適化**: iPad mini6縦型レイアウトに最適化
- 🎨 **展示会向けUI**: オレンジをベースとしたコーポレートカラー統一デザイン
- 💡 **直感的なサジェスチョン**: 初期画面に使用例ボタンを配置
- ♿ **アクセシビリティ**: 大きなフォント、高コントラスト、タブレット最適化ボタンサイズ
- 🌐 **エッジAI訴求**: ローカル処理・プライバシー保護を強調するメッセージ
- 📲 **PWA対応**: ホーム画面に追加してアプリのように使用可能
- 🗑️ **音声モードでのクリア機能**: ヘッダーにゴミ箱ボタン表示
- 🔍 **RAG対応（NEW）**: ChromaDBとSentence Transformersによる文書ベース回答生成

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 15.5.4 (App Router)
- **UI**: React 19, Tailwind CSS v4, TypeScript
- **音声入力**: Web Speech API
- **TTS**: VOICEVOX (Dockerコンテナ) + ブラウザTTS（フォールバック）

### バックエンド
- **LLM**: LM Studio (OpenAI互換API)
- **RAG（オプション）**: FastAPI + ChromaDB + Sentence Transformers
  - ベクトルDB: ChromaDB（ローカル永続化）
  - 埋め込みモデル: intfloat/multilingual-e5-base
  - 文書処理: PDF, Markdown, テキスト対応

## 前提条件

### 基本要件
- Node.js 20以上
- LM Studio がインストールされ、ローカルで起動していること
  - デフォルトポート: `http://localhost:1234`

### オプション要件
- Docker（VOICEVOX使用時）
- Python 3.11以上（RAG機能使用時）

## セットアップ

1. リポジトリをクローン:
```bash
git clone https://github.com/Takashi-Matsumura/edgeai-talk.git
cd edgeai-talk
```

2. 依存関係をインストール:
```bash
npm install
```

3. 環境変数を設定（`.env.local`は既に含まれています）:
```env
OPENAI_BASE_URL=http://localhost:1234/v1
OPENAI_MODEL=google/gemma-3n-e4b
SYSTEM_PROMPT=あなたは展示会デモ用のアシスタントです。日本語のみで簡潔に回答してください。ローマ字や英語訳は不要です。
VOICEVOX_BASE_URL=http://localhost:50021
VOICEVOX_SPEAKER_ID=3
```

4. LM Studioでモデルをロード:
   - LM Studioを起動
   - 使用するモデル（例: `google/gemma-3n-e4b`）をロード
   - サーバーを起動（ポート1234）

5. VOICEVOX起動（推奨）:
```bash
docker-compose up -d voicevox
```

詳細は [TTS_SETUP.md](./TTS_SETUP.md) を参照してください。

6. 開発サーバーを起動:

**HTTPSサーバー起動（推奨 - モバイル・タブレットからアクセス時）:**
```bash
npm run dev:https
```
ブラウザで [https://localhost:3000](https://localhost:3000) または `https://<IPアドレス>:3000` を開く

**通常のHTTPサーバー起動:**
```bash
npm run dev
```
ブラウザで [http://localhost:3000](http://localhost:3000) を開く

**重要:** iPad/iPhone/Android端末からアクセスする場合、Web Speech API（音声認識）を使用するためHTTPSが必須です。

## RAG機能のセットアップ（オプション）

RAG（Retrieval-Augmented Generation）機能を使用すると、特定のドキュメント情報を基にLLMが回答できるようになります。

### クイックスタート

```bash
# 1. バックエンドディレクトリに移動
cd backend

# 2. Python仮想環境を作成
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 依存関係をインストール
pip install -r requirements.txt

# 4. サーバー起動
python main.py

# 5. サンプルデータをアップロード（別ターミナル）
python test_rag.py
```

### UIでのRAG機能の使い方

1. **RAGトグルスイッチ**: ヘッダー右上の青いトグルでRAG機能のON/OFF切り替え
2. **ドキュメント管理**: RAGトグルの横の📄ボタンをクリックしてモーダルを開く
   - ファイルアップロード（.txt, .md, .pdf対応）
   - ドキュメント一覧表示
   - ドキュメント削除
   - RAG統計情報の表示
3. **チャット**: RAG ONの状態で質問すると、アップロードしたドキュメントの内容を基に回答

### テストプロンプト例

RAG機能をテストするには、以下のプロンプトを試してください：

```
EdgeAI株式会社の設立日を教えて
→ 期待される回答: 2020年4月1日

音声認識の精度は何パーセントですか？
→ 期待される回答: 約95%

RAGで使っているベクトルは何次元ですか？
→ 期待される回答: 768次元
```

詳細なテストプロンプト集は `QUICK_TEST_PROMPTS.md` を参照してください。

詳細なセットアップ手順は **[RAG_SETUP.md](./backend/RAG_SETUP.md)** を参照してください。

### RAG機能の確認

- **フロントエンド**: http://localhost:3000（RAGトグルと📄ボタンで操作）
- **APIドキュメント**: http://localhost:8000/docs
- **ヘルスチェック**: http://localhost:8000/health
- **RAG統計**: http://localhost:8000/api/rag/stats

## 使い方

### 初期画面（サジェスチョン機能）
1. **価値提案バッジ**: 「100% ローカル処理 | プライバシー保護」を大きく表示
2. **ヒーローメッセージ**: 「インターネット不要！この端末だけでAIと会話」
3. **サジェスチョンボタン**: 4つの使用例ボタンをタップで即座に質問可能
   - 🌤️ 今日の天気を教えて
   - 🍳 おすすめのレシピは？
   - 💡 AIについて教えて
   - 🎯 何ができるの？
4. **CTAメッセージ**: 「タップして試してみよう」で行動を促す

### 音声モード（推奨）
1. **トグルON**: 右上のオレンジ色トグルをONにする
2. **タップして話す**: 左下の寝ているずんだもんをタップ＆ホールド
3. **離して送信**: タップを離すと自動的にメッセージ送信
4. **ずんだもん読み上げ**: 右下にずんだもんが登場して回答を読み上げ
5. **リピート**: 回答の右側にあるオレンジ色ボタンで再読み上げ

### テキストモード
1. **トグルOFF**: 右上のトグルをOFFにする
2. **テキスト入力**: 下部の入力欄にメッセージを入力
3. **マイク入力**: マイクボタンで音声入力も可能
4. **送信**: オレンジ色の送信ボタンでメッセージ送信
5. **履歴クリア**: ゴミ箱ボタンで会話履歴を削除

## プロジェクト構成

```
edgeai-talk/
├── app/                                  # Next.jsフロントエンド
│   ├── api/
│   │   ├── chat/route.ts                 # LM Studio APIプロキシ
│   │   └── tts/voicevox/route.ts         # VOICEVOX APIプロキシ
│   ├── components/
│   │   ├── ChatMessage.tsx               # チャットメッセージ表示コンポーネント
│   │   ├── ControlBar.tsx                # 入力コントロールバー
│   │   ├── DocumentManager.tsx           # ドキュメント管理UIモーダル（NEW）
│   │   └── ZundamonCharacter.tsx         # ずんだもんキャラクター表示
│   ├── hooks/
│   │   ├── useAudioUnlock.ts             # ブラウザ音声再生アンロック
│   │   ├── useSpeechRecognition.ts       # 音声認識カスタムフック
│   │   └── useTTS.ts                     # TTS再生カスタムフック
│   ├── types.ts                          # TypeScript型定義
│   ├── layout.tsx                        # ルートレイアウト
│   ├── page.tsx                          # メインチャット画面
│   └── globals.css                       # グローバルスタイル
├── backend/                              # RAGバックエンド（NEW）
│   ├── main.py                           # FastAPIアプリケーション
│   ├── config.py                         # 設定管理
│   ├── models.py                         # Pydanticモデル
│   ├── vectordb.py                       # ChromaDB操作
│   ├── embeddings.py                     # ベクトル化
│   ├── llm.py                            # LM Studio連携
│   ├── text_processing.py                # テキスト処理
│   ├── routes/                           # APIルート
│   │   ├── documents.py                  # ドキュメント管理API
│   │   ├── rag.py                        # RAG検索API
│   │   └── chat.py                       # RAG対応チャットAPI
│   ├── sample_data/                      # サンプルドキュメント
│   │   ├── company_info.md
│   │   ├── product_faq.md
│   │   └── technical_specs.txt
│   ├── test_rag.py                       # テストスクリプト
│   ├── requirements.txt                  # Python依存関係
│   └── README.md                         # バックエンドREADME
├── chroma_data/                          # ChromaDB永続化（自動生成）
├── certs/                                # SSL証明書（自己署名）
│   ├── cert.pem                          # 公開鍵証明書
│   └── key.pem                           # 秘密鍵
├── public/
│   └── movie/                            # 動画アセット（著作権保護のためGit管理外）
│       ├── sleep_web.mp4                 # 寝ている状態
│       ├── wakeup_web.mp4                # 聞いている状態
│       └── zundam_web.mp4                # 話している状態
├── server.js                             # HTTPSサーバー起動スクリプト
├── Dockerfile                            # Next.jsコンテナ設定
├── docker-compose.yml                    # アプリ全体のコンテナ構成
├── .dockerignore                         # Dockerビルド除外設定
├── .gitignore                            # Git除外設定（public/movie/含む）
├── .env.local                            # Next.js環境変数
├── TTS_SETUP.md                          # TTS設定ガイド
├── RAG_SETUP.md                          # RAG設定ガイド（NEW）
├── CLAUDE.md                             # Claude Code用ガイド
└── README.md
```

## 開発コマンド

### 開発環境
- `npm run dev` - HTTP開発サーバー起動（localhost専用）
- `npm run dev:https` - HTTPS開発サーバー起動（モバイル/タブレット対応）
- `npm run build` - プロダクションビルド
- `npm run start` - プロダクションサーバー起動
- `npm run lint` - ESLint実行

### Docker環境（展示会本番用）
- `docker-compose up --build -d` - 全コンテナをビルド＆起動（HTTPS対応）
- `docker-compose up -d` - 全コンテナを起動（ビルド済み）
- `docker-compose down` - 全コンテナを停止＆削除
- `docker-compose logs -f app` - Next.jsアプリのログ表示
- `docker-compose logs -f voicevox` - VOICEVOXのログ表示

**注:** Dockerコンテナ環境ではHTTPS対応のため、初回アクセス時にブラウザで自己署名証明書の警告を承認する必要があります。

## 主要機能の実装詳細

### コンポーネント構成
プロジェクトはReactのカスタムフックとコンポーネントに分割され、保守性と再利用性を高めています：

**カスタムフック:**
- `useSpeechRecognition` - Web Speech APIを使用した音声認識
- `useTTS` - VOICEVOX/ブラウザTTSの統合管理と自動フォールバック
- `useAudioUnlock` - モバイルブラウザの音声再生ポリシー対応

**UIコンポーネント:**
- `ZundamonCharacter` - キャラクター表示と動画アニメーション
- `ChatMessage` - メッセージ表示とリピート機能
- `ControlBar` - テキストモード用の入力UI

### 音声入力（タップ&ホールド）
- タップ開始: `onMouseDown` / `onTouchStart` でSpeech Recognition開始
- タップ終了: `onMouseUp` / `onTouchEnd` で録音停止＆自動送信
- タッチキャンセル対応: `onTouchCancel` で意図しない中断を処理
- ビジュアルフィードバック: ずんだもんが寝ている状態→聞いている状態に変化（動画切り替え）
- iPad/モバイル対応: `preventDefault()` + `touch-none` でブラウザの干渉を防止

### TTS自動フォールバック
1. VOICEVOX APIを試行（`/api/tts/voicevox`）
2. 失敗時は自動的にブラウザTTSにフォールバック
3. `actualEngine` ステートで使用中のエンジンを追跡
4. VOICEVOXが利用可能な場合のみずんだもんアニメーション表示
5. 詳細なログ出力（`[TTS]`プレフィックス）でデバッグをサポート

### ずんだもん動画アニメーション
3種類の状態に応じた動画を自動切り替え：
- **sleep_web.mp4**: 待機状態（音声モードON時の左下）
- **wakeup_web.mp4**: 録音中（タップ&ホールド時）
- **zundam_web.mp4**: 読み上げ中（VOICEVOX使用時の右下）

動画フォーマット: H.264 Baseline profile（Safari/iOS互換）、ループ再生、ミュート

### リピート機能
- 各アシスタントメッセージに🔄ボタンを表示
- クリックで `speak()` 関数を呼び出し、同じ自動フォールバックロジックを使用

## 展示会デプロイ手順

1. **LM Studioを起動** (MacStudio上で実行)
   ```bash
   # モデルをロードしてサーバーを起動（ポート1234）
   ```

2. **SSL証明書を生成**（初回のみ）
   ```bash
   mkdir -p certs
   openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:<MacStudioのIP>"
   ```

3. **Dockerコンテナを起動**
   ```bash
   docker-compose up --build -d
   ```

4. **動作確認**
   - アプリ: https://localhost:3000
   - VOICEVOX: http://localhost:50021/version

5. **iPad mini6/Android端末でアクセス**
   - MacStudioのIPアドレスを確認: `ifconfig | grep "inet "`
   - デバイスのブラウザで `https://<MacStudioのIP>:3000` にアクセス
   - 初回アクセス時、証明書の警告を承認（「詳細設定」→「アクセスする」）
   - マイク許可を承認

**重要:** HTTPSを使用しないと、iOS/iPadOS/Android端末でWeb Speech API（音声認識）が動作しません。

## 実装済み機能

### 基本機能
- ✅ タップ&ホールド音声入力（押している間だけ録音）
- ✅ 自動TTS再生（AI回答後、自動でVOICEVOX読み上げ）
- ✅ リアルタイム文字起こし（話している内容が即座に表示）
- ✅ HTTPS対応（iPad/モバイル端末でWeb Speech API利用可能）
- ✅ TTS自動フォールバック（VOICEVOX→ブラウザTTS）
- ✅ 3種類のずんだもん動画アニメーション（寝ている・聞いている・話している）
- ✅ コンポーネントベースアーキテクチャ（カスタムフック＋UIコンポーネント）
- ✅ PWA対応（ホーム画面への追加、オフラインキャッシュ）

### RAG機能（NEW - 2025-10-13完成）
- ✅ FastAPI + ChromaDBバックエンド
- ✅ Sentence Transformersベクトル化（multilingual-e5-base, 768次元）
- ✅ ドキュメント管理API（アップロード、一覧、削除）
- ✅ RAG検索エンドポイント（類似度検索、閾値0.5）
- ✅ LM Studio連携RAGチャットAPI（ストリーミング対応）
- ✅ サンプルデータとテストスクリプト
- ✅ Next.jsフロントエンド完全統合
  - ✅ RAGトグルスイッチ（ON/OFF切り替え）
  - ✅ ドキュメント管理UI（モーダルウィンドウ）
  - ✅ RAG統計表示（ドキュメント数、チャンク数、ベクトル次元）
  - ✅ シームレスなRAG/非RAGチャット切り替え

### 展示会向けUI/UX強化
- ✅ オレンジ系コーポレートカラーで全体統一
- ✅ パステル調の薄いオレンジグラデーション背景
- ✅ 初期画面サジェスチョン機能（4つの使用例ボタン）
- ✅ ヒーローメッセージとCTAの追加
- ✅ 「100% ローカル処理」バッジの強調表示
- ✅ 大きなフォントサイズ（見出し5xl-6xl、本文lg-2xl）
- ✅ 高コントラスト配色（白背景メッセージ、濃い文字）
- ✅ タブレット最適化ボタンサイズ（64px × 64px）
- ✅ ガラスモーフィズムUIデザイン
- ✅ スムーズなアニメーションとトランジション
- ✅ 上端揃えレイアウト（ずんだもんとの重なり防止）

## PWA機能

EdgeAI TalkはProgressive Web App (PWA)として動作します：

- **ホーム画面への追加**: iPadやスマートフォンでアプリのようにインストール可能
- **オフラインキャッシュ**: Service Workerによる基本リソースのキャッシュ
- **アプリアイコン**: 192x192と512x512のアイコンを用意
- **スタンドアロンモード**: ブラウザUIなしで全画面表示

## 今後の展開

### フェーズ5: テストと最適化
- [ ] ユニットテストの追加
- [ ] E2Eテストの実装
- [ ] パフォーマンス最適化
- [ ] エラーハンドリング強化

### フェーズ6: Dockerデプロイ
- [ ] RAGバックエンドのDocker化
- [ ] docker-compose全体統合
- [ ] 本番環境向け最適化

### その他の改善予定
- [ ] エラーハンドリング強化
- [ ] 会話履歴の永続化
- [ ] 複数キャラクター対応
- [ ] レスポンス速度の最適化
- [ ] PWAオフライン機能の強化
- [ ] RAG機能のDocker化

## 動画アセットについて

`public/movie/` 配下の動画ファイルは著作権保護のため、Gitリポジトリには含まれていません。

以下の3つの動画ファイルが必要です：
- `sleep_web.mp4` - 待機状態のアニメーション
- `wakeup_web.mp4` - 録音中のアニメーション
- `zundam_web.mp4` - 読み上げ中のアニメーション

動画仕様:
- コーデック: H.264 Baseline profile
- ピクセルフォーマット: yuv420p
- 音声: なし（ミュート）
- 最適化: faststart（ストリーミング再生対応）

動画が存在しない場合、絵文字フォールバック（😴👂🍃）が自動的に表示されます。

## ライセンス

MIT
