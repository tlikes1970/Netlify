/**
 * Home Clean Component - Data Adapters & Rendering Logic
 * Phase 2: Integrate Clean Home Into App
 */

// Feature toggle for stubs vs real data
const USE_STUBS = false; // Set to false to use real app data

// Holiday assignments storage
const HOLIDAY_STORAGE_KEY = 'flicklet:holidayAssignments';

class HomeCleanRenderer {
    constructor() {
        this.holidayAssignments = this.loadHolidayAssignments();
        this.eventListeners = new Map();
    }

    /**
     * Load holiday assignments from localStorage
     */
    loadHolidayAssignments() {
        try {
            const stored = localStorage.getItem(HOLIDAY_STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('[home-clean] Failed to load holiday assignments:', error);
            return {};
        }
    }

    /**
     * Save holiday assignments to localStorage
     */
    saveHolidayAssignments() {
        try {
            localStorage.setItem(HOLIDAY_STORAGE_KEY, JSON.stringify(this.holidayAssignments));
        } catch (error) {
            console.warn('[home-clean] Failed to save holiday assignments:', error);
        }
    }

    /**
     * Generate poster SVG data URI
     */
    generatePosterSVG(text, width, height) {
        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#1a1a1a"/>
                <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
                      font-family="Arial, sans-serif" font-size="14" fill="#888">
                    ${text}
                </text>
            </svg>
        `;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    /**
     * Generate dummy data for stubs
     */
    generateDummyData(type, count) {
        const data = [];
        for (let i = 1; i <= count; i++) {
            data.push({
                id: `${type}-${i}`,
                title: `Title ${i}`,
                meta: `S${Math.floor(Math.random() * 3) + 1} • E${Math.floor(Math.random() * 10) + 1}`,
                poster: this.generatePosterSVG(`Poster ${i}`, 200, 300)
            });
        }
        return data;
    }

    /**
     * Get Currently Watching data
     */
    getCurrentlyWatchingData() {
        if (USE_STUBS) {
            return this.generateDummyData('cw', 12);
        }

        // Real data adapter - Phase 3: Live data integration
        const source = window.appData?.tvWatching || [];
        
        // Sort by updatedAt descending
        const sorted = source.sort((a, b) => {
            const aTime = new Date(a.updatedAt || 0).getTime();
            const bTime = new Date(b.updatedAt || 0).getTime();
            return bTime - aTime;
        });

        return sorted.slice(0, 12).map(item => ({
            id: item.id || `cw-${item.title}`,
            title: item.title || 'Unknown Title',
            season: item.season || 1,
            episode: item.episode || 1,
            poster: item.poster_path ? 
                `https://image.tmdb.org/t/p/w200${item.poster_path}` : 
                this.generatePosterSVG('No Poster', 200, 300),
            meta: `S${item.season || 1} • E${item.episode || 1}`,
            status: item.status || 'watching',
            updatedAt: item.updatedAt
        }));
    }

    /**
     * Get Next Up data
     */
    getNextUpData() {
        if (USE_STUBS) {
            return this.generateDummyData('up-next', 12);
        }

        // Real data adapter - Phase 3: Live data integration
        // Use tv.watching data since nextUp might not exist
        const source = window.appData?.tv?.watching || [];
        console.log('[home-clean] Next Up Data from tv.watching:', source.length);
        
        if (source.length === 0) {
            console.log('[home-clean] No TV watching data for Next Up');
            return [];
        }

        // Since the data doesn't have nextAirDate/airDate, just show all items as "Series complete"
        return source.slice(0, 12).map(item => {
            return {
                id: item.id || `up-next-${item.name || item.title}`,
                title: item.name || item.title || 'Unknown Title',
                poster: item.poster_path ? 
                    `https://image.tmdb.org/t/p/w220${item.poster_path}` : 
                    this.generatePosterSVG('No Poster', 220, 330),
                upNextText: 'Series complete', // Default since no air date info
                airDate: null,
                ended: true,
                nextSeason: item.season || 1
            };
        });
    }

    /**
     * Get For You data by genre with TMDB integration and caching
     */
    async getForYouData(genre) {
        if (USE_STUBS) {
            return this.generateDummyData(`${genre.toLowerCase()}-show`, 12);
        }

        // Check cache first
        const cacheKey = `flicklet:curatedCache:${genre.toLowerCase()}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) {
            console.log(`[home-clean] Using cached data for ${genre}`);
            return cached;
        }

        // Real data adapter - Phase 3: TMDB integration with caching
        let genreIds = [];
        
        // Check user's curated row settings
        if (window.appData?.settings?.layout?.curatedRow) {
            const curated = window.appData.settings.layout.curatedRow;
            genreIds = curated[genre.toLowerCase()] || [];
        } else {
            // Fallback to discovery genres or default genre IDs
            const discoveryGenres = window.appData?.discoveryGenres || [];
            if (discoveryGenres.length >= 3) {
                genreIds = discoveryGenres.slice(0, 3);
            } else {
                // Default genre IDs
                const genreMap = {
                    'Drama': [18],
                    'Comedy': [35],
                    'Horror': [27]
                };
                genreIds = genreMap[genre] || [];
            }
        }

        // Use TMDB API
        if (window.tmdbGet && genreIds.length > 0) {
            try {
                console.log(`[home-clean] Fetching ${genre} data from TMDB...`);
                const results = await window.tmdbGet('discover/tv', {
                    with_genres: genreIds.join(','),
                    sort_by: 'popularity.desc',
                    page: 1
                });
                
                const data = (results?.results || []).slice(0, 12).map(item => ({
                    id: item.id || `for-you-${item.name}`,
                    title: item.name || 'Unknown Title',
                    poster: item.poster_path ? 
                        `https://image.tmdb.org/t/p/w220${item.poster_path}` : 
                        this.generatePosterSVG('No Poster', 220, 330),
                    year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : '',
                    genreName: genre,
                    watchProviders: item.watch_providers?.results?.US?.flatrate || [],
                    overview: item.overview || 'No description available.',
                    genres: item.genre_ids || []
                }));

                // Cache the results for 24 hours
                this.setCachedData(cacheKey, data);
                return data;
                
            } catch (error) {
                console.warn(`[home-clean] Failed to fetch ${genre} data:`, error);
            }
        }

        // Fallback to empty array with debug info
        console.warn(`[home-clean] No data available for ${genre}. tmdbGet:`, !!window.tmdbGet, 'genreIds:', genreIds);
        return [];
    }

    /**
     * Get cached data with expiration check
     */
    getCachedData(key) {
        try {
            const cached = sessionStorage.getItem(key);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            const now = Date.now();
            const cacheTime = data.timestamp || 0;
            const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
            
            if (now - cacheTime > cacheExpiry) {
                sessionStorage.removeItem(key);
                return null;
            }
            
            return data.results;
        } catch (error) {
            console.warn('[home-clean] Cache read error:', error);
            return null;
        }
    }

    /**
     * Set cached data with timestamp
     */
    setCachedData(key, results) {
        try {
            const data = {
                results,
                timestamp: Date.now()
            };
            sessionStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.warn('[home-clean] Cache write error:', error);
        }
    }

    /**
     * Create Currently Watching card
     */
    createCWCard(item) {
        const card = document.createElement('div');
        card.className = 'card cw';
        card.dataset.id = item.id;
        
        const holidayBadge = this.holidayAssignments[item.id] 
            ? `<div class="holiday-badge">Holiday: ${this.holidayAssignments[item.id]}</div>` 
            : '';

        card.innerHTML = `
            <div class="poster" style="background-image: url('${item.poster}'); background-size: cover; background-position: center;">
                <button class="holiday-chip" data-card-id="${item.id}">Holiday +</button>
            </div>
            <div class="content">
                <div class="title">${item.title}</div>
                <div class="meta">${item.meta}</div>
                ${holidayBadge}
                <div class="actions-grid">
                    <button class="action-btn" data-action="want" data-id="${item.id}">Want to Watch</button>
                    <button class="action-btn" data-action="watched" data-id="${item.id}">Watched</button>
                    <button class="action-btn" data-action="dismiss" data-id="${item.id}">Not Interested</button>
                    <button class="action-btn" data-action="delete" data-id="${item.id}">Delete</button>
                </div>
            </div>
        `;
        
        return card;
    }

    /**
     * Create Up Next card
     */
    createUpNextCard(item) {
        const card = document.createElement('div');
        card.className = 'card up-next';
        card.dataset.id = item.id;
        
        card.innerHTML = `
            <div class="poster" style="background-image: url('${item.poster}'); background-size: cover; background-position: center;"></div>
            <div class="content">
                <div class="title">${item.title}</div>
                <div class="up-next-line">${item.upNextText}</div>
            </div>
        `;
        
        return card;
    }

    /**
     * Create For You card
     */
    createForYouCard(item, genre) {
        const card = document.createElement('div');
        card.className = 'card for-you';
        card.dataset.id = item.id;
        
        const holidayBadge = this.holidayAssignments[item.id] 
            ? `<div class="holiday-badge">Holiday: ${this.holidayAssignments[item.id]}</div>` 
            : '';

        const watchProviders = item.watchProviders?.length > 0 
            ? item.watchProviders.map(p => p.provider_name || p.name).join(', ')
            : 'N/A';

        card.innerHTML = `
            <div class="poster" style="background-image: url('${item.poster}'); background-size: cover; background-position: center;">
                <button class="holiday-chip" data-card-id="${item.id}">Holiday +</button>
            </div>
            <div class="content">
                <div class="title">${item.title}</div>
                <div class="meta">${genre} • ${item.year || 'N/A'}</div>
                ${holidayBadge}
                <div class="where-to-watch">Where to Watch: ${watchProviders}</div>
                <div class="blurb">${item.overview || 'No description available.'}</div>
                <button class="cta-btn" data-action="want" data-id="${item.id}">Want to Watch</button>
            </div>
        `;
        
        return card;
    }

    /**
     * Render a rail
     */
    renderRail(railId, data, type, genre = null) {
        const rail = document.getElementById(railId);
        if (!rail) {
            console.warn(`[home-clean] Rail ${railId} not found`);
            return;
        }

        const container = rail.querySelector('.card-container');
        if (!container) {
            console.warn(`[home-clean] Card container not found in ${railId}`);
            return;
        }

        container.innerHTML = '';

        data.slice(0, 12).forEach(item => {
            let card;
            switch (type) {
                case 'cw':
                    card = this.createCWCard(item);
                    break;
                case 'up-next':
                    card = this.createUpNextCard(item);
                    break;
                case 'for-you':
                    card = this.createForYouCard(item, genre);
                    break;
            }
            container.appendChild(card);
        });

        // Warn if not 12 cards
        if (data.length !== 12) {
            console.warn(`[home-clean] Rail ${railId} has ${data.length} cards, expected 12`);
        }
    }

    /**
     * Render all rails
     */
    async renderAllRails() {
        const cwData = this.getCurrentlyWatchingData();
        const upNextData = this.getNextUpData();
        
        // Render synchronous rails first
        this.renderRail('cw-rail', cwData, 'cw');
        this.renderRail('up-next-rail', upNextData, 'up-next');
        
        // Render async For You rails
        try {
            const [dramaData, comedyData, horrorData] = await Promise.all([
                this.getForYouData('Drama'),
                this.getForYouData('Comedy'),
                this.getForYouData('Horror')
            ]);

            this.renderRail('drama-rail', dramaData, 'for-you', 'Drama');
            this.renderRail('comedy-rail', comedyData, 'for-you', 'Comedy');
            this.renderRail('horror-rail', horrorData, 'for-you', 'Horror');
        } catch (error) {
            console.error('[home-clean] Failed to render For You rails:', error);
        }
    }

    /**
     * Handle action button clicks - Phase 3: Connect to real reducers
     */
    handleActionClick(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;
        const card = button.closest('.card');
        const title = card?.querySelector('.title')?.textContent || 'Unknown';

        // Analytics tracking
        this.trackAction(action, id, title);

        // Execute action based on type
        switch (action) {
            case 'want':
                this.moveToWishlist(id, title);
                break;
            case 'watched':
                this.markAsWatched(id, title);
                break;
            case 'dismiss':
                this.dismissItem(id, title);
                break;
            case 'delete':
                this.deleteItem(id, title);
                break;
        }

        // Dispatch custom event for external listeners
        const customEvent = new CustomEvent(`cw:${action}`, {
            detail: { id, action, title }
        });
        window.dispatchEvent(customEvent);
        
        console.log(`[home-clean] Action ${action} executed for ${title}`);
    }

    /**
     * Track action for analytics
     */
    trackAction(action, id, title) {
        try {
            if (window.track) {
                window.track('home_action', { action, id, title });
            } else {
                console.log('[home-clean] Analytics track:', { action, id, title });
            }
        } catch (error) {
            console.warn('[home-clean] Analytics tracking failed:', error);
        }
    }

    /**
     * Move item to wishlist
     */
    moveToWishlist(id, title) {
        try {
            // Use existing reducer if available
            if (window.moveItem) {
                window.moveItem(id, 'wishlist');
            } else if (window.appData?.tvWatching) {
                // Manual implementation
                const item = window.appData.tvWatching.find(item => item.id === id);
                if (item) {
                    // Remove from currently watching
                    window.appData.tvWatching = window.appData.tvWatching.filter(item => item.id !== id);
                    // Add to wishlist
                    if (!window.appData.tvWishlist) window.appData.tvWishlist = [];
                    window.appData.tvWishlist.push(item);
                    // Update app data
                    if (window.updateAppData) window.updateAppData();
                }
            }
            this.showToast(`Added "${title}" to wishlist`);
        } catch (error) {
            console.error('[home-clean] Move to wishlist failed:', error);
        }
    }

    /**
     * Mark item as watched
     */
    markAsWatched(id, title) {
        try {
            // Use existing reducer if available
            if (window.moveItem) {
                window.moveItem(id, 'watched');
            } else if (window.appData?.tvWatching) {
                // Manual implementation
                const item = window.appData.tvWatching.find(item => item.id === id);
                if (item) {
                    // Update status
                    item.status = 'watched';
                    item.updatedAt = new Date().toISOString();
                    // Remove from currently watching
                    window.appData.tvWatching = window.appData.tvWatching.filter(item => item.id !== id);
                    // Add to watched
                    if (!window.appData.tvWatched) window.appData.tvWatched = [];
                    window.appData.tvWatched.push(item);
                    // Update app data
                    if (window.updateAppData) window.updateAppData();
                }
            }
            this.showToast(`Marked "${title}" as watched`);
        } catch (error) {
            console.error('[home-clean] Mark as watched failed:', error);
        }
    }

    /**
     * Dismiss item (remove from all lists)
     */
    dismissItem(id, title) {
        try {
            // Use existing reducer if available
            if (window.removeItemFromCurrentList) {
                window.removeItemFromCurrentList(id);
            } else if (window.appData?.tvWatching) {
                // Manual implementation
                window.appData.tvWatching = window.appData.tvWatching.filter(item => item.id !== id);
                if (window.updateAppData) window.updateAppData();
            }
            this.showToast(`Dismissed "${title}"`);
        } catch (error) {
            console.error('[home-clean] Dismiss failed:', error);
        }
    }

    /**
     * Delete item completely
     */
    deleteItem(id, title) {
        try {
            // Use existing reducer if available
            if (window.removeItemFromCurrentList) {
                window.removeItemFromCurrentList(id);
            } else {
                // Manual implementation - remove from all lists
                ['tvWatching', 'tvWishlist', 'tvWatched'].forEach(listName => {
                    if (window.appData?.[listName]) {
                        window.appData[listName] = window.appData[listName].filter(item => item.id !== id);
                    }
                });
                if (window.updateAppData) window.updateAppData();
            }
            this.showToast(`Deleted "${title}"`);
        } catch (error) {
            console.error('[home-clean] Delete failed:', error);
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        try {
            if (window.ui?.toast) {
                window.ui.toast(message, type);
            } else if (window.showNotification) {
                window.showNotification(message, type);
            } else {
                console.log(`[home-clean] Toast: ${message}`);
            }
        } catch (error) {
            console.warn('[home-clean] Toast failed:', error);
        }
    }

    /**
     * Handle holiday chip clicks
     */
    handleHolidayChipClick(event) {
        const chip = event.target.closest('.holiday-chip');
        if (!chip) return;

        const cardId = chip.dataset.cardId;
        const cardEl = chip.closest('.card');
        
        if (window.openHolidayModal) {
            window.openHolidayModal({
                cardEl,
                onAssign: (holiday) => {
                    this.assignHoliday(cardId, holiday);
                }
            });
        }
    }

    /**
     * Assign holiday to a card
     */
    assignHoliday(cardId, holiday) {
        this.holidayAssignments[cardId] = holiday;
        this.saveHolidayAssignments();
        
        // Update the card display
        this.updateCardHolidayBadge(cardId, holiday);
        
        // Dispatch event
        const customEvent = new CustomEvent('holiday:assigned', {
            detail: { cardId, title: document.querySelector(`[data-id="${cardId}"] .title`)?.textContent, holiday }
        });
        window.dispatchEvent(customEvent);
        
        console.log('[home-clean] Holiday assigned:', { cardId, holiday });
    }

    /**
     * Update holiday badge on a card
     */
    updateCardHolidayBadge(cardId, holiday) {
        const card = document.querySelector(`[data-id="${cardId}"]`);
        if (!card) return;

        let content = card.querySelector('.content');
        let existingBadge = content.querySelector('.holiday-badge');
        
        if (existingBadge) {
            existingBadge.textContent = `Holiday: ${holiday}`;
        } else {
            const badge = document.createElement('div');
            badge.className = 'holiday-badge';
            badge.textContent = `Holiday: ${holiday}`;
            content.insertBefore(badge, content.querySelector('.meta').nextSibling);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const container = document.getElementById('home-clean');
        if (!container) return;

        // Action button clicks
        const actionHandler = (e) => this.handleActionClick(e);
        container.addEventListener('click', actionHandler);
        this.eventListeners.set('action-clicks', actionHandler);

        // Holiday chip clicks
        const holidayHandler = (e) => this.handleHolidayChipClick(e);
        container.addEventListener('click', holidayHandler);
        this.eventListeners.set('holiday-clicks', holidayHandler);
    }

    /**
     * Cleanup event listeners
     */
    cleanupEventListeners() {
        const container = document.getElementById('home-clean');
        if (!container) return;

        this.eventListeners.forEach((handler, type) => {
            container.removeEventListener('click', handler);
        });
        this.eventListeners.clear();
    }

    /**
     * Initialize the component
     */
    async init() {
        await this.renderAllRails();
        this.setupEventListeners();
    }

    /**
     * Destroy the component
     */
    destroy() {
        this.cleanupEventListeners();
    }
}

// QA Helper Functions
window.homeCleanReport = function() {
    const rails = [
        { id: 'cw-rail', name: 'Currently Watching' },
        { id: 'up-next-rail', name: 'Next Up' },
        { id: 'drama-rail', name: 'Drama' },
        { id: 'comedy-rail', name: 'Comedy' },
        { id: 'horror-rail', name: 'Horror' }
    ];

    const report = rails.map(rail => {
        const element = document.getElementById(rail.id);
        if (!element) return { id: rail.id, name: rail.name, error: 'Not found' };
        
        const container = element.querySelector('.card-container');
        const cards = container?.children || [];
        
        return {
            id: rail.id,
            name: rail.name,
            cards: cards.length,
            snap: element.style.scrollSnapType || 'x mandatory',
            width: element.offsetWidth,
            lastRight_minus_viewportRight: container ? container.scrollWidth - element.offsetWidth : 0
        };
    });

    console.log('[home-clean] Rail Report:', report);
    return report;
};

window.homeCleanRerender = function() {
    if (window.homeCleanRenderer) {
        window.homeCleanRenderer.destroy();
        window.homeCleanRenderer.init();
        console.log('[home-clean] Rerendered with current data sources');
    }
};

// Export for use in index.js
window.HomeCleanRenderer = HomeCleanRenderer;
