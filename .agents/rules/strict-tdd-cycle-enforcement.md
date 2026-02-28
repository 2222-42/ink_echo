---
trigger: always_on
---

Rule: strict-tdd-cycle-enforcement
Priority: critical
Applies to: **/*.ts **/*.tsx

When generating or modifying implementation code:
- MUST NOT write production code before a failing test exists for the behavior
- MUST write exactly one minimal failing test first when adding/changing behavior
- After test fails → implement minimal code to make it pass
- After pass → refactor ONLY (no behavior change)
- MUST run relevant tests immediately after any code change
- If tests fail → MUST NOT commit/push/propose PR
- MUST append test outcome to .artifacts/tdd-cycle-status.md:
  format:
  ## {timestamp}
  File: {changed_file}
  Phase: RED | GREEN | REFACTOR
  Tests run: {count}
  Failed: {list}
  Overall: FAIL → fix required | PASS → ready for next

If user asks to skip tests or write code first:
- Politely refuse and remind of this rule
- Suggest: "Please first create or update the failing test in tests/ directory"