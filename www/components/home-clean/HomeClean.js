/**
 * HomeClean Component - Main Container
 * Phase 4: Modular Component Architecture
 */

class HomeClean {
    constructor() {
        this.container = null;
        this.cards = new Map();
        this.holidayModal = null;
        this.eventListeners = new Map();
    }

    /**
     * Initialize the HomeClean component
     */
    async init(rootElement) {
        try {
            console.log('[HomeClean] Initializing component...');
            
            // Create main container
            this.container = this.createContainer();
            
            // Mount to root element - replace existing content
            if (rootElement) {
                // Clear existing content but preserve structure
                this.preserveExistingContent(rootElement);
                rootElement.appendChild(this.container);
            } else {
                console.error('[HomeClean] No root element provided');
                return false;
            }

            // Initialize holiday modal
            this.holidayModal = new window.HolidayModal();
            
            // Render all rails
            await this.renderAllRails();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('[HomeClean] Component initialized successfully');
            return true;

        } catch (error) {
            console.error('[HomeClean] Initialization failed:', error);
            return false;
        }
    }

    /**
     * Preserve existing content from homeSection
     */
    preserveExistingContent(rootElement) {
        // Find and preserve community and feedback sections
        const communitySection = rootElement.querySelector('#group-2-community');
        const feedbackSection = rootElement.querySelector('#group-5-feedback');
        
        // Clear the root element
        rootElement.innerHTML = '';
        
        // Re-add preserved sections to our container
        if (communitySection) {
            const communityContainer = this.container.querySelector('#community-container');
            if (communityContainer) {
                communityContainer.innerHTML = communitySection.innerHTML;
            }
        }
        
        if (feedbackSection) {
            const feedbackContainer = this.container.querySelector('#feedback-container');
            if (feedbackContainer) {
                feedbackContainer.innerHTML = feedbackSection.innerHTML;
            }
        }
    }

    /**
     * Create the main container element
     */
    createContainer() {
        const container = document.createElement('div');
        container.id = 'clean-root';
        container.className = 'home-clean-container';
        
        // Create containers in the order specified by Phase 5
        container.innerHTML = `
            <!-- 1. YourShowsContainer (2 rails: CW + Next Up) -->
            <div class="section" id="your-shows-container">
                <div class="section-header">
                    <h2 class="section-title">Your Shows</h2>
                    <button class="holiday-chip" onclick="openHolidayModal(this)">Holiday +</button>
                </div>
                
                <!-- Currently Watching Rail -->
                <div class="rail" id="cw-rail">
                    <div class="card-container"></div>
                </div>

                <!-- Next Up Rail -->
                <div class="rail" id="up-next-rail">
                    <div class="card-container"></div>
                </div>
            </div>

            <!-- 2. CommunityContainer (video + games) - Keep existing structure -->
            <div class="section" id="community-container">
                <!-- Community content will be preserved from existing structure -->
            </div>

            <!-- 3. ForYouContainer (3 genre rails) -->
            <div class="section" id="for-you-container">
                <div class="section-header">
                    <h2 class="section-title">For You</h2>
                    <button class="holiday-chip" onclick="openHolidayModal(this)">Holiday +</button>
                </div>
                
                <!-- Drama Rail -->
                <div class="rail" id="drama-rail">
                    <div class="card-container"></div>
                </div>

                <!-- Comedy Rail -->
                <div class="rail" id="comedy-rail">
                    <div class="card-container"></div>
                </div>

                <!-- Horror Rail -->
                <div class="rail" id="horror-rail">
                    <div class="card-container"></div>
                </div>
            </div>

            <!-- 4. InTheatersContainer (TMDB now_playing) -->
            <div class="section" id="in-theaters-container">
                <div class="section-header">
                    <h2 class="section-title">In Theaters</h2>
                </div>
                
                <!-- In Theaters Rail -->
                <div class="rail" id="in-theaters-rail">
                    <div class="card-container"></div>
                </div>
            </div>

            <!-- 5. FeedbackContainer (form) - Keep existing structure -->
            <div class="section" id="feedback-container">
                <!-- Feedback content will be preserved from existing structure -->
            </div>
        `;
        
        return container;
    }

