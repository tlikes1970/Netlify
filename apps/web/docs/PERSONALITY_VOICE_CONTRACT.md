# Flicklet Personality Voice Contract (Phase 2)

**Status:** Approved direction — locked for content review and rewrite.  
**Scope:** Personality copy only. Does not change runtime behavior until implementation phase.  
**Source of truth for lines:** `apps/web/src/data/flickletContent.ts` (Phase 1 Flicklet voice).

---

## Active personality surfaces

Personality is concentrated in **four areas only**:

| # | Surface | Resolver key(s) | UI location |
|---|---------|-----------------|-------------|
| 1 | **Home Header** | `home.header` (+ signal sub-pools) | `SnarkDisplay`, Settings personality preview |
| 2 | **Home Marquee** | `home.marquee` | `HomeMarquee` ticker on Home |
| 3 | **Empty States** | `empty.watching`, `empty.want`, `empty.watched`, `empty.upnext`, `empty.customList` | Library lists, Home rails, My Lists |
| 4 | **For You intros** | `discover.rowIntro` | `HomeForYouSection` row intro lines |

All other app areas stay **standard, clear, and functional** — no personality rewrite in Phase 2 unless explicitly scoped later.

### Mostly functional (no personality rewrite)

- Delete confirmations
- Error messages (network, API, crash)
- Trial / read-only banners
- Purchase / billing messages
- Settings explanations
- Data loss warnings
- Auth / sign-in messages
- Search result errors
- Not Interested empty state (currently hardcoded)

---

## Personality levels

Settings control: **Minimal (1)** · **Standard (2, default)** · **Maximum (3)**.

### Minimal

**Purpose**

- Safe, clear, church-friendly, elder-friendly.
- No sarcasm.
- No profanity.
- No judgment.
- No weirdness.
- No “called out” feeling.

**User reaction:** *Helpful.*

**Tone:** Direct · Calm · Plain · Supportive

**Example:**  
> Nothing in progress right now.

**Runtime notes**

- Home Marquee is **suppressed** (empty pool).
- Home Header uses reduced signal subsets at level 1.

---

### Standard

**Purpose**

- Default Flicklet brand voice.
- Witty, dry, observant, memorable.
- More personality than typical apps.
- No profanity.
- Safe for broad users but still fun.

**User reaction:** *That’s clever.*

**Tone:** Dry humor · Smart observations · Light roasting · Shareable · Not cruel

**Example:**  
> Nothing in progress. The couch remains undefeated.

**Phase 2 direction**

- **Standard should feel like the old aspirational Maximum.**
- Current Phase 1 Standard lines skew observer/reporting — rewrite should increase wit without crossing into profanity.

---

### Maximum

**Purpose**

- The app finally says what everyone is thinking.
- Meaningfully different from Standard — not “Standard plus one spicy line.”
- Screenshot-worthy.
- Sharper, weirder, more absurd, more fearless.
- Occasional profanity allowed — for punch, not filler.

**User reaction:** *Did this app really say that?*

**Tone:** Extremely dry · Sharp · Self-aware · Absurd · Occasionally profane · Borderline but not hateful

**Good example:**  
> Your Want list has become a retirement plan. Hope you packed Depends and a will.

**Bad example:**  
> You’re an idiot for not watching anything.

**Rule:** Maximum should be **fearless, not cruel.**

#### Allowed targets

- Backlogs
- Streaming culture
- Recommendation engines
- Binge habits
- Decision paralysis
- Unfinished shows
- Television itself
- The absurdity of treating TV like project management

#### Avoid

- Slurs
- Protected-class insults
- Body/appearance insults
- Religion attacks
- Political attacks
- Health/mental-health cruelty
- Directly calling the user stupid, ugly, broken, pathetic, etc.
- Graphic sexual content
- Mean-spirited personal attacks

---

## Voice ladder

| Level    | User reaction                 | Profanity  | Bite   |
| -------- | ----------------------------- | ---------- | ------ |
| Minimal  | Helpful                       | Never      | None   |
| Standard | That’s clever                 | Never      | Light  |
| Maximum  | Did this app really say that? | Occasional | Strong |

---

## Quality bar (acceptance for rewrite)

1. Users can **immediately tell Standard from Maximum** on the same surface.
2. Minimal never feels sarcastic or judgmental.
3. Standard never needs profanity to land.
4. Maximum adds **new lines and new energy** — not just adjectives on Standard.
5. Each surface maintains enough lines per level to avoid immediate repeat (see review doc for pool sizes).
6. Line IDs (`h-gs-1`, `e-w-m2`, etc.) are preserved or explicitly mapped when text changes.

---

## Technical reference (implementation phase — not active yet)

| Item | Location |
|------|----------|
| Phase 1 line pools | `apps/web/src/data/flickletContent.ts` |
| Resolver | `apps/web/src/lib/flickletPersonality.ts` → `resolveFlickletLine()` |
| Marquee rotation | `getFlickletMarqueeMessages()` |
| Level setting | `settings.personalityLevel` (1 \| 2 \| 3) |
| Legacy character packs | `apps/web/src/data/personalities.ts` — **separate system; Phase 2 TBD** |

### Pool merge rules (current runtime)

- **Level 3 (Maximum):** `maximum` tier lines + `standard` tier lines merged for empty states, For You, generic header, and marquee.
- **Level 2 (Standard):** `standard` tier only (plus full signal pools for header).
- **Level 1 (Minimal):** `minimal` tier only; header signals use truncated subsets.

---

## Related documents

- Line inventory for review: [`PERSONALITY_LINE_REVIEW.md`](./PERSONALITY_LINE_REVIEW.md)
- Editable CSV (Phase 1): [`personality-line-review.csv`](./personality-line-review.csv)
- Legacy CSV: [`personality-line-review-legacy.csv`](./personality-line-review-legacy.csv)

---

*Last updated: Phase 2 prep — voice contract only; no app copy or behavior changed.*
