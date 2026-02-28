---
description: TDD - Red (Write failing test)
---

---
title: TDD - Red (Write failing test)
description: 次の小さな挙動に対する最小限の失敗テストを書く
---

1. ユーザーが今何を追加/変更したいか最新の会話と開いているファイルを参照
2. まだ存在しない最小のテストケースを特定（1 assertionだけ）
3. tests/ 配下に適切な場所へ failing test を書き込む
4. テストを実行（使用可能なテストコマンドを自動検出: npm test, pytest, cargo test など）
5. 失敗することを確認し、結果を .artifacts/tdd-red-{feature}.md に保存
6. 「RED完了。次はGREEN（実装）へ進みますか？ /tdd-green」と提案