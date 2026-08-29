# 65/35 packages — implementation plan

Pricing / source review date: 28 August 2026.
Branch: `feat/bdoor-65-35-packages`.

## Checkpoints

| #   | Checkpoint                                                                      | Status          |
| --- | ------------------------------------------------------------------------------- | --------------- |
| 1   | Data model (existing migration) + seed of packages / draft international offers | In progress     |
| 2   | Price/source administration (admin list; publish mutations follow-up)           | Partial         |
| 3   | Public package components + four-country international cards                    | In progress     |
| 4   | Homepage 65/35 redesign (master section order, hero copy, founder image)        | In progress     |
| 5   | Bangladesh service/package pages (pricing page already shares catalog)          | Done / preserve |
| 6   | International country pages (multi-route aware; native currency labels)         | In progress     |
| 7   | Assessment `help_scope` + recommendation/manual-review gates                    | In progress     |
| 8   | Quote and payment safeguards (existing gates; draft int'l checkout off)         | Preserve        |
| 9   | English/Bangla content for new copy                                             | In progress     |
| 10  | Analytics, SEO, accessibility                                                   | Verify          |
| 11  | Tests and Vercel preview                                                        | Pending         |

## Homepage section order (master §8)

1. Bangladesh-first hero with international secondary CTA + founder image
2. Four-step bdoor process
3. Bangladesh package selector (New / Existing; three cards)
4. Transparent-fee example
5. Real workspace preview
6. Compact Bangladesh specialist-services list
7. Four international country cards (USA, UK, UAE, Singapore)
8. Existing-business / compliance value
9. Six FAQs maximum
10. Final assessment CTA

Seven-country comparison remains on `/countries`, not in the homepage first composition.

## Published vs draft

| Package / offer                   | Public status              | Checkout                             |
| --------------------------------- | -------------------------- | ------------------------------------ |
| Six Bangladesh packages           | Published (catalog + seed) | Catalog `true`; runtime launch-gated |
| USA / UK / UAE / Singapore offers | Draft; request-quote       | Disabled until partner gates         |
| Saudi Arabia / Qatar              | Draft; eligibility-led     | Disabled                             |

## Follow-up (not blocking feature-branch preview)

- Admin approve/publish mutations against Postgres with audit.
- Partner agreement records and margin checks wired to checkout enablement.
- Package detail routes `/packages/[slug]`.
- Human review of Bangla legal/commercial wording.
- Claude Code / research instruction files if the owner supplies them later.
