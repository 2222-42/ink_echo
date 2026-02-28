# Ink Echo - MVP 開発タスク一覧 (tasks.md)

このドキュメントは `design.md` に基づき、MVPの実装タスクを整理したものです。複数人が非同期で開発（マルチトラック開発）できるように、コンポーネントごとの依存関係を最小限に抑え、独立して並行作業ができるようTrack（領域）ごとに分割しています。

## ⚠️ 重要・開発前提ルール (Spec-Driven & TDD)

当プロジェクトでは以下の2つのルールを絶対厳守します。
1. **[spec-first-enforcement]**: 実装の前に必ず `*.spec.md` または `*.test.{ts,tsx}` を作成し、そこに `ACCEPTANCE_CRITERIA` （受入基準）を明記すること。仕様またはテストがない状態での実装は禁止です。
2. **[strict-tdd-cycle-enforcement]**: TypeScriptの実装において「Red (テスト失敗) → Green (最小コードで成功) → Refactor (リファクタリング)」のサイクルを厳守すること。実装が完了したら必ず `.artifacts/tdd-cycle-status.md` にステータスを記録すること。

---

## 📍 Track 1: 基盤セットアップとUIモックアップ (Infrastructure & UI)
**依存関係**: なし (独立して着手可能)
**目的**: React/Vite/Tailwindの基盤構築、各UIコンポーネントのプロップ検証と見た目の実装 (APIモック利用)

- [ ] **Task 1.1**: 初期プロジェクトのセットアップとLint/Test環境構築
  - 要求事項: `infra.spec.md` を作成し受入基準を定義後、Vite + React + Tailwind + Vitest + Testing Library のインストール・設定を行う。
- [ ] **Task 1.2**: `MicButton` コンポーネントの実装
  - 要求事項: TDD厳守。`MicButton.test.tsx` (Red) を作成し、録音中/停止中/Disabled の見た目の変化とコールバック発火を検証する。その後実装 (Green) -> Refactor。
- [ ] **Task 1.3**: `ConversationLog` コンポーネントの実装
  - 要求事項: TDD厳守。`ConversationLog.test.tsx` (Red) を作成し、会話履歴配列の受け取りと正しい表示、音声再生ボタンの動作可否を検証する。実装 (Green) -> Refactor。
- [ ] **Task 1.4**: `UploadArea` コンポーネントの実装
  - 要求事項: TDD厳守。`UploadArea.test.tsx` (Red) を作成。ファイル選択・D&DUI、画像のBase64プレビューなどの動作を検証する。実装 (Green) -> Refactor。
- [ ] **Task 1.5**: `EndMessageOverlay` コンポーネントの実装
  - 要求事項: TDD厳守。`EndMessageOverlay.test.tsx` (Red) を作成し、特定の条件(ターン終了トリガー)でオーバーレイと指定メッセージが表示されるか検証する。実装 (Green) -> Refactor。

---

## 📍 Track 2: 状態管理とターン制御 (State & Logic)
**依存関係**: Track 1のモックUIと並行して着手可能 (API層には依存しない)
**目的**: localStorage を使ったセッション保存、履歴管理、ターンカウントのビジネスロジックの実装

- [ ] **Task 2.1**: ストレージインターフェースと実装 (`lib/storage.ts`)
  - 要求事項: `storage.test.ts` (Red) を作成。将来の拡張(Cloudflare KV等)を見据え、インターフェースに基づく `LocalStorageImpl` の保存(saveSession)と取得(getSession)をテスト。実装 (Green) -> Refactor。
- [ ] **Task 2.2**: `useConversation` フック: 初期化と状態変数の管理
  - 要求事項: `useConversation.test.ts` (Red) を作成。UUIDの生成処理、初期ターン0、初期メッセージ空配列であることを検証。実装 (Green) -> Refactor。
