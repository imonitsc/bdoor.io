---
description: Build, extend or audit the Rule to Obligation instantiation path — matching, deadline arithmetic, recurrence, supersession
argument-hint: [rule-id | entity-id | blank to audit the engine]
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(pnpm run test:*), Bash(pnpm run typecheck:*), mcp__supabase__execute_sql
disable-model-invocation: true
---

# Obligation instantiation — $ARGUMENTS

This is the load-bearing path in the product. A Rule is inert; an **Obligation** is a Rule
instantiated against a specific Entity with a concrete due date, and it is the thing that
generates the reminder that generates the return visit that generates the subscription
renewal. Retention is the metric that decides whether Bangladesh works at all — and it
lives here.

It is also where silent bugs live, because a wrong date looks exactly like a right one.

Scope: if `$ARGUMENTS` is a rule id, work that rule's instantiation. If it is an entity id,
generate and inspect that entity's obligations. If blank, audit the whole engine.

## 1. Matching — get scope right before you get dates right

Given an Entity, the engine selects Rules by jurisdiction, entity type, sector, and any
threshold conditions (turnover, headcount, import/export status, VAT registration).

The two failure modes are not symmetrical:

- **Under-firing** — we miss an obligation. The customer takes a penalty. Bad.
- **Over-firing** — we raise an obligation the customer does not owe. They do unnecessary
  work, pay an unnecessary provider fee, and stop trusting the product. **Worse**, because
  it destroys the thing the whole business rests on.

So when a rule's scope is ambiguous, do **not** fire it. Surface it as "may apply — confirm"
rather than as a due obligation.

Verify: does matching consider every scoping dimension the rule row carries, or does it
short-circuit on jurisdiction alone?

## 2. Deadline arithmetic — the part that bites

Treat a due date as a **calendar date in a jurisdiction**, never as an instant.

- Store due dates as `date`, not `timestamptz`. A deadline is "31 December in Dhaka", not a
  moment. Storing an instant produces off-by-one-day errors that appear only for users in
  another timezone — which is precisely the Gulf corridor.
- Compute from a **trigger date** plus an offset, never from a hardcoded calendar date.
- Bangladesh's fiscal year runs **July to June**. Do not assume January anywhere.
- Month arithmetic must handle month-end: 31 January plus one month is not 31 February.
  Decide and document whether we clamp to the last valid day or roll forward, then apply it
  consistently.
- Leap years.
- If the computed date lands on a weekend or a public holiday **in that jurisdiction**,
  apply the jurisdiction's own convention — most roll forward to the next working day, but
  some do not. This is a per-jurisdiction rule, not a global one. Bangladesh's weekend is
  Friday–Saturday; the Gulf differs; do not assume Saturday–Sunday.
- Holiday data must exist for the year being computed. If it does not, fail loudly rather
  than silently computing against an empty holiday set.

Write the test cases as you go — see §5.

## 3. Recurrence and idempotency

- Regenerating obligations for an entity must be **idempotent**. Running the engine twice
  must not create duplicates. Key on (entity, rule, period), not on a fresh insert each run.
- Recurring obligations generate forward a bounded window, not indefinitely.
- An obligation already discharged by a **Filing** is never regenerated or reopened.
- A completed obligation is immutable history. Do not mutate past periods when a rule
  changes.

## 4. Supersession — what happens when a rule changes underneath live obligations

This is the case most implementations get wrong, and it is customer-facing.

When a Rule is superseded (closed with `effective_to`, new row inserted):

- Obligations for **past** periods keep the old rule's terms. History does not retroactively
  change.
- Obligations for **future** periods regenerate against the new rule.
- An obligation for the **current, in-flight** period needs an explicit decision — do not
  guess. Surface it: which entities are affected, what changed, and does the due date or fee
  move for them.
- Every obligation records which rule **version** produced it. Without that, we cannot
  answer "why does the product say this is due on the 30th?" — and that question will be
  asked by a customer's accountant.

If `$ARGUMENTS` is a rule id and it has been superseded, list the affected entities before
changing anything.

## 5. Tests — write these, they are the point

Table-driven, per jurisdiction:

1. Fiscal year boundary — an obligation triggered in June vs July in Bangladesh
2. Deadline landing on a Friday and on a Saturday (BD weekend), and on Saturday/Sunday for a
   Gulf jurisdiction
3. Deadline landing on a public holiday, including a multi-day holiday
4. Leap year — 29 February as both trigger and due date
5. Month-end rollover — 31 January plus one, two and three months
6. Idempotency — run generation twice, assert no duplicates
7. Supersession — past periods unchanged, future periods regenerated
8. Over-firing — an entity that should **not** match a rule generates no obligation for it
9. Missing holiday data — fails loudly rather than computing silently

## 6. The retention link

Once obligations exist, check the loop actually closes:

- Is a reminder scheduled ahead of the due date, with enough lead time to act?
- Does the reminder land in the entity's local timezone at a sensible local hour?
- Does an overdue obligation escalate, or does it go quiet?
- Can an obligation the customer cannot do themselves be converted into a **Case** routed to
  a verified Provider? That conversion is the marketplace take rate — if the path does not
  exist, say so.

## Report back

- What the engine currently does and where it is wrong
- The tests you added and which ones fail today
- Any entities affected by a supersession decision that needs a human
- Whether the obligation → reminder → Case loop is actually closed, or only the first hop
