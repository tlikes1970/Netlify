# List Membership Indicators - Forensic Analysis Prompt

**Purpose:** READ-ONLY diagnostic of how list membership is determined and displayed across the app  
**Status:** Ready to run in Cursor

---

## Cursor Prompt

Paste this directly into Cursor:

```text
You are working in the Flicklet codebase.

Goal of THIS step only:

Perform a focused forensic analysis of **list membership indicators** across the app.
Do NOT change any code. Only read, trace, and report.

We care about:
- Where the app decides "this title is in a list"
- How that status is surfaced visually on cards/rows
- Where things can fall out of sync (backend vs UI)

=====================================================================
FILES TO ANALYZE (READ-ONLY)
=====================================================================

Start with:
- apps/web/src/lib/storage.ts (Library management)
- apps/web/src/lib/customLists.ts (Custom list management)
- apps/web/src/search/SearchResults.tsx (Search result cards)
- apps/web/src/components/cards/CardV2.tsx (Main card component)
- apps/web/src/components/cards/TabCard.tsx (Tab page cards)
- apps/web/src/pages/ListPage.tsx (Tabbed list pages)
- apps/web/src/components/rails/HomeYourShowsRail.tsx (Home rail)
- apps/web/src/components/rails/HomeUpNextRail.tsx (Up Next rail)

Follow imports ONLY when needed to understand how membership is computed or displayed.

=====================================================================
PART A – SOURCE OF TRUTH FOR MEMBERSHIP
=====================================================================

1. Identify the **single source of truth** (or current best approximation) for:
   - Which lists a title belongs to
   - How "Watching / Want / Watched" are derived

   Answer:
   - Where is the canonical data structure for:
     - Library entries
     - Custom list membership
   - Which functions are responsible for:
     - Adding/removing a title from a list
     - Reading membership

2. For each of these functions (in customLists/Library):
   - List:
     - Function name
     - File + line range
     - Inputs
     - Outputs
   - Note:
     - Whether they are used consistently across the app
     - Any duplicated logic found elsewhere

=====================================================================
PART B – WHERE MEMBERSHIP IS DISPLAYED
=====================================================================

For each major UI surface, document how membership is calculated and shown:

3. Search results:
   - File: SearchResults.tsx
   - Find:
     - How it determines if a result is already in the library
     - How it decides which status to show (Watching/Want/Watched/None)
     - Where the pill/badge/component is rendered
   - Call out any:
     - Inline logic duplicating Library/customLists
     - Conditionals that differ from other surfaces

4. Rails (HomeYourShowsRail, HomeUpNextRail, and any others using CardV2):
   - For each rail:
     - How are items fetched (selector or query)?
     - Where is membership passed into CardV2?
     - Does CardV2 decide status itself, or is it all via props?

5. Tabbed pages (e.g., Watching/Want/Watched tabs):
   - File: TabCard.tsx and ListPage.tsx
   - Identify:
     - How each tab decides which list to show
     - How membership is visually indicated (or implicitly assumed)
   - Note any differences in:
     - Label text
     - Icon styles
     - Presence/absence of membership pill

=====================================================================
PART C – VISUAL RULES & INCONSISTENCIES
=====================================================================

6. For each card component (CardV2, TabCard, any others showing membership):

   Document:
   - Exactly which visual elements indicate membership:
     - Pill text (e.g., "Watching", "Want to watch")
     - Icons
     - Sub-labels
     - Any badges for "In X lists"

   - How the component decides:
     - When to show a membership indicator
     - Which text to use
     - What happens when a title is in:
       - Multiple lists
       - No lists

7. Explicitly list all differences you find between:
   - Search results vs rails vs tabbed pages:
     - Text differences (e.g., "Want" vs "Watchlist")
     - Missing indicators in any view
     - Conflicting logic (e.g., one area uses "Watching", another thinks it's "Want")

=====================================================================
PART D – EDGE CASES & FAILURE MODES
=====================================================================

8. Identify at least 3 edge cases where the current implementation can show:
   - A title that *is* in a list, but appears with:
     - No membership indicator
     - A wrong indicator
   - A title that is in multiple lists, but UI only reflects one (or an inconsistent one)

   For each:
   - Describe the scenario
   - Point to the specific files/lines involved
   - Explain why the mismatch happens (different logic, missing prop, etc.)

=====================================================================
PART E – SYNTHESIZED FINDINGS
=====================================================================

9. Final report:

   A) **Source of truth**
      - Where membership is really defined today
      - Whether it is centralized enough

   B) **UI surfacing**
      - Which areas are consistent
      - Which areas are out of sync

   C) **Fix targets**
      - List 3–5 specific, surgical change targets:
        - e.g., "CardV2 should accept a normalized membership object instead of recomputing"
        - "SearchResults should rely on Library helper X instead of inline logic"
      - Do NOT implement these fixes yet; just list them.

You MUST NOT change any code.

Output should be a structured, file-referenced forensic report similar to the previous ones (FlickWord, Trivia, Returning).
```

---

## Expected Output

The forensic report should identify:

1. **Where membership is stored** (Library, customLists, etc.)
2. **How it's computed** in each UI surface
3. **Visual inconsistencies** (different labels, missing indicators)
4. **Edge cases** (titles in lists but not showing, wrong indicators)
5. **Fix targets** (specific files/functions to modify)

---

## Next Steps After Report

Once you have the forensic report:

1. Review the findings
2. Identify the highest-impact inconsistencies
3. Create implementation plan for surgical fixes
4. Implement changes to centralize membership logic
5. Ensure consistent visual indicators across all surfaces

---

**Ready to run in Cursor!** ✅






