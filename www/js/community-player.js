(function mountCommunityPlayer() {
  const rootId = "community-player";
  const LEGACY_SELECTORS = [
    "#community-content",
    ".community-left",
    ".player-placeholder",
    ".community-player-placeholder",
    ".loading-spinner"
  ];

  function ensureRoot() {
    let el = document.getElementById(rootId);
    if (!el) {
      el = document.createElement("section");
      el.id = rootId;
      el.setAttribute("aria-label", "Community Player");
      document.body.appendChild(el);
    }
    return el;
  }

  function removeLegacy() {
    LEGACY_SELECTORS.forEach(sel =>
      document.querySelectorAll(sel).forEach(n => n.remove())
    );
  }

  async function fetchSeed() {
    const res = await fetch("/data/community-seed.json", { cache: "no-store" });
    if (!res.ok) throw new Error("seed fetch failed");
    return res.json();
  }

  function getDailyCardIndex(cards) {
    // Get today's date as YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    // Use date as seed for consistent daily rotation
    const dateSeed = new Date(today).getTime();
    // Return index based on day of year (0-6 for 7 cards)
    return Math.floor(dateSeed / (1000 * 60 * 60 * 24)) % cards.length;
  }

  function render(root, payload) {
    const cards = payload?.rotation || [];
    if (cards.length === 0) {
      root.innerHTML = `<div class="c-empty" role="status">Community features are coming soon.</div>`;
      return;
    }
    
    // Get today's card index
    const dailyIndex = getDailyCardIndex(cards);
    const dailyCard = cards[dailyIndex];
    
    root.innerHTML = "";
    
    // Render only the daily card
    const c = dailyCard;
    const card = document.createElement("article");
    card.className = `c-card type-${(c.type || "").toLowerCase()}`;
    card.setAttribute("tabindex", "0");
    if (c.attribution?.watermark) card.dataset.watermark = c.attribution.watermark;

    let mediaEl = "";
    if (c.media?.kind === "image" && c.media.src) {
      mediaEl = `<img src="${c.media.src}" alt="${c.accessibility?.alt || ""}" />`;
    } else if (c.media?.kind === "video" && c.media.src) {
      const autoplay = c.media.autoplay ? "autoplay" : "";
      const muted = c.media.muted ? "muted" : "";
      const poster = c.media.poster ? `poster="${c.media.poster}"` : "";
      mediaEl = `<video ${autoplay} ${muted} ${poster} playsinline>
          <source src="${c.media.src}" type="video/mp4">
        </video>`;
    }

    const subtitle = c.subtitle ? `<p class="subtitle">${c.subtitle}</p>` : "";
    const desc = c.description ? `<p class="desc">${c.description}</p>` : "";
    const poll = (c.stats?.poll?.length)
      ? `<div class="poll" aria-label="Poll results">${c.stats.poll.map(p => `
          <div class="bar" role="img" aria-label="${p.label} ${p.percent}%">
            <span class="label">${p.label}</span>
            <span class="meter" style="width:${p.percent}%"></span>
            <span class="pct">${p.percent}%</span>
          </div>`).join("")}
        </div>` : "";

    const tracked = (typeof c.stats?.trackedCountToday === "number")
      ? `<div class="stat">Tracked today: ${c.stats.trackedCountToday.toLocaleString()}</div>`
      : "";

    const cta = c.cta
      ? (c.cta.action !== "none"
          ? `<a class="cta" href="${c.cta.url || "#"}" aria-label="${c.cta.ariaLabel || c.cta.label}">${c.cta.label}</a>`
          : `<button class="cta disabled" aria-disabled="true">${c.cta.label || "Coming soon"}</button>`)
      : "";

    card.innerHTML = `
      <header>
        <h3 class="title">${c.title}</h3>
        ${subtitle}
      </header>
      <div class="media">${mediaEl || ""}</div>
      <div class="body">
        ${desc}
        ${poll}
        ${tracked}
      </div>
      <footer>
        <div class="byline">
          <img class="avatar" src="${c.attribution?.avatarUrl || "/assets/avatars/staff.png"}" alt="" />
          <span class="name">${c.attribution?.displayName || "Flicklet"}</span>
          ${c.attribution?.watermark ? `<span class="wm">${c.attribution.watermark}</span>` : ""}
        </div>
        <div class="actions">${cta}</div>
      </footer>
    `;
    root.appendChild(card);
  }

  (async () => {
    const root = ensureRoot();
    removeLegacy();
    try {
      const payload = await fetchSeed();
      render(root, payload);
    } catch (e) {
      root.innerHTML = `<div class="c-empty" role="status">Community features are coming soon.</div>`;
    }
  })();
})();
