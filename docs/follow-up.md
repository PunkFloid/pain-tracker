# Follow-up, automatic defaults and interface conventions

User-facing screens stay concise. Detailed methodology belongs here and in tests, not in repeated paragraphs on each card.

## Requested automatic policy

- Dates through 2026-10-28 inclusive default to no headache record. From 2026-10-29 through the current local date, absence of a recorded pain episode defaults to pain-free. This covers 29, 30, 31 October and 1, 2, 3 November without daily confirmation. Future dates are not assumed pain-free ahead of time.
- These are evaluated defaults, not background database writes. Days progress automatically with the calendar and are resolved whenever viewed or analyzed.
- Any imported meal slot for a date makes that food diary complete by default, regardless of number of meals, category count or date. A date without food import is not automatically complete. Existing food records are not rewritten or renamed.
- Explicit headache/food overrides have priority over defaults, except actual pain episodes always override a pain-free label. Unknown and incomplete are available as deliberate overrides. Returning a field to auto restores its default policy. Current-day overrides are allowed; future edits are rejected.
- The original version-1 unknown fields were the previous unconfirmed defaults. They now resolve as auto without rewriting the stored record. Explicit legacy none/pain/complete/incomplete choices stay explicit. New saves use version 2, so a newly selected unknown remains a genuine manual exception. There is no storage schema upgrade.
- Imported completeness is not invalidated by quantity changes or timezone metadata; users can mark incomplete themselves. Snapshot/zone metadata remains available for audit and compatibility. Local dates and device timezone still define meal intervals.

## Follow-up

- Results describe observations, not diagnosis, causality or proof of safety. Internally assumed-free is distinct from user-confirmed-free. No automatic food exclusions or risk ratios are implemented.
- Each known consumption covers the earliest possible meal time through 48 real hours after the latest time, with an exclusive end. Duplicate servings in a date/category retain amounts but create only one occasion.
- Overlapping intervals for the same identity are merged. Groups before the headache-policy start are kept separate from groups beginning on/after that date, so old unknown history cannot absorb the newly tracked period. Group counts are not independent experiments.
- Recorded pain intersecting the interval gives pain status, with already-ongoing pain distinguished. Otherwise wait until the full interval ends.
- For elapsed intervals, automatic or confirmed pain-free dates are accepted. Explicit unknown or unlocated manually reported pain produces unknown. Pre-cutoff dates need an explicit override to be considered covered. A known pain outside the exact interval does not turn the interval into pain; an explicitly unknown boundary day remains unknown.
- Automatic dates can close elapsed windows during the current day without waiting for midnight. Future windows still run until their actual end.
- Food completeness is separate from known consumption and is not a six-meal prerequisite. Prospective naming rules and protection of existing imported dates are unchanged.

Backup/restore remains deferred by user choice. Existing separate exports do not yet include daily checks. Validate date boundaries, legacy compatibility, manual exceptions, real pain priority and raw-food immutability before deployment.
