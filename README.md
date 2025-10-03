# EdgeAI Talk

展示会デモ用の音声対話AIチャットアプリケーション。LM Studioで動作するローカルLLMと連携し、音声入力・テキストチャット・音声読み上げ機能を提供します。

## 特徴

- 🎤 **音声入力**: Web Speech APIを使用した日本語音声認識
- 💬 **リアルタイムチャット**: ストリーミング応答でスムーズな会話体験
- 🔊 **音声読み上げ**: トグル式のTTS機能（ON/OFF切替可能）
- 📱 **レスポンシブデザイン**: iPad mini6を想定した縦型レイアウト
- 🎨 **マークダウン対応**: AIの応答を見やすく整形表示
- 🌙 **ダークモード対応**: システム設定に応じた表示切替

## 技術スタック

- **フレームワーク**: Next.js 15.5.4 (App Router)
- **UI**: React 19, Tailwind CSS v4, TypeScript
- **LLM**: LM Studio (OpenAI互換API)
- **音声**: Web Speech API, SpeechSynthesis API

## 前提条件

- Node.js 20以上
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
```

4. LM Studioでモデルをロード:
   - LM Studioを起動
   - 使用するモデル（例: `google/gemma-3n-e4b`）をロード
   - サーバーを起動（ポート1234）

5. 開発サーバーを起動:
```bash
npm run dev
```

6. ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## 使い方

1. **テキスト入力**: 下部の入力欄にメッセージを入力して送信
2. **音声入力**: マイクボタンをタップして音声で質問
3. **音声読み上げ**: ヘッダーの🔊ボタンでON/OFFを切替
4. **履歴クリア**: ゴミ箱ボタンで会話履歴を削除

## プロジェクト構成

```
edgeai-talk/
├── app/
│   ├── api/chat/route.ts    # LM Studio APIプロキシ
│   ├── layout.tsx            # ルートレイアウト
│   ├── page.tsx              # メインチャット画面
│   └── globals.css           # グローバルスタイル
├── public/                   # 静的アセット
├── .env.local                # 環境変数
├── CLAUDE.md                 # Claude Code用ガイド
└── README.md
```

## 開発コマンド

- `npm run dev` - 開発サーバー起動
- `npm run build` - プロダクションビルド
- `npm run start` - プロダクションサーバー起動
- `npm run lint` - ESLint実行

## 今後の展開

- [ ] Dockerコンテナ化
- [ ] PWA対応（オフラインキャッシュ）
- [ ] エラーハンドリング強化
- [ ] 会話履歴の永続化

## ライセンス

MIT
