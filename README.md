# Ink Echo - Project Overview & Core Concept  
（プロジェクト全体のコンセプト・哲学・MVPの狙い）

## プロジェクト名
Ink Echo (インクエコー)

## ハッカソン情報
- **イベント**: Mistral AI Worldwide Hackathon 2026 (Tokyo edition)
- **狙い賞**: Best Voice Use Case (ElevenLabs)  
  → 声の創造的・革新的な活用を重視

## コアコンセプト
- ユーザーが声で悩み・思考を吐露  
- AI (Mistral) が深い問い返しを生成（Newsletterスタイル：トレードオフ指摘、主体性重視、Doomer脱出など）  
- 問い返しを声 (ElevenLabs TTS) で返す  
- 対話を最大7ターンで強制終了  
- 最後に「紙に手書きでまとめてZettelkastenにしてまってね」と声で促す  
- さらに話したい場合 → **実際に紙に書いて写真をアップロードしないと再開不可**  
→ これにより「せざるを得ない」(non-indifference) 心理を誘発し、デジタル完結を拒否 → アナログ回帰を強制

## 哲学的根拠（Newsletterとの一貫性）
- AIは下働きに徹する（代わりにまとめない）
- 最終アウトプットはアナログ（手書き + Zettelkasten）でなければ耐時間性がない
- デジタル過信批判 → 主体性・記憶の宮殿を守る
- 「～せざるを得ない」状態を声で演出（ElevenLabs賞狙い）

## 主要機能フロー
1. 声入力 → STT（Web Speech API） → Mistralで問い返し生成 → ElevenLabs TTSで再生  
2. 7ターン到達 → 固定メッセージ音声再生（「紙に書いてアップロードしてね」） + マイク無効化  
3. 写真アップロード → Mistral Visionで解析（文字読み取り + キーワード抽出 + リンク提案）  
4. 解析結果を基に再開（肯定的フィードバック音声 → 新しい問い返し）

## 技術スタック（MVP）
- **Frontend**: React + Vite + Tailwind CSS  
- **状態管理**: localStorage（セッション内完結）  
- **Backend**: Vercel Serverless Functions（または Cloudflare Workers）  
- **AI**: Mistral API（chat + vision: pixtral）  
- **Voice**: ElevenLabs TTS（日本語声、感情パラメータでトーン調整）  
- **STT**: Web Speech API（ブラウザネイティブ）

## Feature Flags（機能フラグ）

### ENABLE_VISION_FALLBACK
Vision API失敗時のフォールバック動作を制御します。

**デフォルト値**: `false` （正直にエラーを伝え、再試行を促す）

**設定方法**:
```bash
# クライアントサイド (Vite) - VITE_ プレフィックスが必須
VITE_ENABLE_VISION_FALLBACK=true

# サーバーサイド (Vercel Functions)
ENABLE_VISION_FALLBACK=true
```

**重要**: クライアントサイドのコードで使用する環境変数は、Viteの仕様により `VITE_` プレフィックスが必須です。

**動作**:
- **OFF（デフォルト）**: Vision API失敗時に正直なエラーメッセージを表示し、再アップロードを促す
  - ユーザーに透明性を提供
  - 再チャレンジを促進
  - 推奨設定（哲学に沿った誠実な対応）

- **ON**: Vision API失敗時にフォールバックテンプレートを使用した共感的応答を返す
  - Graceful degradation
  - セッションが止まらない
  - 深い解釈は行わず、ユーザーの主体性を維持
  - テンプレートベースの質問返し

**メトリクス**:
- `vision_failure_honest`: フラグOFF時の失敗数
- `vision_failure_fallback_used`: フラグON時のフォールバック使用数

**運用方針**:
1. 初期値: false（正直モード）
2. 失敗率が高い場合（30%以上）のみ一時的にON
3. 内部テスター検証後、徐々にロールアウト

**実装位置**:
- サーバーサイド: `/api/mistral/vision.ts`
- クライアントサイド: `/src/App.tsx`
- フラグ管理: `/src/lib/featureFlags.ts`
- フォールバック生成: `/api/mistral/fallback.ts`

## UI / ワイヤーフレームの要点（モバイルファースト）
- メイン画面: 会話ログ（スクロール） + 下部固定マイクボタン  
- 7ターン終了: 半透明オーバーレイ（「紙に書いてアップロード」促し + 大きなボタン）  
- アップロード: プレビュー + カメラ/ギャラリー選択 + 解析ボタン  
- 再開時: トップに一時メッセージ（「このカード、素晴らしい」）

## 差別化・強み
- 既存声ジャーナリングツール（Kin, Voicenotesなど）と異なり、デジタル完結を拒否 → アナログ強制  
- ElevenLabs賞に特化: 声が「行動変容を促す伴走者」になる  
- Newsletterの哲学（アナログZettelkasten、耐時間性、主体性）を体現

## ピッチフレーズ例
> 「AIは便利すぎるからこそ主体性を奪う。でもInk Echoは、声で深く問いかけ、最後に『紙に書け』と強制する。あなたは無関心ではいられなくなる。」