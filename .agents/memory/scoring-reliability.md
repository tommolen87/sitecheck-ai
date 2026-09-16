---
name: Scoring reliability
description: Product rules for evidence-based SiteCheck AI scores and unsupported conclusions.
---

Category quality uses only executed checks: unknown checks are excluded from the category numerator and denominator. An all-unknown category has no category score. Mobile stays all-unknown and unscored until a real mobile browser or PageSpeed measurement exists.

Present category quality and measurement coverage separately. Coverage is the unweighted percentage of checks whose status is passed or failed. A 100 score with unknown checks must be labeled as strong only on measurable parts and show the unknown count.

The overall score uses seven fixed, equal category shares. Each category contributes `category score × coverage`; an unscored category contributes zero. Average those seven contributions. Overall coverage is likewise averaged across seven fixed shares, so missing categories never inflate either value.

CTA presence, CTA clarity, and action orientation are separate checks. Mark clarity unknown unless the candidate itself has concrete conversion wording and is explicitly marked as a CTA/button; do not borrow evidence from another CTA.

**Why:** The report must not inflate scores, treat unknown measurements as successful, or claim conclusions that static homepage HTML cannot support.

**How to apply:** Preserve these rules whenever adding checks, changing weights, or expanding recommendations. Only failed checks may create recommendations; unknown checks only receive explanatory copy. Scope absence claims to what was inspected.