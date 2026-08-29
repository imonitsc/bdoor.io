# 65/35 packages — implementation plan

Pricing review date: 28 August 2026.

## Checkpoints

| #   | Checkpoint                                                                                     | Status         |
| --- | ---------------------------------------------------------------------------------------------- | -------------- |
| 1   | Data model and migrations (`service_packages`, versions, fee components, international offers) | Done           |
| 2   | TypeScript catalog + layer pricing helpers                                                     | Done           |
| 3   | Public package components (selector, fee example, international cards, specialist list)        | Done           |
| 4   | Homepage 65/35 redesign (section order, hero copy, operator disclosure)                        | Done           |
| 5   | Assessment `help_scope` first question + manual-review gates                                   | Done           |
| 6   | Admin packages list at `/admin/pricing`                                                        | Done           |
| 7   | English/Bangla `packages.*` and updated `home.*` keys                                          | Done           |
| 8   | Unit tests (pricing matrix) + integration RLS test                                             | Done           |
| 9   | `pnpm run verify`, integration, e2e                                                            | Pending CI     |
| 10  | Vercel preview on feature branch                                                               | Pending deploy |

## Homepage section order (implemented)

1. Bangladesh-first hero with international secondary CTA
2. Four-step bdoor process
3. Bangladesh package selector (New / Existing tabs, three cards)
4. Transparent fee example
5. Workspace preview
6. Compact specialist services list
7. Four international country cards
8. Existing-business compliance value
9. Six FAQs
10. Final assessment CTA

## Published vs draft

| Package / offer                   | Public status       | Checkout |
| --------------------------------- | ------------------- | -------- |
| Six Bangladesh packages           | Published (catalog) | Enabled  |
| USA / UK / UAE / Singapore offers | Draft               | Disabled |

## Follow-up (not blocking preview)

- Seed `service_packages` rows from catalog into Postgres.
- Admin publish/approve workflow wired to DB mutations.
- Package-specific pages (`/packages/[slug]`).
- Founder hero image when asset is supplied.
- Bangla legal/commercial human review before production.
