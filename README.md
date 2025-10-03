# EdgeAI Talk

展示会デモ用の音声対話AIチャットアプリケーション。LM Studioで動作するローカルLLMと連携し、音声入力・テキストチャット・音声読み上げ機能を提供します。

## 特徴

- 🎤 **タップして話す**: ずんだもんをタップして音声入力、離すと自動送信
- 🍃 **ずんだもん読み上げ**: VOICEVOX連携で自然な日本語音声（自動フォールバック機能付き）
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
```bash
npm run dev
```

7. ブラウザで [http://localhost:3000](http://localhost:3000) を開く

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
│   │   ├── chat/route.ts           # LM Studio APIプロキシ
│   │   └── tts/voicevox/route.ts   # VOICEVOX APIプロキシ
│   ├── layout.tsx                   # ルートレイアウト
│   ├── page.tsx                     # メインチャット画面
│   └── globals.css                  # グローバルスタイル
├── public/                          # 静的アセット
├── docker-compose.yml               # VOICEVOXコンテナ設定
├── .env.local                       # 環境変数
├── TTS_SETUP.md                     # TTS設定ガイド
├── CLAUDE.md                        # Claude Code用ガイド
└── README.md
```

## 開発コマンド

- `npm run dev` - 開発サーバー起動
- `npm run build` - プロダクションビルド
- `npm run start` - プロダクションサーバー起動
- `npm run lint` - ESLint実行
- `docker-compose up -d voicevox` - VOICEVOX起動
- `docker-compose down` - VOICEVOX停止

## 主要機能の実装詳細

### 音声入力（タップ&ホールド）
- タップ開始: `onMouseDown` / `onTouchStart` でSpeech Recognition開始
- タップ終了: `onMouseUp` / `onTouchEnd` で録音停止＆自動送信
- ビジュアルフィードバック: ずんだもんが寝ている状態→聞いている状態に変化

### TTS自動フォールバック
1. VOICEVOX APIを試行（`/api/tts/voicevox`）
2. 失敗時は自動的にブラウザTTSにフォールバック
3. `actualTtsEngine` ステートで使用中のエンジンを追跡
4. VOICEVOXが利用可能な場合のみずんだもんアニメーション表示

### リピート機能
- 各アシスタントメッセージに🔄ボタンを表示
- クリックで `speakText()` 関数を呼び出し、同じ自動フォールバックロジックを使用

## 今後の展開

- [ ] PWA対応（オフラインキャッシュ）
- [ ] エラーハンドリング強化
- [ ] 会話履歴の永続化
- [ ] 複数キャラクター対応

## ライセンス

MIT
