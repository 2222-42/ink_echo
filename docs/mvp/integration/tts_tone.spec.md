# TTS Tone Variation Spec

## Overview
TTSのトーン（声の安定性・スタイル）を会話のターン数に応じて変化させる。
ターンが進むにつれて、AIの声がわずかにエモーショナルになる。

## ACCEPTANCE_CRITERIA

### AC-1: getToneParams(turn) — tone parameter mapping
- turn 1-4: `{ stability: 0.7, style: 0.3 }` (安定・落ち着いた)
- turn 5-6: `{ stability: 0.55, style: 0.45 }` (少し感情的に)
- turn 7+:  `{ stability: 0.45, style: 0.55 }` (感情的に、クライマックス)

### AC-2: TTSSpeakRequest must include tone params
- `TTSSpeakRequest` に `stability?: number` と `style?: number` を追加
- `elevenlabsClient.playAudio(text, turn)` は内部で `getToneParams(turn)` を呼び、requestに含める

### AC-3: API route receives and forwards tone params
- `/api/elevenlabs/tts` は `stability` と `style` をリクエストボディから受け取り ElevenLabs API に転送する

### AC-4: Backward compatible
- `turn` が省略された場合は `turn=1` (AC-1: stability=0.7, style=0.3) を使用する
