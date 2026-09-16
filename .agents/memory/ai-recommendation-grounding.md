---
name: AI recommendation grounding
description: Safety boundary between deterministic website analysis and AI prioritization.
---

AI may select and prioritize only recommendations already produced from failed deterministic checks. All visible facts, rationale, actions, impact, difficulty, and source checks must be reconstructed from server-owned analysis; do not publish free model prose as measured advice.

**Why:** A valid failed-check reference alone does not prevent a model from attaching an unrelated or unsupported claim, especially when scanned website text contains prompt-like instructions.

**How to apply:** Keep scores and recommendation content deterministic. Give AI opaque eligible recommendation IDs, reject unknown/duplicate/extra output, and use the existing recommendations whenever AI is absent, invalid, or empty.