    /**
     * Render all rails with appropriate card types
     */
    async renderAllRails() {
        try {
            console.log('[HomeClean] Rendering all rails...');
            
            // Get data from data layer
            const dataLayer = new window.HomeCleanData();
            
            // Enable mock mode for testing
            window.FLAGS = window.FLAGS || {};
            window.FLAGS.mockMode = true;
            
            // Render Currently Watching
            const cwData = await dataLayer.getCurrentlyWatching();
            console.log('[HomeClean] CW Data:', cwData);
            this.renderRail('cw-rail', cwData, 'cw');
            
            // Render Next Up
            const nextUpData = await dataLayer.getNextUp();
            console.log('[HomeClean] Next Up Data:', nextUpData);
            this.renderRail('up-next-rail', nextUpData, 'nextup');
            
            // Render For You rails
            const genres = ['Drama', 'Comedy', 'Horror'];
            for (const genre of genres) {
                const genreData = await dataLayer.getCuratedGenres(genre);
                console.log(`[HomeClean] ${genre} Data:`, genreData);
                this.renderRail(`${genre.toLowerCase()}-rail`, genreData, 'foryou');
            }
            
            // Render In Theaters
            const inTheatersData = await dataLayer.getInTheaters();
            console.log('[HomeClean] In Theaters Data:', inTheatersData);
            this.renderRail('in-theaters-rail', inTheatersData, 'foryou');
            
            console.log('[HomeClean] All rails rendered successfully');
            
        } catch (error) {
            console.error('[HomeClean] Failed to render rails:', error);
        }
    }

    /**
     * Render a specific rail with cards
     */
    renderRail(railId, data, cardType) {
        const rail = this.container.querySelector(`#${railId}`);
        if (!rail) {
            console.warn(`[HomeClean] Rail ${railId} not found`);
            return;
        }

        const container = rail.querySelector('.card-container');
        if (!container) {
            console.warn(`[HomeClean] Card container not found in ${railId}`);
            return;
        }
        
        container.innerHTML = '';

        if (!data || data.length === 0) {
            console.log(`[HomeClean] No data for ${railId}`);
            return;
        }

        console.log(`[HomeClean] Rendering ${data.length} ${cardType} cards in ${railId}`);

        // Create cards based on type
        data.forEach((item, index) => {
            try {
                const card = this.createCard(item, cardType, index);
                if (card) {
                    container.appendChild(card);
                }
            } catch (error) {
                console.error(`[HomeClean] Failed to create card ${index} for ${railId}:`, error);
            }
        });

        console.log(`[HomeClean] Rendered ${data.length} ${cardType} cards in ${railId}`);
    }

    /**
     * Create a card element based on type
     */
    createCard(item, cardType, index) {
        try {
            let card;
            
            switch (cardType) {
                case 'cw':
                    card = new window.CardCW(item);
                    break;
                case 'nextup':
                    card = new window.CardNextUp(item);
                    break;
                case 'foryou':
                    card = new window.CardForYou(item);
                    break;
                default:
                    console.warn(`[HomeClean] Unknown card type: ${cardType}`);
                    return document.createElement('div');
            }

            if (!card) {
                console.warn(`[HomeClean] Failed to create card instance for ${cardType}`);
                return document.createElement('div');
            }

            const cardElement = card.render();
            if (!cardElement) {
                console.warn(`[HomeClean] Failed to render card element for ${cardType}`);
                return document.createElement('div');
            }
            
            cardElement.dataset.cardIndex = index;
            cardElement.dataset.cardType = cardType;
            
            // Store card reference
            this.cards.set(`${cardType}-${index}`, card);
            
            return cardElement;
            
        } catch (error) {
            console.error(`[HomeClean] Error creating card for ${cardType}:`, error);
            return document.createElement('div');
        }
    }

