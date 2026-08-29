# Missing image assets (production-fix)

Owner-supplied files expected under `public/images/bdoor/`:

| File                       | Used on                    | Alt text                                                |
| -------------------------- | -------------------------- | ------------------------------------------------------- |
| `compliance-review.webp`   | Homepage How it works      | Professionals reviewing a business compliance checklist |
| `formation-documents.webp` | Services or Pricing (once) | An organised business-formation document workspace      |

Layout components are ready (`HowItWorksImage`, `FormationDocumentsImage`). Until the files arrive, the slots render a dashed missing-asset placeholder — no stock substitutes were added.

The homepage hero is no longer waiting on a file: the owner chose the founder
photograph (`public/images/bdoor-home-hero-founder.png`) for that slot, and it
renders through `HeroFounder`. `HeroDoorImage` is kept, unused, in case an
open-door photograph is commissioned for another slot later.
