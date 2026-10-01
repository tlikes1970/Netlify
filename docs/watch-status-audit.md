# #9 Watch status audit

## Representation inventory

| Representation | Meaning / authority | Reads, writes and compatibility |
| --- | --- | --- |
| watching | Authoritative watch status | Library list field; Firebase watchlists.movies/tv.watching; current/legacy backups. |
| wishlist | Authoritative Want to Watch status | Same local/cloud/backup paths under wishlist. |
| watched | Authoritative Watched status | Same paths under watched; ratings and episode progress are separate fields/storage. |
| not | Authoritative Not Interested status | Same paths under not; Settings management and recommendation filters read it. |
| want | Confirmed legacy persisted alias, also navigation/tab/helper key | Old flicklet:v2:saved item.status migration already mapped it to wishlist. Shared normalization now also covers v2 local load/reload and validated backup item.list. Legacy backup want bucket is accepted when wishlist is absent. Navigation keys remain unchanged. |
| custom:<id> | Legacy custom-primary representation; not a watch status | Retained for compatibility. Additive customListIds is current membership representation. Moving/upserting to any watch status retains the legacy membership. |
| Currently Watching | Display label / established Home section name | Status labels now use Watching. Home section title, its intentional Manage Currently Watching action and personality copy are preserved. No persisted string with this label was found. |
| Watching / Want to Watch / Watched / Not Interested | Canonical English UI vocabulary | Shared watchStatus labels feed primary controls, membership labels and Search display; other existing translated actions use matching English strings. Spanish translations are retained. |
| Want / Wishlist / Not | Abbreviated UI labels | Replaced on status controls, Library mobile segment and swipe destination labels. Internal wishlist and want keys remain stable. |
| Watch / Watchlist / watchlist | Natural actions, generic collection copy, watchlists cloud container | Not persisted watch statuses in the current model. Generic marketing/personality wording and video Watch links are preserved. |
| not-interested / card:notInterested / onNotInterested | Action identifiers/events/handlers | Map to persisted not, not separate statuses. |
| tab-watching / tab-want / tab-watched / tab-not / home-cw-preview | Card context/helper identifiers | Not stored watch statuses; left intact. |
| none / empty string | Helper absence/selection placeholder | Not a stored watch status. |
| Already Watched / Mark Watched / Mark as Watched / Start Watching | Informational or natural action text | Not persisted status values. Start Watching must target watching. |
| Remove from Library / remove / delete | Removal action | Deletes a library record through existing confirmation, never converted to not. |
| Returning Series / Ended / In Production / Canceled / Planned | TV production metadata | showStatus is separate from watch status; untouched. |

No additional persisted spelling/casing aliases were confirmed. Unknown values are not silently coerced; backup validation continues to reject unsupported statuses. No database rename or broad migration was performed.

## Persistence and corrections

Local authority remains flicklet.library.v2 keyed by mediaType:id, with list, customListIds and user metadata. The old flicklet:v2:saved array uses kind/status and is migrated through the existing path. Firebase users/{uid} watchlists has movies/tv buckets watching, wishlist, watched, not plus customItems/customLists. Current backup schema 1 uses library entries; older version 2.0 backups use grouped watchlists. Existing cloud serialization/bucket semantics stay intact.

Corrections: canonical status labels in primary selector/toasts, Library tab/header, desktop/condensed controls, swipe labels, custom-list name helper, Search fallback display, statistics/share headings, help and onboarding. Search upper-right dots, Manage and destination menus are unchanged. The compact Start Watching fallback no longer invokes Want to Watch; the compatibility Discovery swipe helper likewise targets watching. Swipe helper hints now describe the actual configured directions. The helpers in swipeMaps currently have no production callers; they are retained compatibility code rather than a second active swipe implementation.

Library.move and Library.upsert preserve user ratings, notes, tags and additive memberships. They now also convert legacy custom-primary membership to additive membership when assigning Not Interested or another watch status. Custom membership counts are not decremented during that conversion.

## Transition surface audit

- Home Currently Watching: existing management/navigation action, primary status selector, overflow and swipe handlers retained.
- Home For You: Want to Watch / Watched retained; Not Interested existing overflow handler targets not.
- Library Watching/Want/Watched: two contextual destination buttons, desktop actions, overflow and swipe destinations retained. Six pairwise normal transitions are tested.
- Custom lists: status selector/destination buttons independent of multiple memberships; legacy custom-primary transitions covered for move/upsert.
- Discovery: Want to Watch, Watching handler, Watched with optional rating / Not now, and Not Interested retained. Recommendation ranking remains unchanged.
- Search: untracked destinations remain in overflow; tracked canonical badge + Manage preserved. Search Manage and desktop controls retain their destinations. Not Interested uses not; whole-library removal keeps its separate confirmation.
- CardV2/mobile cards, legacy Card/SearchCard, state/actions event handlers, compact primary/overflow helpers and title-detail controls were inspected. PrimaryStatusControl remains the three normal selectable destinations, not an invented fourth option.
- Not Interested: tab-not swipe supports return to Watching; existing Search/primary controls can assign normal destinations. No new transitions or restoration chooser were invented.

## Not Interested and #16 boundary

Not Interested is real stored data, not deletion. It is hidden from normal Library status tabs, available through Settings management, and excluded by Discovery/Home genre filtering and scored negatively by discovery preferences. Its existing management modal only offers whole-library removal; that button now explicitly says Remove from Library. A dedicated restore interface remains #16. The legacy custom membership preservation gap is corrected here. No feature redesign was performed.

## Ratings, removal and backups

Ratings remain on library records and affect Discovery genre/ranking; Home For You stays configured genre rows. Watched optional-rating interaction and episode progress behavior remain unchanged. Whole-library removal still removes the entry using existing semantics and is not a watch status. Current schema 1 and legacy 2.0 backups remain supported. Legacy want item values/bucket and optional not bucket normalize before mutation; unsafe shapes still fail before any writes. No identity, entitlement or restore transaction behavior changed.
