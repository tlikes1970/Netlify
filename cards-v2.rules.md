# Cards V2 – Canonical Rules (v1)
- One rendering system: Cards V2 (card-v2-*).
- All data entering the card layer MUST pass through a single adapter: adapters/card-data-adapter.js.
- Actions emitted by cards MUST use the CardActionEvent and be handled centrally by actions/card-actions.js.
- Disallowed lists: "not-interested".
- Posters: accept http(s), data:, blob:. Resolve TMDB relative paths to w342.
- Never call window.Card or window.createCardData directly after Milestone B.