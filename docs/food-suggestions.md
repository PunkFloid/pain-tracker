# Food Tracker suggestions v2

Suggestions never modify food, pain or medication records. Manual approval is required for every category change. Existing deferred items without a manual category are skipped.

Only observed, elapsed windows with status free or pain enter proposal evidence. Windows with pain already in progress at consumption, running windows and unknown windows are excluded from both numerator and denominator. Completed untreated pain counts as free according to the user policy. The table keeps its existing broader counts.

OK is unchanged: at least 10 completed consumptions, at least 14 calendar days between first and last completed consumption, at least 90% free. Suspect: strictly more than 50% of completed evaluable consumptions have a treated pain outcome. Exactly 50% does not qualify. There is no minimum number of consumptions or distinct episodes: 1/1 can qualify, and multiple consumption windows may relate to the same episode. Distinct episode count remains context, not a gate. UI shows the percentage and raw numerator/denominator.

The baseline is context only, never an additional gate, and may be absent. Every observed imported meal slot contributes at most one comparison window, not one per food. Baseline pain fractions are matched by meal category and weighted by the candidate food's completed category frequencies. Overlapping windows are not independent evidence; no causal probability is claimed.

Manually suspect foods are not proposed as OK. An OK food is offered recheck only when its completed consumption pain fraction exceeds 50% and a new associated treated episode appears beyond the accepted snapshot. Older manual OK entries use status-change time or legacy update time as fallback. Applying recheck returns the food to watch.

Dismissal fingerprints now include all completed outcomes for every proposal type: denominator changes matter to a percentage rule. Pending windows and a ticking clock alone do not resurface a dismissal, but completion or correction can. A category change changes context; notes do not reset classification time. The rule version changes to 2, so proposals dismissed under v1 may be offered again once under the new policy. Existing review and dismissal records are retained. Analysis export already reads the updated FOOD_RULES constants.
