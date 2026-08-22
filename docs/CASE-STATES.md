# Case states and transitions

A case moves through a fixed machine. The database is the source of truth:
`public.case_status_transitions` holds the edges and
`app.enforce_case_transition()` rejects anything not in the table. The same edges
are mirrored in `src/features/cases/state-machine.ts` so the UI can disable
impossible actions and so the machine can be unit-tested without a database.
`tests/integration/case-transitions.test.ts` fails if the two drift.

---

## The states

| Status                     | Meaning                                          | Waiting on |
| -------------------------- | ------------------------------------------------ | ---------- |
| `draft`                    | Being put together; not yet submitted to BDoor.  | —          |
| `awaiting_kyc`             | Identity documents requested.                    | customer   |
| `kyc_review`               | BDoor compliance is reviewing identity and risk. | BDoor      |
| `quote_ready`              | A quote has been prepared internally.            | BDoor      |
| `awaiting_acceptance`      | Quote sent; the customer has to accept it.       | customer   |
| `awaiting_payment`         | Accepted; payment outstanding.                   | payment    |
| `documents_required`       | Case documents outstanding.                      | customer   |
| `partner_review`           | With a partner advocate or agent.                | partner    |
| `ready_to_submit`          | Complete and checked; ready to file.             | BDoor      |
| `submitted`                | Filed with the authority.                        | authority  |
| `authority_query`          | The authority has raised a query.                | authority  |
| `customer_action_required` | Something is blocked on the customer.            | customer   |
| `approved`                 | The authority approved the filing.               | —          |
| `rejected`                 | The authority rejected the filing.               | —          |
| `closed`                   | Terminal. Nothing further happens.               | —          |
| `cancelled`                | Ended before completion.                         | —          |

`waiting_on` is stored on the case alongside `waiting_since` and
`elapsed_days_banked`. When a case starts waiting the clock stops; when it starts
moving again the elapsed days are banked. A turnaround estimate therefore never
counts days BDoor could not act on — see `src/features/cases/deadlines.ts`, which
also treats Friday and Saturday as the Bangladesh weekend.

---

## The transition table

Each row is an allowed edge and the actors permitted to take it.
`system` means an automated trigger, such as a verified payment webhook.

| From                       | To                         | customer | staff | partner | system |
| -------------------------- | -------------------------- | :------: | :---: | :-----: | :----: |
| `draft`                    | `awaiting_kyc`             |    ●     |   ●   |         |        |
| `draft`                    | `cancelled`                |    ●     |   ●   |         |        |
| `awaiting_kyc`             | `kyc_review`               |    ●     |   ●   |         |        |
| `awaiting_kyc`             | `cancelled`                |          |   ●   |         |        |
| `kyc_review`               | `quote_ready`              |          |   ●   |         |        |
| `kyc_review`               | `documents_required`       |          |   ●   |         |        |
| `kyc_review`               | `rejected`                 |          |   ●   |         |        |
| `kyc_review`               | `awaiting_kyc`             |          |   ●   |         |        |
| `quote_ready`              | `awaiting_acceptance`      |          |   ●   |         |        |
| `quote_ready`              | `cancelled`                |          |   ●   |         |        |
| `awaiting_acceptance`      | `awaiting_payment`         |    ●     |   ●   |         |        |
| `awaiting_acceptance`      | `quote_ready`              |          |   ●   |         |        |
| `awaiting_acceptance`      | `cancelled`                |    ●     |   ●   |         |        |
| `awaiting_payment`         | `documents_required`       |          |   ●   |         |   ●    |
| `awaiting_payment`         | `ready_to_submit`          |          |   ●   |         |   ●    |
| `awaiting_payment`         | `cancelled`                |          |   ●   |         |        |
| `documents_required`       | `partner_review`           |          |   ●   |         |        |
| `documents_required`       | `ready_to_submit`          |          |   ●   |         |        |
| `documents_required`       | `customer_action_required` |          |   ●   |         |        |
| `documents_required`       | `cancelled`                |          |   ●   |         |        |
| `partner_review`           | `ready_to_submit`          |          |   ●   |    ●    |        |
| `partner_review`           | `documents_required`       |          |   ●   |    ●    |        |
| `partner_review`           | `customer_action_required` |          |   ●   |    ●    |        |
| `ready_to_submit`          | `submitted`                |          |   ●   |    ●    |        |
| `ready_to_submit`          | `documents_required`       |          |   ●   |         |        |
| `submitted`                | `authority_query`          |          |   ●   |    ●    |        |
| `submitted`                | `approved`                 |          |   ●   |    ●    |        |
| `submitted`                | `rejected`                 |          |   ●   |    ●    |        |
| `authority_query`          | `customer_action_required` |          |   ●   |    ●    |        |
| `authority_query`          | `submitted`                |          |   ●   |    ●    |        |
| `authority_query`          | `rejected`                 |          |   ●   |         |        |
| `customer_action_required` | `documents_required`       |          |   ●   |         |        |
| `customer_action_required` | `partner_review`           |          |   ●   |         |        |
| `customer_action_required` | `submitted`                |          |   ●   |    ●    |        |
| `customer_action_required` | `cancelled`                |          |   ●   |         |        |
| `approved`                 | `closed`                   |          |   ●   |         |        |
| `rejected`                 | `closed`                   |          |   ●   |         |        |
| `rejected`                 | `documents_required`       |          |   ●   |         |        |
| `cancelled`                | `closed`                   |          |   ●   |         |        |
| `closed`                   | —                          |          |       |         |        |

---

## Rules the table encodes

- **A customer can never mark their own case approved, rejected or submitted.**
  Those come from the authority, recorded by staff or by the assigned partner.
- **A partner can move a case forward but cannot cancel one.** Cancellation is
  the customer's or BDoor's decision.
- **`closed` is absorbing.** Nothing leaves it. `cancelled` can still be closed
  for record-keeping.
- **`rejected` can go back to `documents_required`.** A rejection is often
  fixable, and forcing a new case would lose the history.
- **Only `system` and staff can act on payment.** The `system` edges out of
  `awaiting_payment` exist for the verified payment webhook.

Every transition writes a row to `public.case_status_history`, which is
append-only: an `app.reject_mutation()` trigger rejects update and delete. The
customer-visible subset is the `case_status_history_public` view, which is
`security_invoker = true` so the reader's own RLS applies.
