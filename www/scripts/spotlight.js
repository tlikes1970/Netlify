/* ========== spotlight.js ==========
   Daily Video Spotlight. Accepts mp4 or YouTube. Autoplay muted unless reduced-motion.
   Storage key: flicklet:spotlight:v1
   Shape example:
   {
     "date": "2025-09-05",
     "title": "Alien: Earth — Ep 6 Teaser",
     "description": "Tensions rise as powerful enemies confront each other…",
     "videoUrl": "https://cdn.example.com/trailers/alien-earth-e6.mp4",   // or YouTube URL
     "thumbnail": "https://image.tmdb.org/t/p/w780/abc.jpg"               // optional
   }
*/
(function () {
  const root = document.getElementById('videoSpotlight');
  if (!root) return;

  const mediaEl = document.getElementById('spotlightMedia');
  const titleEl = document.getElementById('spotlightItemTitle');
  const descEl = document.getElementById('spotlightDesc');
  const dateEl = root.querySelector('.spotlight-date');
  const playBtn = document.getElementById('spotlightPlayBtn');
  const muteBtn = document.getElementById('spotlightMuteBtn');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const item = loadSpotlight();
  if (!item) {
    root.remove();
    return;
  } // hide card if no spotlight available

  // Render metadata
  titleEl.textContent = item.title || 'Featured clip';
  descEl.textContent = item.description || '';
  dateEl.textContent = item.date ? niceDate(item.date) : today();

  // Render media
  let player = null;
  const isYouTube = /youtube\.com|youtu\.be/i.test(item.videoUrl || '');
  if (isYouTube) {
    // YouTube embed — no autoplay if reduced-motion; else muted autoplay
    const params = new URLSearchParams({
      autoplay: prefersReduced ? '0' : '1',
      mute: '1',
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
      controls: '1',
    });
    const src = toYouTubeEmbed(item.videoUrl) + (params.toString() ? `?${params}` : '');
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', item.title || 'Spotlight');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.src = src;
    mediaEl.innerHTML = '';
    mediaEl.appendChild(iframe);
    player = {
      kind: 'yt',
      el: iframe,
      muted: true,
      play() {
        /* user interacts to play */
      },
      toggleMute() {
        /* noop; YouTube handles UI */
      },
    };
    muteBtn.disabled = true; // we won't fight YouTube's controls
  } else {
    // HTML5 video
    const video = document.createElement('video');
    video.playsInline = true;
    video.muted = !prefersReduced; // muted if not reduced-motion
    video.autoplay = !prefersReduced;
    video.loop = false;
    video.controls = true;
    if (item.thumbnail) video.poster = item.thumbnail;

    const src = document.createElement('source');
    src.src = item.videoUrl || '';
    src.type = guessMime(item.videoUrl);
    video.appendChild(src);

    mediaEl.innerHTML = '';
    mediaEl.appendChild(video);

    player = {
      kind: 'mp4',
      el: video,
      muted: video.muted,
      play() {
        try {
          video.play();
        } catch (_) {}
      },
      toggleMute() {
        video.muted = !video.muted;
        this.muted = video.muted;
        muteBtn.textContent = video.muted ? 'Unmute' : 'Mute';
        muteBtn.setAttribute('aria-pressed', String(!video.muted));
      },
    };

    // If autoplay is blocked, we don't care — user can press Play
    video.addEventListener('error', () => console.warn('Spotlight: video error', item.videoUrl));
  }

  // Controls
  playBtn.addEventListener('click', () => player?.play && player.play());
  muteBtn.addEventListener('click', () => player?.toggleMute && player.toggleMute());

  // --- helpers ---
  function loadSpotlight() {
    // 1) explicit single item wins
    try {
      const raw = localStorage.getItem('flicklet:spotlight:v1');
      if (raw) {
        const one = JSON.parse(raw);
        if (one && one.videoUrl) return one;
      }
    } catch (_) {}

    // 2) rotate from curated:trending
    const fromCur = fromCurated();
    if (fromCur) return fromCur;

    // 3) nothing? caller should hide spotlight card
    return null;
  }

  function fromCurated() {
    try {
      const arr = JSON.parse(localStorage.getItem('curated:trending') || '[]');
      if (!Array.isArray(arr) || !arr.length) return null;

      const idx = hashToIndex(new Date().toISOString().slice(0, 10), arr.length);
      const pick = arr[idx];
      if (!pick) return null;

      // require a video URL field (adapt this if your objects carry trailerUrl differently)
      const videoUrl = pick.trailerUrl || pick.videoUrl || '';
      if (!videoUrl) return null;

      return {
        date: new Date().toISOString().slice(0, 10),
        title: pick.title || pick.name || 'Spotlight',
        description: 'Featured from Trending',
        videoUrl,
        thumbnail: pick.backdrop_path ? `https://image.tmdb.org/t/p/w780${pick.backdrop_path}` : '',
      };
    } catch (_) {
      return null;
    }
  }

  // Utility: deterministic index from date string
  function hashToIndex(str, mod) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h) % mod;
  }
  function toYouTubeEmbed(url) {
    // Handles https://www.youtube.com/watch?v=ID or https://youtu.be/ID
    try {
      const u = new URL(url);
      let id = '';
      if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
      else id = u.searchParams.get('v') || '';
      return id ? `https://www.youtube.com/embed/${id}` : url;
    } catch (_) {
      return url;
    }
  }
  function guessMime(u) {
    if (!u) return 'video/mp4';
    const ext = u.split('?')[0].split('#')[0].split('.').pop().toLowerCase();
    return ext === 'webm' ? 'video/webm' : ext === 'ogg' ? 'video/ogg' : 'video/mp4';
  }
  function niceDate(s) {
    // expects YYYY-MM-DD
    const [y, m, d] = s.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  }
  function today() {
    const d = new Date();
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  }
})();
