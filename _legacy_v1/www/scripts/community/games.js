/**
 * Community Games Component
 * Renders game tiles and stats teaser inside the Community section
 */

(function () {
  'use strict';

  console.log('🎮 Community Games component loaded');

  // Helper function to get translation
  function t(key) {
    // Handle nested i18n keys
    const keys = key.split('.');
    let value = window.i18n;
    for (let i = 0; i < keys.length; i++) {
      if (value && typeof value === 'object' && keys[i] in value) {
        value = value[keys[i]];
      } else {
        return key; // Return key if not found
      }
    }
    return value;
  }

  // Helper function to navigate
  function softNavigate(url) {
    if (typeof window.navigateTo === 'function') return window.navigateTo(url);
    if (window.router && typeof window.router.navigate === 'function') {
      window.router.navigate(url);
    } else {
      location.href = url;
    }
  }

  // Render game tile
  function renderGameTile({ id, title, subtitle, icon, onClick }) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'game-tile';
    el.dataset.action = id; // For click logging
    el.innerHTML = `
      <div class="game-tile__icon icon-${icon}" aria-hidden="true"></div>
      <div class="game-tile__text">
        <div class="game-tile__title">${title}</div>
        <div class="game-tile__sub">${subtitle}</div>
      </div>
    `;
    el.addEventListener('click', onClick);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    });
    return el;
  }

  // Get lightweight stats (non-PII); keeps it snappy
  function getLightweightStats() {
    try {
      const raw = JSON.parse(localStorage.getItem('flicklet_stats') || '{}');
      return {
        streak: raw.streak || 0,
        totalAnswered: raw.totalAnswered || 0,
        bestScore: raw.bestScore || 0,
      };
    } catch (_) {
      return {};
    }
  }

  // Main games renderer
  window.renderCommunityGames = function renderCommunityGames() {
    if (!window.FLAGS?.community_games_enabled) {
      console.log('🚫 Community Games disabled by feature flag, showing placeholder');
      return null; // Return null to indicate placeholder should be used
    }

    console.log('✅ Rendering Community Games');

    const wrap = document.createElement('div');
    wrap.className = 'community-games';

    // Tiles container
    const tiles = document.createElement('div');
    tiles.className = 'community-games__tiles';

    // Daily Trivia tile → teaser modal (upsell to Pro)
    tiles.appendChild(
      renderGameTile({
        id: 'trivia',
        title: t('games.trivia_title'),
        subtitle: t('games.trivia_sub'),
        icon: 'check',
        onClick: (e) => {
          e.preventDefault();
          if (typeof window.openGamesTeaser === 'function') {
            window.openGamesTeaser('trivia');
          }
        },
      }),
    );

    // FlickWord tile → fully functional
    tiles.appendChild(
      renderGameTile({
        id: 'flickword',
        title: t('games.flickword_title'),
        subtitle: t('games.flickword_sub'),
        icon: 'badge',
        onClick: () => softNavigate('/games/flickword'),
      }),
    );

    wrap.appendChild(tiles);

    // Pro stats teaser
    if (window.FLAGS?.community_stats_teaser) {
      const teaser = document.createElement('div');
      teaser.className = 'community-games__teaser';
      const stats = getLightweightStats();
      teaser.innerHTML = `
        <div class="teaser__item">
          <div class="teaser__value">${stats.streak || 0}</div>
          <div class="teaser__label">${t('games.stat_streak')}</div>
        </div>
        <div class="teaser__item">
          <div class="teaser__value">${stats.totalAnswered || 0}</div>
          <div class="teaser__label">${t('games.stat_total')}</div>
        </div>
        <div class="teaser__item">
          <div class="teaser__value">${stats.bestScore || '—'}</div>
          <div class="teaser__label">${t('games.stat_best')}</div>
        </div>
        <button class="btn btn-link teaser__cta">${t('games.pro_cta')}</button>
      `;

      // Add click handler for Pro CTA
      const ctaBtn = teaser.querySelector('.teaser__cta');
      if (ctaBtn) {
        ctaBtn.addEventListener('click', () => softNavigate('/pro'));
      }

      wrap.appendChild(teaser);
    }

    return wrap;
  };
})();
