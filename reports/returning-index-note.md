Returning tab Firestore index note

If/when the Returning smart view is backed by Firestore queries rather than local storage, create a composite index for the common query shape:

- Collection: user library items
- Where: userId == {uid} AND status == "Returning Series" AND archived == false

Suggested index (Firestore):

- Collection group: libraryItems
- Fields order:
  - userId Asc
  - status Asc
  - archived Asc

Add to your Firestore indexes definition file when you migrate this view to remote queries.


