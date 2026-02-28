# Vercel セットアップガイド（Ink Echo）

Ink Echo を Vercel にデプロイするために必要な設定と手順をまとめました。

---

## 1. 現状と必要なもの

### すでにあるもの
- **API**: ルートの `api/` に Vercel Serverless Functions（TypeScript）
  - `api/hello.ts`（ヘルスチェック）
  - `api/mistral/chat.ts`, `api/mistral/vision.ts`
  - `api/elevenlabs/tts.ts`
- 各ハンドラは `@vercel/node` の `VercelRequest` / `VercelResponse` を使用

### 追加で必要なもの

| 項目 | 説明 |
|------|------|
| **package.json** | 依存（`@vercel/node` など）と Node バージョン |
| **環境変数** | `MISTRAL_API_KEY`, `ELEVENLABS_API_KEY`（Vercel ダッシュボードで設定） |
| **vercel.json**（任意） | 関数のタイムアウト・メモリ、ビルド設定など |
| **Git 連携 or CLI** | デプロイ方法のいずれか |

---

## 2. package.json

プロジェクトルートに `package.json` を用意します。Vercel はこれを元にビルド・実行環境を判断します。

**最小構成例:**

```json
{
  "name": "ink-echo",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": ">=18.x"
  },
  "dependencies": {
    "@vercel/node": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^2.0.0"
  },
  "scripts": {
    "build": "echo 'No frontend build'",
    "test": "vitest run"
  }
}
```

- **API のみ**の場合は `build` は空で問題ありません（Vercel が `api/` を自動検出）。
- **フロント（Vite）を追加する場合**は、後述の「フロントエンド（Vite）を一緒にデプロイする場合」を参照してください。

---

## 3. 環境変数

API が外部サービスを呼ぶため、次の環境変数を Vercel に設定します。

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `MISTRAL_API_KEY` | ✅ | Mistral API キー |
| `ELEVENLABS_API_KEY` | ✅ | ElevenLabs API キー |

### 設定方法

**A. Vercel ダッシュボード**
1. [Vercel Dashboard](https://vercel.com/dashboard) → 対象プロジェクト
2. **Settings** → **Environment Variables**
3. 上記のキーを **Production / Preview / Development** の必要な環境に追加

**B. Vercel CLI**
```bash
vercel env add MISTRAL_API_KEY production
vercel env add ELEVENLABS_API_KEY production
```
（対話で値を入力）

**注意:** `.env` は `.gitignore` に入っているためリポジトリには含めず、Vercel 側だけで管理してください。

---

## 4. vercel.json（任意）

ルートに `vercel.json` を置くと、関数の制限やビルドをカスタマイズできます。

**推奨例（API のみ・Mistral/ElevenLabs 用）:**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

- **maxDuration**: 60秒（Mistral / ElevenLabs の応答待ちを考慮）。無料枠では 10 秒制限がある場合あり。
- **memory**: 1024 MB（必要に応じて変更）。

フロント（Vite）をデプロイする場合は、次のセクションの `buildCommand` / `outputDirectory` を追加します。

---

## 5. デプロイ方法

### A. Git 連携（推奨）

1. GitHub / GitLab / Bitbucket にリポジトリを push
2. [vercel.com](https://vercel.com) で **Add New Project**
3. 対象リポジトリを選択し、**Import**
4. **Environment Variables** で `MISTRAL_API_KEY` と `ELEVENLABS_API_KEY` を設定
5. **Deploy** で初回デプロイ
6. 以降は push のたびに自動でプレビュー／本番デプロイ

### B. Vercel CLI

```bash
# 初回のみ（ログイン・プロジェクト紐付け）
npm i -g vercel
vercel login
vercel

# 本番デプロイ
vercel --prod
```

初回はプロジェクト名・ルートディレクトリなどを聞かれるので、そのまま進めれば問題ありません。環境変数はダッシュボードか `vercel env add` で事前に設定してください。

---

## 6. フロントエンド（Vite）を一緒にデプロイする場合

設計書どおり React + Vite のフロントをルートに追加する場合のポイントです。

### 6.1 ディレクトリ・ビルド

- フロント: ルートの `src/` + `index.html` + `vite.config.ts`
- ビルド出力: 既定では `dist/`

### 6.2 package.json

```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite"
  },
  "dependencies": {
    "@vercel/node": "^3.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

### 6.3 vercel.json（フロント + API）

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

- 静的サイトは `dist` から配信され、`/api/*` はそのまま `api/` のサーバレス関数に流れます。
- Vite は **Framework Preset** で自動検出されることが多いですが、明示する場合は `framework: "vite"` を指定します。

### 6.4 フロントの API ベース URL

本番では同じドメインにデプロイするため、フロントの API 呼び出しは相対パス（例: `/api/mistral/chat`, `/api/elevenlabs/tts`）にしておけば、Vercel がそのまま `api/` にルーティングします。`src/api/` のクライアントがすでに相対パスなら変更不要です。

---

## 7. チェックリスト

デプロイ前に確認するとよい項目です。

- [ ] ルートに `package.json` がある（`@vercel/node` を含む）
- [ ] Vercel の Environment Variables に `MISTRAL_API_KEY` と `ELEVENLABS_API_KEY` を設定した
- [ ] （任意）`vercel.json` で `api/**/*.ts` の `maxDuration` を設定した
- [ ] ローカルで `npx vercel dev` を実行し、`/api/hello` などが動作することを確認した
- [ ] フロントをデプロイする場合は `build` が `vite build` になり、`outputDirectory` が `dist` になっている

---

## 8. 参考リンク

- [Vercel デプロイ概要](https://vercel.com/docs/deployments/overview)
- [Git リポジトリとの連携](https://vercel.com/docs/deployments/git)
- [Project Configuration (vercel.json)](https://vercel.com/docs/projects/project-configuration)
- [Node.js Runtime (Vercel Functions)](https://vercel.com/docs/functions/runtimes/node-js)
- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
