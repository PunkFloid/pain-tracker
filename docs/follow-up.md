# Follow-up and interface conventions

## Interface preference

Keep the user-facing interface concise: results, controls and actionable short errors. Do not repeat scientific caveats or implementation explanations on every card. Put detailed rules here and in code/tests. Do not remove data validation merely to shorten the interface.

## Follow-up rules

- This is descriptive observation, not a diagnosis, proof of safety or causal attribution. No automatic exclusions are implemented.
- Names are matched by NFC, whitespace and case only, without recipe/brand or synonym inference. Ingredient mode uses explicit recipe ingredients only.
- One occurrence means one food name within one date/category. Repeated amounts are retained but do not create extra occasions.
- A meal has its configured local earliest/latest time. The conservative follow-up interval starts at the earliest time and ends 48 real hours after the latest time; the upper bound is exclusive.
- Overlapping intervals for the same food are transitively merged into one observation group. Counts describe groups, not independent experiments or a per-serving probability. Daily consumption can produce one long group.
- Any recorded pain overlapping a group produces pain status. Pain already present before the group is explicitly distinguished in the detail. A pain record can be known before the observation period closes.
- Otherwise the group remains running until its full interval closes.
- A closed group is free only when every calendar day touched by the full interval has a currently valid, explicit pain-free check. Whole-day confirmation is conservative even for partially covered boundary days. Contradictions, missing checks, a positive daily check without an episode, or a changed timezone produce unknown status.
- Food completeness is separate. Incomplete food logs do not erase known consumption. Follow-up does not require six meals or completeness of subsequent food logs.
- Daily checks are re-assessed against current pains; no absence is inferred from a missing episode. No risk ratios or controls are calculated here.
- Current device timezone is used. The overview refreshes its clock once a minute and reloads data on opening. Existing statistics keep their previous count semantics.

The backup/restore work is deferred by user choice. Existing separate exports do not yet include daily checks. No storage schema migration is needed for this feature.
