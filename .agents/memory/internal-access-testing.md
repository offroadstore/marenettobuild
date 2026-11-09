---
name: Internal access testing
description: Separate application test gates from release approvals and email configuration.
---

Do not infer a named supplier or an SMTP dependency from a generic approval flag. The user repeatedly clarified that the configured email is unrelated to role/private-file verification.

**Why:** A blanket application gate was mistakenly described as a known vendor approval requirement, despite no documented supplier list. This confused the user and delayed the actual tests.

**How to apply:** Explain only observed gate behavior. Keep mail configuration untouched during access-control testing. Explicitly authorized synthetic tests may use temporary development-process overrides, with restoration and fixture cleanup; that is not approval of a production release or external data processing.
