/**
 * HomeCleanData - Data Abstraction Layer
 * Phase 4: Modular Component Architecture
 */

class HomeCleanData {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get Currently Watching data
     */
    async getCurrentlyWatching() {
        const cacheKey = 'currently-watching';
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('[HomeCleanData] Using cached CW data');
                return cached.data;
            }
        }

        try {
            let data;
            
            if (window.FLAGS?.mockMode) {
                data = this.getMockCurrentlyWatching();
            } else {
                data = await this.getLiveCurrentlyWatching();
            }
            
            // Cache the result
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
            
        } catch (error) {
            console.error('[HomeCleanData] Failed to get CW data:', error);
            return this.getMockCurrentlyWatching(); // Fallback to mock
        }
    }

    /**
     * Get Next Up data
     */
    async getNextUp() {
        const cacheKey = 'next-up';
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('[HomeCleanData] Using cached Next Up data');
                return cached.data;
            }
        }

        try {
            let data;
            
            if (window.FLAGS?.mockMode) {
                data = this.getMockNextUp();
            } else {
                data = await this.getLiveNextUp();
            }
            
            // Cache the result
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
            
        } catch (error) {
            console.error('[HomeCleanData] Failed to get Next Up data:', error);
            return this.getMockNextUp(); // Fallback to mock
        }
    }

    /**
     * Get curated genre data
     */
    async getCuratedGenres(genre) {
        const cacheKey = `genre-${genre.toLowerCase()}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log(`[HomeCleanData] Using cached ${genre} data`);
                return cached.data;
            }
        }

        try {
            let data;
            
            if (window.FLAGS?.mockMode) {
                data = this.getMockGenreData(genre);
            } else {
                data = await this.getLiveGenreData(genre);
            }
            
            // Cache the result
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
            
        } catch (error) {
            console.error(`[HomeCleanData] Failed to get ${genre} data:`, error);
            return this.getMockGenreData(genre); // Fallback to mock
        }
    }

    /**
     * Get In Theaters data
     */
    async getInTheaters() {
        const cacheKey = 'in-theaters';
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('[HomeCleanData] Using cached In Theaters data');
                return cached.data;
            }
        }

        try {
            let data;
            
            if (window.FLAGS?.mockMode) {
                data = this.getMockInTheaters();
            } else {
                data = await this.getLiveInTheaters();
            }
            
            // Cache the result
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
            
        } catch (error) {
            console.error('[HomeCleanData] Failed to get In Theaters data:', error);
            return this.getMockInTheaters(); // Fallback to mock
        }
    }

    /**
     * Get live Currently Watching data from appData
     */
    async getLiveCurrentlyWatching() {
        const watching = window.appData?.tv?.watching || [];
        
        return watching
            .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
            .slice(0, 12)
            .map(item => ({
                id: item.id,
                title: item.title || item.name,
                poster: this.formatPosterUrl(item.poster_path),
                meta: this.formatMeta(item),
                blurb: item.overview || 'No description available'
            }));
    }

    /**
     * Get live Next Up data from appData
     */
    async getLiveNextUp() {
        const nextUp = window.appData?.tv?.nextUp || [];
        
        return nextUp
            .sort((a, b) => new Date(a.airDate || 0) - new Date(b.airDate || 0))
            .slice(0, 12)
            .map(item => ({
                id: item.id,
                title: item.title || item.name,
                poster: this.formatPosterUrl(item.poster_path),
                meta: this.formatNextUpMeta(item),
                blurb: item.overview || 'No description available'
            }));
    }

    /**
     * Get live genre data from TMDB
     */
    async getLiveGenreData(genre) {
        const genreMap = {
            'Drama': 18,
            'Comedy': 35,
            'Horror': 27
        };
        
        const genreId = genreMap[genre];
        if (!genreId) {
            console.warn(`[HomeCleanData] Unknown genre: ${genre}`);
            return [];
        }

        try {
            const response = await window.tmdbGet('discover/tv', {
                with_genres: genreId,
                sort_by: 'popularity.desc',
                page: 1
            });

            if (response?.data?.results) {
                return response.data.results
                    .slice(0, 12)
                    .map(item => ({
                        id: item.id,
                        title: item.name,
                        poster: this.formatPosterUrl(item.poster_path),
                        meta: this.formatMeta(item),
                        blurb: item.overview || 'No description available'
                    }));
            }
            
            return [];
            
        } catch (error) {
            console.error(`[HomeCleanData] TMDB error for ${genre}:`, error);
            return [];
        }
    }

    /**
     * Get live In Theaters data from TMDB
     */
    async getLiveInTheaters() {
        try {
            const response = await window.tmdbGet('movie/now_playing', {
                page: 1
            });

            if (response?.data?.results) {
                return response.data.results
                    .slice(0, 12)
                    .map(item => ({
                        id: item.id,
                        title: item.title,
                        poster: this.formatPosterUrl(item.poster_path),
                        meta: this.formatMovieMeta(item),
                        blurb: item.overview || 'No description available'
                    }));
            }
            
            return [];
            
        } catch (error) {
            console.error('[HomeCleanData] TMDB error for In Theaters:', error);
            return [];
        }
    }

    /**
     * Get mock Currently Watching data
     */
    getMockCurrentlyWatching() {
        return [
            {
                id: '1413',
                title: 'American Horror Story',
                poster: 'https://image.tmdb.org/t/p/w185/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg',
                meta: 'Season 12 • Episode 3',
                blurb: 'An anthology series centering on different characters and locations, including a house with a murderous past, an insane asylum, a witch coven, a freak show, a hotel, a farmhouse in Roanoke, a cult, and more.'
            },
            {
                id: '126308',
                title: 'Shōgun',
                poster: 'https://image.tmdb.org/t/p/w185/8xV47NDrjdZDpkdCJQ6Z6T1czOf.jpg',
                meta: 'Season 1 • Episode 8',
                blurb: 'When a mysterious European ship is found marooned in a nearby fishing village, Lord Yoshii Toranaga discovers secrets that could tip the scales of power and devastate his enemies.'
            }
        ];
    }

    /**
     * Get mock Next Up data
     */
    getMockNextUp() {
        return [
            {
                id: '1480387',
                title: 'The Undertone',
                poster: 'https://image.tmdb.org/t/p/w185/9cqNXX2BQZ5j6gfMWpQe1uHjqTk.jpg',
                meta: 'New episode tomorrow',
                blurb: 'A psychological thriller about a woman who discovers her new apartment has a dark history.'
            },
            {
                id: '56427',
                title: 'Baywatch: Hawaiian Wedding',
                poster: 'https://image.tmdb.org/t/p/w185/6FfCtAuDZCNl0n9wM7Q7V6F4yJ3.jpg',
                meta: 'Series complete',
                blurb: 'The final episode of the classic beach drama series.'
            }
        ];
    }

    /**
     * Get mock genre data
     */
    getMockGenreData(genre) {
        const mockData = {
            'Drama': [
                {
                    id: '286801',
                    title: 'Monster: The Ed Gein Story',
                    poster: 'https://image.tmdb.org/t/p/w185/4Zz9aF8nNCN1qTQ1O47BsY9eZhu.jpg',
                    meta: '2024 • TV Series',
                    blurb: 'A chilling drama about one of America\'s most notorious serial killers.'
                },
                {
                    id: '247721',
                    title: 'Teacup',
                    poster: 'https://image.tmdb.org/t/p/w185/5hNcsnMkwU39Lp2xlceAHmQX3r9.jpg',
                    meta: '2024 • TV Series',
                    blurb: 'A psychological thriller about a woman who discovers her new apartment has a dark history.'
                }
            ],
            'Comedy': [
                {
                    id: '3452',
                    title: 'Frasier',
                    poster: 'https://image.tmdb.org/t/p/w185/8xV47NDrjdZDpkdCJQ6Z6T1czOf.jpg',
                    meta: '2023 • TV Series',
                    blurb: 'The beloved psychiatrist returns to Boston in this revival of the classic sitcom.'
                }
            ],
            'Horror': [
                {
                    id: '157239',
                    title: 'Alien: Earth',
                    poster: 'https://image.tmdb.org/t/p/w185/9cqNXX2BQZ5j6gfMWpQe1uHjqTk.jpg',
                    meta: '2024 • TV Series',
                    blurb: 'A new chapter in the Alien universe set on Earth.'
                }
            ]
        };

        return mockData[genre] || [];
    }

    /**
     * Get mock In Theaters data
     */
    getMockInTheaters() {
        return [
            {
                id: '872585',
                title: 'Oppenheimer',
                poster: 'https://image.tmdb.org/t/p/w185/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
                meta: '2023 • Movie',
                blurb: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.'
            },
            {
                id: '346364',
                title: 'It',
                poster: 'https://image.tmdb.org/t/p/w185/9E2y5Q7WlCVNEhP5GiVTjhEhx1o.jpg',
                meta: '2017 • Movie',
                blurb: 'In the summer of 1989, a group of bullied kids band together to destroy a shape-shifting monster.'
            }
        ];
    }

    /**
     * Format poster URL
     */
    formatPosterUrl(posterPath) {
        if (!posterPath) return null;
        return `https://image.tmdb.org/t/p/w185${posterPath}`;
    }

    /**
     * Format meta information
     */
    formatMeta(item) {
        if (item.first_air_date) {
            const year = new Date(item.first_air_date).getFullYear();
            return `${year} • TV Series`;
        }
        return 'TV Series';
    }

    /**
     * Format Next Up meta information
     */
    formatNextUpMeta(item) {
        if (item.nextAirDate) {
            const date = new Date(item.nextAirDate);
            const now = new Date();
            const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'New episode today';
            if (diffDays === 1) return 'New episode tomorrow';
            if (diffDays < 7) return `New episode in ${diffDays} days`;
            return `New episode ${date.toLocaleDateString()}`;
        }
        return 'Series complete';
    }

    /**
     * Format movie meta information
     */
    formatMovieMeta(item) {
        if (item.release_date) {
            const year = new Date(item.release_date).getFullYear();
            return `${year} • Movie`;
        }
        return 'Movie';
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('[HomeCleanData] Cache cleared');
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export for global access
window.HomeCleanData = HomeCleanData;
