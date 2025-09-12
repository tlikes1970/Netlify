/* ========== community-spotlight.js ==========
   Community Spotlight - two-column layout with video left, info right
   Priority: Community → Influencer → TMDB Official → House Fallback
   Always shows content (never hidden)
*/

(function(){
  'use strict';

  // Check if feature is enabled
  if (!window.FLAGS?.homeRowSpotlight) {
    console.log('🎬 Community Spotlight disabled by feature flag');
    return;
  }

  const row = document.getElementById('spotlight-row');
  if (!row) {
    console.warn('🎬 Community Spotlight row not found');
    return;
  }

  console.log('🎬 Initializing Community Spotlight...');

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSpotlight);
  } else {
    initSpotlight();
  }

  async function initSpotlight() {
    try {
      const item = await pickSpotlight();
      renderSpotlight(item);
      console.log('✅ Community Spotlight initialized');
    } catch (error) {
      console.error('❌ Community Spotlight initialization failed:', error);
      // Show fallback content
      renderSpotlight(getHouseFallback());
    }
  }

  /**
   * Process: Community Spotlight Selection
   * Purpose: Selects content for Community Spotlight with priority order
   * Data Source: Community items, influencer whitelist, TMDB API, house fallback
   * Update Path: Modify priority order or add new sources in this function
   * Dependencies: fetchApprovedCommunitySpotlight, fetchWhitelistedInfluencerSpotlight, fetchTmdbTrendingWithOfficialTrailer
   */
  async function pickSpotlight() {
    console.log('🎬 Picking Community Spotlight content...');

    // 1) Community approved item (most recent)
    try {
      const community = await fetchApprovedCommunitySpotlight?.();
      if (community?.length) {
        console.log('🎬 Using community content:', community[0]);
        return normalizeCommunity(community[0]);
      }
    } catch (error) {
      console.warn('🎬 Community fetch failed:', error);
    }

    // 2) Influencer item from whitelist
    try {
      const influencer = await fetchWhitelistedInfluencerSpotlight?.();
      if (influencer?.length) {
        console.log('🎬 Using influencer content:', influencer[0]);
        return normalizeInfluencer(influencer[0]);
      }
    } catch (error) {
      console.warn('🎬 Influencer fetch failed:', error);
    }

    // 3) TMDB official trailer/teaser
    try {
      const tmdb = await fetchTmdbTrendingWithOfficialTrailer?.();
      if (tmdb) {
        console.log('🎬 Using TMDB content:', tmdb);
        return normalizeTmdb(tmdb);
      }
    } catch (error) {
      console.warn('🎬 TMDB fetch failed:', error);
    }

    // 4) House fallback (always available)
    console.log('🎬 Using house fallback content');
    return getHouseFallback();
  }

  /**
   * Process: Community Spotlight Rendering
   * Purpose: Renders the selected spotlight content in the two-column layout
   * Data Source: SpotlightItem object with video and metadata
   * Update Path: Modify HTML structure or styling classes in this function
   * Dependencies: spotlight-row DOM element, escapeHtml utility function
   */
  function renderSpotlight(item) {
    console.log('🎬 Rendering spotlight:', item);

    const videoEl = row.querySelector('.spotlight-video');
    const infoEl = row.querySelector('.spotlight-info');
    
    if (!videoEl || !infoEl) {
      console.error('❌ Spotlight DOM elements not found');
      return;
    }

    // Render video content
    if (item.youtubeId) {
      // YouTube embed
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${item.youtubeId}?playsinline=1&rel=0&modestbranding=1`;
      iframe.title = escapeHtml(item.title);
      iframe.loading = 'lazy';
      iframe.frameBorder = '0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.sandbox = 'allow-scripts allow-same-origin allow-presentation';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      
      videoEl.innerHTML = '';
      videoEl.appendChild(iframe);
    } else {
      // Static image fallback
      const img = document.createElement('img');
      img.className = 'thumb';
      img.alt = '';
      img.src = item.thumbnailUrl || '/img/spotlight-fallback-16x9.svg';
      img.loading = 'lazy';
      
      videoEl.innerHTML = '';
      videoEl.appendChild(img);
    }

    // Render info content
    const titleEl = infoEl.querySelector('.spotlight-title');
    const creditEl = infoEl.querySelector('.spotlight-credit');
    const descEl = infoEl.querySelector('.spotlight-desc');
    const badgesEl = infoEl.querySelector('.spotlight-badges');

    if (titleEl) titleEl.textContent = item.title || 'Community Spotlight';
    if (creditEl) creditEl.textContent = item.credit || '';
    if (descEl) descEl.textContent = item.description || '';

    // Render badges
    if (badgesEl) {
      badgesEl.innerHTML = '';
      (item.badges || []).forEach(badge => {
        const span = document.createElement('span');
        span.className = 'badge';
        span.textContent = badge;
        badgesEl.appendChild(span);
      });
    }

    // Set up CTA button
    const ctaBtn = infoEl.querySelector('#spotlightSubmitBtn');
    if (ctaBtn) {
      ctaBtn.onclick = () => {
        // Reuse existing feedback modal
        if (typeof window.openModal === 'function') {
          window.openModal(
            'Submit Your Video',
            '<p>Share your TV/movie content for a chance to be featured in Community Spotlight!</p><p>Coming soon - for now, use the feedback form in Settings.</p>',
            'spotlight-submit'
          );
        } else {
          // Fallback to feedback form
          if (typeof window.FlickletApp?.switchToTab === 'function') {
            window.FlickletApp.switchToTab('settings');
          }
        }
      };
    }
  }

  // Data normalization functions
  function normalizeCommunity(item) {
    return {
      id: item.id || 'community-' + Date.now(),
      title: item.title || 'Community Content',
      credit: item.credit || '@community',
      description: item.description || 'Featured community content',
      source: 'community',
      youtubeId: item.youtubeId,
      thumbnailUrl: item.thumbnailUrl,
      badges: item.badges || ['Community']
    };
  }

  function normalizeInfluencer(item) {
    return {
      id: item.id || 'influencer-' + Date.now(),
      title: item.title || 'Influencer Content',
      credit: item.credit || '@influencer',
      description: item.description || 'Featured influencer content',
      source: 'influencer',
      youtubeId: item.youtubeId,
      thumbnailUrl: item.thumbnailUrl,
      badges: item.badges || ['Influencer']
    };
  }

  function normalizeTmdb(item) {
    return {
      id: item.id || 'tmdb-' + Date.now(),
      title: item.title || item.name || 'TMDB Content',
      credit: 'Official',
      description: item.overview || 'Official trailer/teaser',
      source: 'tmdb',
      youtubeId: item.youtubeId,
      thumbnailUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : undefined,
      badges: ['Official', 'Trailer']
    };
  }

  function getHouseFallback() {
    return {
      id: 'house-fallback',
      title: 'Flicklet Community Spotlight',
      credit: 'Staff Pick',
      description: 'Submit your clip to be featured here. Pro program pending approval.',
      source: 'house',
      youtubeId: undefined,
      thumbnailUrl: '/img/spotlight-fallback-16x9.svg',
      badges: ['Info']
    };
  }

  // Utility function for HTML escaping
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Placeholder functions for future implementation
  window.fetchApprovedCommunitySpotlight = async function() {
    // TODO: Implement community content fetching
    console.log('🎬 fetchApprovedCommunitySpotlight not implemented yet');
    return null;
  };

  window.fetchWhitelistedInfluencerSpotlight = async function() {
    // TODO: Implement influencer content fetching
    console.log('🎬 fetchWhitelistedInfluencerSpotlight not implemented yet');
    return null;
  };

  /**
   * Process: TMDB Trending with Official Trailer Fetching
   * Purpose: Fetches trending content from TMDB and finds official YouTube trailers/teasers
   * Data Source: TMDB API trending endpoint, then videos endpoint for each item
   * Update Path: Modify API endpoints or filtering criteria in this function
   * Dependencies: TMDB_CONFIG, fetch API, YouTube video filtering
   */
  window.fetchTmdbTrendingWithOfficialTrailer = async function() {
    try {
      console.log('🎬 Fetching TMDB trending content...');
      
      if (!window.TMDB_CONFIG?.apiKey) {
        console.warn('🎬 TMDB API key not available');
        return null;
      }

      // Fetch trending movies and TV shows
      const [moviesResponse, tvResponse] = await Promise.all([
        fetch(`${window.TMDB_CONFIG.baseUrl}/trending/movie/day?api_key=${window.TMDB_CONFIG.apiKey}`),
        fetch(`${window.TMDB_CONFIG.baseUrl}/trending/tv/day?api_key=${window.TMDB_CONFIG.apiKey}`)
      ]);

      if (!moviesResponse.ok || !tvResponse.ok) {
        throw new Error(`TMDB API error: ${moviesResponse.status} / ${tvResponse.status}`);
      }

      const moviesData = await moviesResponse.json();
      const tvData = await tvResponse.json();
      
      // Combine and shuffle results
      const allTrending = [...moviesData.results, ...tvData.results]
        .sort(() => Math.random() - 0.5);

      console.log(`🎬 Found ${allTrending.length} trending items`);

      // Try to find official YouTube trailers for each item
      for (const item of allTrending.slice(0, 10)) { // Limit to first 10 for performance
        try {
          const videosResponse = await fetch(
            `${window.TMDB_CONFIG.baseUrl}/${item.media_type || 'movie'}/${item.id}/videos?api_key=${window.TMDB_CONFIG.apiKey}`
          );
          
          if (!videosResponse.ok) continue;
          
          const videosData = await videosResponse.json();
          const officialTrailer = videosData.results?.find(video => 
            video.site === 'YouTube' && 
            video.official === true && 
            ['Trailer', 'Teaser'].includes(video.type)
          );

          if (officialTrailer) {
            console.log('🎬 Found official trailer:', item.title || item.name, officialTrailer.key);
            return {
              ...item,
              youtubeId: officialTrailer.key,
              title: item.title || item.name,
              overview: item.overview
            };
          }
        } catch (error) {
          console.warn('🎬 Error fetching videos for item:', item.title || item.name, error);
          continue;
        }
      }

      console.log('🎬 No official trailers found in trending content');
      return null;
    } catch (error) {
      console.error('🎬 TMDB fetch failed:', error);
      return null;
    }
  };

})();
