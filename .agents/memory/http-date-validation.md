---
name: HTTP date validation
description: Date-only HTTP query values can disagree with generated runtime schema types.
---

Do not assume a generated date validator coerces HTTP strings merely because
the generated client represents dates as strings. Validate the wire format and
calendar date first, then adapt it to the runtime schema's expected type.

**Why:** The generator emitted date-object validators for date-only query
parameters. Typechecking, unfiltered requests and tests rejecting invalid dates
all passed while every valid date filter failed at runtime.

**How to apply:** Inspect generated validators when adding date filters. Include
positive tests for start-only, end-only and inclusive ranges, including any
export endpoint sharing those filters. Keep the adaptation at the HTTP boundary
rather than editing generated files.
