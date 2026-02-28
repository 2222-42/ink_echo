---
description: 
---

---
title: TDD Cycle (Red → Green)
description: 次の1つの小さな挙動をTDDで完結させる
---

steps:
  - run: /tdd-red
  - wait_for_user_approval: false   # 自動で次へ（慎重にしたい場合はtrue）
  - run: /tdd-green
  - if: "tests passed"
    then: notify "PASS → 次の小さな要件を教えてください"
  - else: notify "FAIL → 修正が必要。見ておきますか？"