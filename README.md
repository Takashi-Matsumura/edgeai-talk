# EdgeAI Talk

展示会デモ用の音声対話AIチャットアプリケーション。LM Studioで動作するローカルLLMと連携し、音声入力・テキストチャット・音声読み上げ機能を提供します。

## 特徴

- 🎤 **タップして話す**: ずんだもんをタップして音声入力、離すと自動送信
- 🍃 **ずんだもん読み上げ**: VOICEVOX連携で自然な日本語音声（自動フォールバック機能付き）
- 🎬 **動画アニメーション**: 状態に応じて3種類のずんだもんアニメーション表示（寝ている・聞いている・話している）
- 💬 **リアルタイムチャット**: ストリーミング応答でスムーズな会話体験
- 🔁 **リピート機能**: 各回答にリピートボタン表示で再読み上げ可能
- 📱 **iPad最適化**: iPad mini6縦型レイアウトに最適化
- 🎨 **マークダウン対応**: AIの応答を見やすく整形表示
- 🌙 **ダークモード対応**: システム設定に応じた表示切替

## 技術スタック

- **フレームワーク**: Next.js 15.5.4 (App Router)
- **UI**: React 19, Tailwind CSS v4, TypeScript
- **LLM**: LM Studio (OpenAI互換API)
- **音声入力**: Web Speech API
- **TTS**: VOICEVOX (Dockerコンテナ) + ブラウザTTS（フォールバック）

## 前提条件

- Node.js 20以上
- Docker（VOICEVOX使用時）
- LM Studio がインストールされ、ローカルで起動していること
  - デフォルトポート: `http://localhost:1234`

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

## 使い方

### 音声モード（推奨）
1. **トグルON**: 右上の緑色トグルをONにする
2. **タップして話す**: 左下の寝ているずんだもんをタップ＆ホールド
3. **離して送信**: タップを離すと自動的にメッセージ送信
4. **ずんだもん読み上げ**: 右下にずんだもんが登場して回答を読み上げ
5. **リピート**: 回答の右側にある🔄ボタンで再読み上げ

### テキストモード
1. **トグルOFF**: 右上のトグルをOFFにする
2. **テキスト入力**: 下部の入力欄にメッセージを入力
3. **マイク入力**: マイクボタンで音声入力も可能
4. **履歴クリア**: ゴミ箱ボタンで会話履歴を削除

## プロジェクト構成

```
edgeai-talk/
├── app/
│   ├── api/
│   │   ├── chat/route.ts                 # LM Studio APIプロキシ
│   │   └── tts/voicevox/route.ts         # VOICEVOX APIプロキシ
│   ├── components/
│   │   ├── ChatMessage.tsx               # チャットメッセージ表示コンポーネント
│   │   ├── ControlBar.tsx                # 入力コントロールバー
│   │   └── ZundamonCharacter.tsx         # ずんだもんキャラクター表示
│   ├── hooks/
│   │   ├── useAudioUnlock.ts             # ブラウザ音声再生アンロック
│   │   ├── useSpeechRecognition.ts       # 音声認識カスタムフック
│   │   └── useTTS.ts                     # TTS再生カスタムフック
│   ├── types.ts                          # TypeScript型定義
│   ├── layout.tsx                        # ルートレイアウト
│   ├── page.tsx                          # メインチャット画面
│   └── globals.css                       # グローバルスタイル
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
├── .env.local                            # 環境変数
├── TTS_SETUP.md                          # TTS設定ガイド
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

- ✅ タップ&ホールド音声入力（押している間だけ録音）
- ✅ 自動TTS再生（AI回答後、自動でVOICEVOX読み上げ）
- ✅ リアルタイム文字起こし（話している内容が即座に表示）
- ✅ HTTPS対応（iPad/モバイル端末でWeb Speech API利用可能）
- ✅ TTS自動フォールバック（VOICEVOX→ブラウザTTS）
- ✅ 3種類のずんだもん動画アニメーション（寝ている・聞いている・話している）
- ✅ コンポーネントベースアーキテクチャ（カスタムフック＋UIコンポーネント）
- ✅ 詳細なTTSデバッグログ出力
- ✅ PWA対応（ホーム画面への追加、オフラインキャッシュ）

## PWA機能

EdgeAI TalkはProgressive Web App (PWA)として動作します：

- **ホーム画面への追加**: iPadやスマートフォンでアプリのようにインストール可能
- **オフラインキャッシュ**: Service Workerによる基本リソースのキャッシュ
- **アプリアイコン**: 192x192と512x512のアイコンを用意
- **スタンドアロンモード**: ブラウザUIなしで全画面表示

## 今後の展開

- [ ] エラーハンドリング強化
- [ ] 会話履歴の永続化
- [ ] 複数キャラクター対応
- [ ] レスポンス速度の最適化
- [ ] PWAオフライン機能の強化

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
