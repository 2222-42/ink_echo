---
description: Spec Change Auto Review
---

---
title: Spec Change Auto Review
description: 最新のspecファイルを厳格にレビューするワークフロー（変更検知後すぐ実行推奨）
trigger-hint: spec保存後すぐに /spec-review を実行
---

1. **現在の変更ファイルを特定**
   - 最新で変更された *.spec.md / *.feature.md を探す
   - なければ直近で編集されたspecファイルを対象にする

2. **Spec内容を厳密に読み込む**
   - view_file で内容を取得

3. **チェックリストに基づくレビュー実行** (deep thinking mode)
   - Acceptance Criteriaの具体性チェック
   - ケース網羅性（正常/異常/エッジ）
   - 非機能要件の有無
   - 一貫性・明確性
   - 見積もり・前提の記述漏れ

4. **レビュー結果をArtifactに出力**
   - ファイル名：.artifacts/spec-review-{現在のspecファイル名}-{YYYYMMDD-HHMM}.md
   - フォーマット：
     ## レビュー対象: {ファイル名}
     ### 概要
     ### 重大問題 (Critical)
     ### 要修正 (Major)
     ### 改善提案 (Minor)
     ### 良い点
     ### 総合判定: [APPROVED / NEEDS_FIX / NEEDS_MAJOR_WORK]

5. **ユーザーに報告**
   - 「specレビュー完了しました → .artifacts/... を確認してください」
   - 重大問題があれば強く警告