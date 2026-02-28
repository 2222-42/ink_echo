# Ink Echo - Project Overview & Core Concept
(Overall project concept, philosophy, and MVP goals)

<div align="right">
日本語は下部にあります (Japanese version is below)
</div>

## Project Name
Ink Echo

## Hackathon Information
- **Event**: Mistral AI Worldwide Hackathon 2026 (Tokyo edition)
- **Target Prize**: Best Voice Use Case (ElevenLabs)  
  → Emphasizes creative and innovative use of voice.

## Core Concept
- Users express their concerns and thoughts via voice.
- AI (Mistral) generates deep reflective questions (Newsletter style: pointing out trade-offs, emphasizing autonomy, escaping Doomerism, etc.).
- The reflective questions are returned via voice (ElevenLabs TTS).
- The conversation is forcibly terminated at a maximum of 7 turns.
- Finally, a voice prompt urges the user: "Please summarize your thoughts by handwriting them on paper and create a Zettelkasten card."
- If the user wants to talk more → **They cannot resume unless they actually write on paper and upload a photo**.
→ This induces a psychological state of "having no choice but to do it" (non-indifference), rejecting digital completion → forcing a return to analog.

## Philosophical Foundation (Consistency with Newsletter)
- AI remains a subordinate (it does not summarize on your behalf).
- The final output must be analog (handwriting + Zettelkasten) to be time-resistant.
- Critique of digital over-reliance → Protecting autonomy and the mind palace.
- Creating a situation of "having no choice but to do it" via voice (Aiming for the ElevenLabs prize).

## Primary Feature Flow
1. Voice input → STT (Web Speech API) → Mistral generates reflective questions → Played back via ElevenLabs TTS.
2. Reaching 7 turns → Plays a fixed message voice ("Please write on paper and upload") + disables the microphone.
3. Photo upload → Mistral Vision analysis (text reading + keyword extraction + link suggestion).
4. Resume based on analysis results (Positive feedback voice → new reflective questions).

## Tech Stack (MVP)
- **Frontend**: React + Vite + Tailwind CSS
- **State Management**: localStorage (completed within a session)
- **Backend**: Vercel Serverless Functions (or Cloudflare Workers)
- **AI**: Mistral API (chat + vision: pixtral)
- **Voice**: ElevenLabs TTS (Japanese voice, tone adjustment with emotion parameters)
- **STT**: Web Speech API (Browser native)

## Feature Flags

### MAX_TURNS
Sets the number of conversation turns. This can be shortened for demos and pitches.

**Default value**: `7` (7 turns)

**Configuration**:
```bash
# Client-side (Vite) - VITE_ prefix is required
VITE_MAX_TURNS=4
```

**Use Case**:
- **For Demos/Pitches**: Set turns to 4 to complete the demo within 5 minutes.
- **Normal Version**: Deep dialogue realized with the default 7 turns.

**Implementation Locations**:
- Settings management: `/src/lib/featureFlags.ts`
- Usage: `/src/hooks/useConversation.ts`, `/src/App.tsx`

### ENABLE_VISION_FALLBACK
Controls the fallback behavior when the Vision API fails.

**Default value**: `false` (honestly communicates the error and prompts a retry)

**Configuration**:
```bash
# Client-side (Vite) - VITE_ prefix is required
VITE_ENABLE_VISION_FALLBACK=true

# Server-side (Vercel Functions)
ENABLE_VISION_FALLBACK=true
```

**Important**: Environment variables used in client-side code require the `VITE_` prefix due to Vite specifications.

**Behavior**:
- **OFF (Default)**: Displays an honest error message when the Vision API fails and prompts re-upload.
  - Provides transparency to the user.
  - Encourages a retry.
  - Recommended setting (honest response aligned with the philosophy).

- **ON**: Returns an empathetic response using a fallback template when the Vision API fails.
  - Graceful degradation.
  - The session does not stop.
  - No deep interpretation is performed, maintaining user autonomy.
  - Template-based question return.

**Metrics**:
- `vision_failure_honest`: Number of failures when flag is OFF.
- `vision_failure_fallback_used`: Number of fallback usages when flag is ON.

**Operational Policy**:
1. Initial value: false (Honest mode)
2. Turn ON temporarily only if the failure rate is high (30% or more).
3. Gradually roll out after internal tester verification.

**Implementation Locations**:
- Server-side: `/api/mistral/vision.ts`
- Client-side: `/src/App.tsx`
- Flag management: `/src/lib/featureFlags.ts`
- Fallback generation: `/api/mistral/fallback.ts`

## UI / Wireframe Key Points (Mobile First)
- Main screen: Conversation log (scroll) + fixed microphone button at the bottom.
- 7 turns completed: Semi-transparent overlay (Prompts "Write on paper and upload" + large button).
- Upload: Preview + Camera/Gallery selection + Analyze button.
- On Resume: Temporary message at the top ("This card is wonderful").

## Differentiation & Strengths
- Unlike existing voice journaling tools (Kin, Voicenotes, etc.), it rejects digital completion → forces analog.
- Specialized for the ElevenLabs prize: Voice becomes a "companion that prompts behavioral change".
- Embodies the Newsletter philosophy (Analog Zettelkasten, time-resistance, autonomy).

## Example Pitch Phrase
> "AI deprives us of autonomy precisely because it is too convenient. But Ink Echo questions you deeply with voice, and finally forces you to 'write it on paper'. You will no longer be able to remain indifferent."

---

# 日本語版 (Japanese Version)

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

### MAX_TURNS
会話のターン数を設定します。デモやピッチのために短縮することができます。

**デフォルト値**: `7` （7ターン）

**設定方法**:
```bash
# クライアントサイド (Vite) - VITE_ プレフィックスが必須
VITE_MAX_TURNS=4
```

**用途**:
- **デモ・ピッチ用**: 5分以内でデモを完了するために、ターン数を4に設定
- **通常版**: デフォルトの7ターンで深い対話を実現

**実装位置**:
- 設定管理: `/src/lib/featureFlags.ts`
- 使用箇所: `/src/hooks/useConversation.ts`, `/src/App.tsx`

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