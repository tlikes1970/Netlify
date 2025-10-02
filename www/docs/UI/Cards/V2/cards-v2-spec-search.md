# Exact text dump from Flicklet_Search_Card_Mockup.docx

Flicklet – Search Result Card Mockup (Locked)

Behavior & Rules (Locked)

• Poster click opens TMDB (new tab).

• No Pro-only features on Search cards (keep discovery clean).

• Primary actions: Want to Watch, Currently Watching, Watched, Not Interested, Review/Notes, Add Tag.

• Utility actions (right side): Similar To, Refine Search.

• On add-to-list (e.g., Want to Watch), remove the item from the search results immediately.

• Rating stars are inline (enlarged) and user-owned; no global aggregates shown.

• Where to Watch is a simple line under metadata (source: TMDB).

• No episode progress UI on Search cards.

• Not Interested stores to a hidden list managed in Settings and should influence Discover logic (exclude).

HTML Mockup

Full HTML mockup for the Search Result card (poster left, content right, TMDB nav on poster click, core actions on the left, utility discovery actions on the right).

<!DOCTYPE html><html lang="en"><head>  <meta charset="utf-8" />  <meta name="viewport" content="width=device-width, initial-scale=1" />  <title>Flicklet – Search Result Card Mockups (Refined)</title>  <style>    :root{      --bg:#0f1115; --card:#171a21; --muted:#a9b3c1; --text:#e6eaf0; --line:#242a33; --accent:#4da3ff;      --btn:#232a34; --btn2:#1c222b; --shadow:0 6px 24px rgba(0,0,0,.35);    }    body{margin:0;background:var(--bg);color:var(--text);font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif}    .wrap{max-width:1000px;margin:24px auto;padding:0 16px 64px}    h1{font-size:22px;margin:8px 0 24px}    .card{position:relative;display:flex;background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:var(--shadow);margin-bottom:24px;transition:transform .2s}    .card:hover{transform:translateY(-2px)}    .poster{flex:0 0 120px;aspect-ratio:2/3;background:#0b0d12 url('https://placehold.co/240x360?text=Poster') center/cover no-repeat;cursor:pointer}    .content{flex:1;padding:14px 16px;display:flex;flex-direction:column;position:relative}    .title{font-weight:700;font-size:16px;margin-bottom:4px}    .meta{color:var(--muted);font-size:12px;margin-bottom:4px}    .overview{color:var(--muted);font-size:13px;margin:6px 0 10px;max-height:3.2em;overflow:hidden}    .where{font-size:12px;color:var(--accent);margin-bottom:6px}    .badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}    .badge{border:1px solid var(--line);border-radius:6px;padding:2px 6px;font-size:11px;color:var(--muted)}    .rating{display:flex;align-items:center;gap:4px;margin:6px 0}    .rating span{font-size:20px;color:var(--accent);cursor:pointer}    .actions{margin-top:auto;display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:center}    .free-actions{display:flex;flex-wrap:wrap;gap:8px;padding:8px;border-radius:8px;border:1px dashed var(--line)}    .utility-actions{display:flex;gap:8px}    button{background:var(--btn);color:var(--text);border:1px solid var(--line);padding:6px 10px;border-radius:8px;font-size:12px;cursor:pointer}    button.secondary{background:var(--btn2)}  </style></head><body>  <div class=\"wrap\">    <h1>Flicklet – Search Result Card Mockup</h1>    <!-- Search Result -->    <div class=\"card\">      <a href=\"https://example.com/tmdb\" target=\"_blank\" rel=\"noopener noreferrer\"><div class=\"poster\" title=\"Opens in TMDB\"></div></a>      <div class=\"content\">        <div class=\"title\">Movie Title (2024)</div>        <div class=\"meta\">Drama • Runtime: 120m</div>        <div class=\"where\">Where to Watch: Netflix</div>        <div class=\"overview\">Quick synopsis shown here. Limited to a few lines for scanability.</div>        <div class=\"badges\"><span class=\"badge\">NEW</span><span class=\"badge\">TRENDING</span></div>        <div class=\"rating\">★ ★ ☆ ☆ ☆ <span class=\"muted\">(Your rating)</span></div>        <div class=\"actions\">          <div class=\"free-actions\">            <button>Want to Watch</button><button>Currently Watching</button><button>Watched</button><button>Not Interested</button>            <button>Review/Notes</button><button>Add Tag</button>          </div>          <div class=\"utility-actions\">            <button class=\"secondary\">Similar To</button>            <button class=\"secondary\">Refine Search</button>          </div>        </div>      </div>    </div>  </div></body></html>





























































