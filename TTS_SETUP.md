# TTS（音声読み上げ）セットアップガイド

EdgeAI Talkでは3種類のTTSエンジンを切り替えて使用できます。

## 1. Browser TTS（標準）

ブラウザ標準のWeb Speech APIを使用します。

### 特徴
- ✅ 追加セットアップ不要
- ✅ オフライン動作
- ❌ 音声品質が低い（ロボット声）
- ❌ ブラウザ依存

### 使用方法
アプリ起動後、ヘッダーの🔊ボタンをONにして、エンジン選択で「Browser」を選択。

---

## 2. VOICEVOX（推奨）

高品質な日本語音声合成エンジン。

### 特徴
- ✅ 自然な日本語音声
- ✅ 複数のキャラクター音声
- ✅ 無料・オープンソース
- ⚠️ Docker必須

### セットアップ

1. Docker Composeで起動:
```bash
docker-compose up -d voicevox
```

2. 起動確認:
```bash
curl http://localhost:50021/version
```

3. アプリで「VOICEVOX」を選択して使用

### 音声キャラクター変更

`.env.local`の`VOICEVOX_SPEAKER_ID`を変更:

| ID | キャラクター |
|----|------------|
| 0  | 四国めたん（ノーマル） |
| 1  | 四国めたん（あまあま） |
| 2  | 四国めたん（ツンツン） |
| 3  | ずんだもん（ノーマル） |
| 8  | 春日部つむぎ（ノーマル） |

完全なリストは https://voicevox.hiroshiba.jp/ を参照。

---

## 3. Piper TTS

軽量で高品質な多言語音声合成エンジン。

### 特徴
- ✅ 軽量・高速
- ✅ 多言語対応
- ⚠️ Docker必須
- ⚠️ 日本語音声の品質は中程度

### セットアップ

1. Docker Composeで起動:
```bash
docker-compose up -d piper
```

2. 起動確認（Wyoming protocolを使用）:
```bash
curl http://localhost:10200
```

**注意**: 現在のdocker-compose.ymlは Wyoming protocol用です。HTTP API版に変更が必要な場合があります。

3. アプリで「Piper」を選択して使用

### 代替セットアップ（HTTP API版）

Piper用の簡易HTTPラッパーが必要な場合:

```bash
# Python環境でFlaskラッパーを作成
pip install piper-tts flask

# server.py を作成して起動
python server.py
```

`server.py`の例:
```python
from flask import Flask, request, send_file
from piper import PiperVoice
import io

app = Flask(__name__)
voice = PiperVoice.load('ja_JP-mh_model-medium')

@app.route('/api/tts', methods=['POST'])
def tts():
    data = request.json
    text = data.get('text', '')

    audio_bytes = io.BytesIO()
    voice.synthesize(text, audio_bytes)
    audio_bytes.seek(0)

    return send_file(audio_bytes, mimetype='audio/wav')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

---

## トラブルシューティング

### VOICEVOXが起動しない

```bash
# ログ確認
docker-compose logs voicevox

# 再起動
docker-compose restart voicevox
```

### 音声が再生されない

1. ブラウザの開発者ツール（F12）でコンソールを確認
2. エラーメッセージを確認
3. TTSサーバーが起動しているか確認:
   - VOICEVOX: `curl http://localhost:50021/version`
   - Piper: `curl http://localhost:5000/health`（カスタム実装の場合）

### 音声が途切れる

- ネットワーク遅延の可能性があります
- ローカルで動作しているか確認してください（localhost）

---

## パフォーマンス比較

| エンジン | 初回遅延 | 音質 | リソース |
|---------|---------|------|---------|
| Browser | 即時 | ⭐⭐ | 最小 |
| VOICEVOX | 0.5-1秒 | ⭐⭐⭐⭐⭐ | 中 |
| Piper | 0.3-0.7秒 | ⭐⭐⭐⭐ | 小 |

---

## 展示会での推奨設定

展示会デモでは **VOICEVOX** を推奨します：

1. 事前にDockerコンテナを起動
2. アプリで「VOICEVOX」を選択
3. お好みのキャラクター音声に設定（例: ずんだもん）
4. 🔊ボタンをONにして使用

音声品質が最も自然で、来場者の印象が良くなります。