- [ ] **Task 2.3**: `useConversation` フック: 対話進行と7ターン強制終了
  - 要求事項: ターンカウントの増加 (`turns++`)、履歴配列 (`history`) へのメッセージ追加機能を追加。7ターン目に達した時に終了フラグが立つロジックのテスト (Red) を追加。実装 (Green) -> Refactor。
- [ ] **Task 2.4**: `useConversation` フック: 画像アップロード解析後の再開ロジック
  - 要求事項: Vision APIの解析結果（モック）を受け取り、履歴に肯定的なフィードバックを挿入し、継続フラグを立てるテスト (Red) を作成。実装 (Green) -> Refactor。

---

## 📍 Track 3: 外部APIインテグレーション・音声ハンドリング (API & Audio)
**依存関係**: なし (通信仕様に基づく単体テストで独立実装可能)
**目的**: Mistral API, ElevenLabs API の呼び出しラッパー層、Web Speech APIの制御

- [ ] **Task 3.1**: Mistral API ラッパーの実装 (`api/mistral.ts`)
  - 要求事項: `mistral.test.ts` (Red) を作成。モックを用いてテキスト対話のプロンプト送信とレスポンスパース成功・失敗をテスト。システムプロンプトによる問い返しルール（[SPEC-08]準拠）がフォーマットとして守られているか。実装 (Green) -> Refactor。
- [ ] **Task 3.2**: Mistral Vision API ラッパーの実装 (画像解析)
  - 要求事項: Base64画像とこれまでの履歴を送信し、構造化JSON抽出を行うテスト (Red) を追加。実装 (Green) -> Refactor。
- [ ] **Task 3.3**: ElevenLabs API ラッパーの実装 (`api/elevenlabs.ts`)
  - 要求事項: `elevenlabs.test.ts` (Red)作成。テキスト送信に対するバイナリ音声の返却および、ターン数に応じて特定の声トーンバラメータ(stability/style)が動的に切り替わる(トーンシフト)挙動をテスト。実装 (Green) -> Refactor。
- [ ] **Task 3.4**: `useAudio` フックの実装 (音声入出力管理)
  - 要求事項: `useAudio.test.ts` (Red) 作成。Web Speech API (STT録音開始・終了のモック) と TTS(ElevenLabs再生待ち) 状態を繋いで管理するロジックをテスト。実装 (Green) -> Refactor。

---

## 📍 Track 4: 統合とフロー完成 (App Integration)
**依存関係**: Track 1, 2, 3 の実装完了後
**目的**: 全てのフック、コンポーネント、APIを結合し、実際のアプリケーションとしてのフローを完成させる

- [ ] **Task 4.1**: 通常ターンフローの結合 (UI + Logic + API)
  - 要求事項: `integration/normal_turn.spec.md` で受入テスト仕様を作成。`App.tsx` 上で「MicButton押下 -> 録音・STT -> Mistral API呼出 -> TTS再生 -> ターン数・履歴保存」の一連のフローを繋ぎ込む。
- [ ] **Task 4.2**: 7ターン目強制終了フローの結合
  - 要求事項: `integration/end_turn.spec.md` に受入テスト仕様を作成。7ターン到達時に `EndMessageOverlay` を表示、MicButtonを無効化し、アップロードUIを表示させる。
- [ ] **Task 4.3**: 画像アップロード・再開フローの結合
  - 要求事項: `integration/upload_resume.spec.md` に受入テスト仕様を作成。アップロード画像を `Mistral Vision API` に送り、肯定的なフィードバックを音声で返しつつ対話を再開するフローを結合する。

---

## （Opt）📍 Track 5: ロギングと自己改善・MCP拡張準備
**目的**: Observability 向けの下準備

- [ ] **Task 5.1**: Weave トレーシングのインターフェース準備
  - 要求事項: 将来の W&B Weave 統合向けに、各APIリクエスト時のメタデータをモックとしてロギング・出力するラッパー機能を追加。
