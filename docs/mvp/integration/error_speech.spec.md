# Error Speech Feedback Spec

## Overview
エラー発生時にユーザーへ音声でフィードバックを返す。
テキストバナーに加えて ElevenLabs TTS で読み上げる。

## ACCEPTANCE_CRITERIA

### AC-1: STT permission denied → 音声フィードバック
- `SpeechRecognitionErrorEvent.error === 'not-allowed'` の場合
- 音声メッセージ: `"マイクを許可してください。ブラウザの設定を確認してください。"`
- `playText()` を使って再生する（turn=1で固定）

### AC-2: Mistral API 失敗 → 音声フィードバック
- `mistralClient.chat()` が例外を throw した場合
- 音声メッセージ: `"今ちょっと混んでるみたい。もう一度話しかけて。"`
- `playText()` を使って再生する

### AC-3: UI バナーも同時に表示
- 音声フィードバックに加えて、既存の `errorMessage` state も更新する
- AC-1: errorMessage = `"マイクを許可してください。"`
- AC-2: errorMessage = `"もう一度話しかけてください。"`

### AC-4: 音声フィードバック中は二重再生しない
- `isProcessing` の間は `playText` エラー音声を呼ばない（既に処理中のため）
