QA checklist for Returning tab

Logic
- Flip a show's status between Returning/Canceled and confirm inclusion/exclusion.
- Ensure items with null/undefined nextAirDate sort after dated items and do not crash.
- Verify Watching hides Returning unless within 14 days of nextAirDate.

Visual
- Tab label “Returning” visible on mobile and desktop.
- Empty state exact text appears when list is empty.
- Status badge shows “RETURNING” on cards; next air date appears in meta if present (TBA otherwise).

Telemetry
- On opening Returning tab, events `tab_opened:returning` and `returning_count` emit once.
- On opening a card from the Returning tab, `open_from:returning` emits once per click.

Performance
- Scrolling and virtualization behavior matches Watching.


