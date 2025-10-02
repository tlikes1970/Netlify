# Exact text dump from Flicklet_Home_Rails_With_Curated.docx

Flicklet – Home Rails (Currently Watching, Up Next, Curated)

This document captures the final locked behavior and HTML mockups for the Flicklet Home page rails:- Currently Watching- Up Next- Curated RowsAll rails are horizontally scrollable with compact cards that emphasize usability and clarity.






General Behavior

• All rails use horizontal scroll with snap alignment.

• Each card includes a poster thumbnail at the top with rounded corners.

• Text elements (title, metadata, air date, blurb) are centered below the poster.

• Cards are compact (200–220px wide) to fit multiple per viewport.

Currently Watching Rail

• Card shows poster thumbnail, title, and metadata line (Genre • SXXEXX).

• No next-air-date on these cards (handled in Up Next rail).

• Each card contains a two-row button grid:

•   - Row 1: Want to Watch | Watched

•   - Row 2: Not Interested | Delete

• No extra free/pro features, no progress summary, no overview text.

Up Next Rail

• Card shows poster thumbnail, title, and metadata line (Genre • SXXEXX).

• Includes a single line for next air date: “Up Next: [Date]”.

• No buttons or actions; these cards are informational only.

Curated Rows Rail

• Cards show poster thumbnail, title, year, and genre.

• Each card includes a 'Where to Watch' line pulled from TMDB data.

• Short curator blurb (two lines max) for context.

• Exactly one action: Want to Watch button.

• Poster click opens TMDB in a new tab.

• No Pro/Free split, no extra actions.

HTML Mockup

Final HTML mockup for all three rails is included below:

<!DOCTYPE html><html lang="en"><head>  <meta charset="utf-8" />  <meta name="viewport" content="width=device-width, initial-scale=1" />  <title>Flicklet – Home Rails (Currently Watching + Up Next + Curated)</title>  <!-- Styles omitted for brevity --> </head><body>  <!-- Currently Watching, Up Next, Curated Rows HTML as mocked in canvas --></body></html>










