# Prospective naming rules

User requirement: existing imported days and their historical name assignments must not be changed. Rules apply only when importing dates not already present in the diary. New means not yet stored, not necessarily later than today's date.

- No migration of existing slots is performed.
- An existing date is skipped as a whole during PDF import, including incoming categories missing from the stored day. There is no replacement checkbox. A newly saved date also becomes protected on subsequent imports.
- prepareNewDays clones and annotates only unseen dates. appendNewDays repeats the date guard. The IndexedDB write transaction verifies the complete expected state before appending and never replaces existing slots.
- Rules are exact name matches after NFC, case and whitespace normalization. No substring matching, brand inference, recipe inference, quantity conversion or lactose inference is used. There are no built-in mappings.
- A rule applies to matching top-level entries and explicit recipe ingredients. Original name, amount and recipe data are retained.
- Each mapped new item receives a frozen version-1 tracking id and label at preview/import time. Subsequent edits or removal of the rule affect only later unseen dates. Previewed mappings do not change silently while the preview is open.
- Analytics never look up live rules. They read only frozen per-record metadata. Existing records without tracking metadata retain raw-name grouping; mapped groups use a separate identity namespace and a visible 'skupina' suffix. Therefore a new mapped group does not absorb a same-named historical raw group. Internal row keys are not persisted.
- Naming rules are stored locally in pain-tracker-names / rules. Existing food, pain, daily-check and original PDF stores keep their schemas. New optional item metadata is backwards compatible.
- JSON food export retains frozen metadata, but the naming-rule dictionary is not part of that export. Unified backup/restore remains deferred.

Validate protection of history, mixed old/new imports, missing categories of old days, unchanged original amounts, frozen identities and separation of raw/mapped groups. Then verify build, lint and the UI in GitHub Actions/Safari.
