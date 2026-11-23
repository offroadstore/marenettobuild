---
name: Internal access testing
description: Separate application test gates from release approvals and email configuration.
---

Do not infer a named supplier or an SMTP dependency from a generic approval flag. The user repeatedly clarified that the configured email is unrelated to role/private-file verification.

**Why:** A blanket application gate was mistakenly described as a known vendor approval requirement, despite no documented supplier list. This confused the user and delayed the actual tests.

**How to apply:** Explain only observed gate behavior. Keep mail configuration untouched during access-control testing. Explicitly authorized synthetic tests may use temporary development-process overrides, with restoration and fixture cleanup; that is not approval of a production release or external data processing.

Callback-request testing has a stricter boundary: do not change approval flags
or secrets, and do not send real test emails. Use isolated synthetic fixtures
and an injected local mail transport instead.

**Why:** The callback feature was explicitly commissioned without permission to
relax privacy, supplier, testing or email-delivery gates. Earlier authorization
for temporary internal-access tests is not blanket authorization for this flow.

**How to apply:** Keep callback delivery simulations separate from actual SMTP
acceptance and mailbox receipt; a successful simulated test does not authorize
live delivery or establish legal/linguistic release approval.
