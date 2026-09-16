---
name: Scoring reliability
description: Product rules for evidence-based SiteCheck AI scores and unsupported conclusions.
---

Unknown checks are neither positive nor negative: exclude their weight from both the numerator and denominator. Exclude an all-unknown category from the overall average. Mobile stays all-unknown until a real mobile browser or PageSpeed measurement exists.

CTA presence, CTA clarity, and action orientation are separate checks. Mark clarity unknown unless the candidate itself has concrete conversion wording and is explicitly marked as a CTA/button; do not borrow evidence from another CTA.

**Why:** The report must not inflate scores or claim conclusions that static homepage HTML cannot support.

**How to apply:** Preserve these rules whenever adding checks, changing weights, or expanding recommendations. Every recommendation must cite the concrete checks and scope absence claims to the page, headers, or standard location actually inspected.