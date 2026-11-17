# Food Tracker suggestions v1

Suggestions never modify food, pain or medication records. Manual approval is required for every category change. Existing deferred items without a manual category are skipped.

Only observed, elapsed windows with status free or pain enter proposal evidence. Windows with pain already in progress at consumption, running windows and unknown windows are excluded. Completed untreated pain counts as free according to the user policy. The table keeps its existing broader counts.

OK: at least 10 completed consumptions, at least 14 calendar days between first and last completed consumption, at least 90% free. Suspect: at least 3 distinct treated pain episode IDs and a greater pain-window fraction than the comparison baseline. Suspect takes priority if both conditions hold.

Comparison baseline: every observed imported meal slot contributes at most one window, not one per food. It uses the same eligibility and 48-hour logic, with a temporary marker item in memory. Baseline pain fractions are calculated separately per meal category and averaged using the candidate food's completed category frequencies. This compares similar meal-time anchors, not randomized or independent control periods; no causal risk estimate is claimed. Overlapping windows are not independent evidence. No baseline means no suspect proposal.

Manually suspect foods are not proposed as OK. An OK food is offered recheck only when the suspect condition holds and a new treated episode appears beyond the accepted snapshot. Older manual OK entries use status-change time or legacy update time as fallback. Applying recheck returns the food to watch.

Dismissal stores the evidence fingerprint. For OK it changes on a new or corrected completed outcome; for suspect/recheck it changes on a changed set of distinct associated treated episodes. Pending windows and passage of time alone do not resurface a dismissal. A manual category change also changes proposal context. Notes do not reset classification time. Review data, dismissal data and rule constants are included in analysis exports. No source PDF or personal database is committed.
