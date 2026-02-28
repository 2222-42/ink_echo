---
description: TDD - Green (Make it pass)
---

---
title: TDD - Green (Make it pass)
---

1. 直前のREDテスト（.artifacts/tdd-red-*.md）を読み込む
2. そのテストだけを通す最小限の変更をsrc/に適用
3. 変更後すぐ該当テストを再実行
4. PASSしたら .artifacts/tdd-green-{feature}.md にdiffと結果保存
5. 「GREEN完了。リファクタしますか？ /tdd-refactor」または「次のspec/テストへ進みますか？」