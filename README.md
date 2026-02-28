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