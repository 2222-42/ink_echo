---
trigger: always_on
---

Rule: spec-first-enforcement
When implementation files are about to be created/modified:
- Check if corresponding *.spec.md or *.test.{ts,py,...} exists and has ACCEPTANCE_CRITERIA section
- If missing → MUST create it first or refuse to proceed
- MUST reference the spec/test file explicitly in reasoning