    /**
     * Setup event listeners for the component
     */
    setupEventListeners() {
        // Handle action button clicks
        this.container.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const cardId = button.dataset.id;
            const card = button.closest('.card');
            const title = card?.querySelector('.title')?.textContent || 'Unknown';

            this.handleActionClick(action, cardId, title, card);
        });

        // Handle holiday button clicks
        this.container.addEventListener('click', (e) => {
            const holidayBtn = e.target.closest('.holiday-chip');
            if (!holidayBtn) return;

            const card = holidayBtn.closest('.card');
            const cardId = card?.dataset.id || 'unknown';
            const title = card?.querySelector('.title')?.textContent || 'Unknown';

            this.openHolidayModal(cardId, title);
        });
    }

    /**
     * Handle action button clicks
     */
    handleActionClick(action, cardId, title, cardElement) {
        console.log(`[HomeClean] Action clicked: ${action} for ${title}`);
        
        // Track analytics
        this.trackAction(action, cardId, title);
        
        // Execute action based on type
        switch (action) {
            case 'want':
                this.moveToWishlist(cardId, title);
                break;
            case 'watched':
                this.markAsWatched(cardId, title);
                break;
            case 'dismiss':
                this.dismissItem(cardId, title);
                break;
            case 'delete':
                this.deleteItem(cardId, title);
                break;
            default:
                console.warn(`[HomeClean] Unknown action: ${action}`);
        }
    }

    /**
     * Open holiday modal for a card
     */
    openHolidayModal(cardId, title) {
        if (this.holidayModal) {
            this.holidayModal.open({
                cardId,
                title,
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
        console.log(`[HomeClean] Assigning holiday ${holiday} to card ${cardId}`);
        
        // Store assignment
        const assignments = JSON.parse(localStorage.getItem('holidayAssignments') || '{}');
        assignments[cardId] = holiday;
        localStorage.setItem('holidayAssignments', JSON.stringify(assignments));
        
        // Update UI
        this.updateCardHoliday(cardId, holiday);
    }

    /**
     * Update card holiday display
     */
    updateCardHoliday(cardId, holiday) {
        const card = this.container.querySelector(`[data-id="${cardId}"]`);
        if (card) {
            const holidayChip = card.querySelector('.holiday-chip');
            if (holidayChip) {
                holidayChip.textContent = holiday;
                holidayChip.classList.add('assigned');
            }
        }
    }

    /**
     * Action handlers - delegate to existing functions
     */
    moveToWishlist(cardId, title) {
        if (window.moveItemV2) {
            window.moveItemV2(cardId, 'wishlist');
        }
    }

    markAsWatched(cardId, title) {
        if (window.moveItemV2) {
            window.moveItemV2(cardId, 'watched');
        }
    }

    dismissItem(cardId, title) {
        if (window.removeItemFromCurrentListV2) {
            window.removeItemFromCurrentListV2(cardId);
        }
    }

    deleteItem(cardId, title) {
        if (window.removeItemFromCurrentListV2) {
            window.removeItemFromCurrentListV2(cardId);
        }
    }

    /**
     * Track analytics
     */
    trackAction(action, cardId, title) {
        if (window.gtag) {
            window.gtag('event', 'home_clean_action', {
                action_type: action,
                card_id: cardId,
                card_title: title
            });
        }
    }

    /**
     * Refresh the component
     */
    async refresh() {
        console.log('[HomeClean] Refreshing component...');
        await this.renderAllRails();
    }

    /**
     * Destroy the component
     */
    destroy() {
        console.log('[HomeClean] Destroying component...');
        
        // Remove event listeners
        this.eventListeners.forEach((listener, element) => {
            element.removeEventListener(listener.event, listener.handler);
        });
        this.eventListeners.clear();
        
        // Destroy holiday modal
        if (this.holidayModal) {
            this.holidayModal.destroy();
            this.holidayModal = null;
        }
        
        // Clear cards
        this.cards.clear();
        
        // Remove container
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.container = null;
    }
}

// Export for global access
window.HomeClean = HomeClean;
