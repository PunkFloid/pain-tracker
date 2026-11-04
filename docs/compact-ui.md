# Compact analytics interface

User preference: small, simple, tabular presentation; avoid large per-food cards and explanatory paragraphs.

Primary navigation contains only pain/medication logging, food diary and statistics. The former standalone relationships screen is the Episodes view within Statistics. Statistics has three subviews: Before pain, After food and Episodes.

Use native tables with concise headers and touch-sized name buttons. Show full names, observation groups, amounts, recipe ingredients and episode lists only after expanding a row. Long names are clamped to two lines in the collapsed table but remain fully available in the detail and accessible button label.

Before-pain counts still include possible overlaps and use the existing eligible-episode denominator. Day counts describe all imported diary dates. After-food counts describe observation groups, not individual servings. These rules are unchanged; detailed methodology remains in follow-up.md and the existing engines/tests.

No data model or calculation code changes are part of this UI update. Verify mobile table layout, row expansion, keyboard access and all three subviews after deployment.
