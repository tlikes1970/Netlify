/**
 * HomeClean Component - Main Container
 * Phase 4: Modular Component Architecture – FIXED: Complete template literal, syntax sealed
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
            
            // Preserve existing content BEFORE creating new container
            const preservedContent = this.preserveExistingContent(rootElement);
            
            // Create main container
            this.container = this.createContainer();
            
            // Mount to root element - replace existing content
            if (rootElement) {
                // FIXED: Clear only if not HomeClean content
                if (!rootElement.querySelector('#clean-root')) {
                    rootElement.innerHTML = '';
                }
                
                // Append our new container
                rootElement.appendChild(this.container);
                
                // Restore preserved content to our new container
                this.restorePreservedContent(preservedContent);
                
                console.log('[HomeClean] Content replaced successfully');
            } else {
                console.error('[HomeClean] No root element provided');
                return false;
            }

            // Initialize holiday modal
            this.holidayModal = new window.HolidayModal();
            
            // DEBUG: Monitor holiday chip visibility
            this.setupHolidayChipDebug();
                
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
        // Find and preserve community and feedback sections BEFORE clearing
        const communitySection = rootElement.querySelector('#group-2-community');
        const feedbackSection = rootElement.querySelector('#group-5-feedback');
        
        // Store the preserved content
        const preservedContent = {
            community: communitySection ? communitySection.cloneNode(true) : null,
            feedback: feedbackSection ? feedbackSection.cloneNode(true) : null
        };
        
        if (preservedContent.community) {
            console.log('[HomeClean] Preserved community section');
        }
        
        if (preservedContent.feedback) {
            console.log('[HomeClean] Preserved feedback section');
        }
        
        return preservedContent;
    }
    
    restorePreservedContent(preservedContent) {
        // Restore community content
        if (preservedContent.community) {
            const communityContainer = this.container.querySelector('#community-container');
            if (communityContainer) {
                communityContainer.innerHTML = preservedContent.community.innerHTML;
                console.log('[HomeClean] Restored community content');
            }
        }
        
        // Restore feedback content
        if (preservedContent.feedback) {
            const feedbackContainer = this.container.querySelector('#feedback-container');
            if (feedbackContainer) {
                feedbackContainer.innerHTML = preservedContent.feedback.innerHTML;
                console.log('[HomeClean] Restored feedback content');
            }
        }
    }

    /**
     * Create the main container element with exact mockup structure – FIXED: Full template, no truncation
     */
    createContainer() {
        const container = document.createElement('div');
        container.id = 'clean-root';
        container.className = 'home-clean-container';
        
        // FIXED: Complete innerHTML template – all 5 groups, sealed backticks
        container.innerHTML = `
            <!-- 1. Your Shows Container (2 rails: CW + Next Up) -->
            <div class="clean-group" id="your-shows-container">
                <div class="group-header">
                    <h2 class="group-title">Your Shows</h2>
                </div>
                <div class="group-divider"></div>
                
                <!-- Currently Watching Subsection -->
                <div class="home-preview-row">
                    <h3>Currently Watching</h3>
                    <div class="rail" id="cw-rail"></div>
                </div>

                <!-- Next Up Subsection -->
                <div class="home-preview-row">
                    <h3>Up Next</h3>
                    <div class="rail" id="up-next-rail"></div>
                </div>
            </div>

            <!-- 2. Community Container (video + games) -->
            <div class="clean-group" id="community-container">
                <div class="group-header">
                    <h2 class="group-title">Community</h2>
                </div>
                <div class="group-divider"></div>
                <div class="community-split">
                    <div class="now-playing">
                        <div class="video-placeholder">
                            Now Playing: Collective Chaos
                        </div>
                    </div>
                    <div class="games-column">
                        <div class="game-card" onclick="openModal('flickword')">
                            <h3>Flickword</h3>
                            <p>Wordplay in the Dark</p>
                        </div>
                        <div class="game-card" onclick="openModal('trivia')">
                            <h3>Trivia</h3>
                            <p>Cinematic Crucible</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3. For You Container (3 genre rails) -->
            <div class="clean-group" id="for-you-container">
                <div class="group-header">
                    <h2 class="group-title">For You</h2>
                </div>
                <div class="group-divider"></div>
                
                <div class="home-preview-row">
                    <h3>Drama</h3>
                    <div class="rail" id="drama-rail"></div>
                </div>
                
                <div class="home-preview-row">
                    <h3>Comedy</h3>
                    <div class="rail" id="comedy-rail"></div>
                </div>
                
                <div class="home-preview-row">
                    <h3>Horror</h3>
                    <div class="rail" id="horror-rail"></div>
                </div>
            </div>

            <!-- 4. In Theaters Container -->
            <div class="clean-group" id="in-theaters-container">
                <div class="group-header">
                    <h2 class="group-title">In Theaters Near You</h2>
                </div>
                <div class="group-divider"></div>
                <div class="theater-info">
                    <h3>AMC Empire 25</h3>
                    <p>234 West 42nd Street<br>New York, NY 10036<br>2.3mi Away • (212) 398-2595</p>
                </div>
                <div class="rail" id="in-theaters-rail"></div>
            </div>

            <!-- 5. Feedback Container -->
            <div class="clean-group" id="feedback-container">
                <div class="group-header">
                    <h2 class="group-title">Feedback</h2>
                </div>
                <div class="group-divider"></div>
                <form class="feedback-form">
                    <textarea placeholder="Scream into the void... What devours your soul about Flicklet?"></textarea>
                    <button type="submit">Unleash the Echo</button>
                </form>
            </div>
        `;
        
        console.log('[HomeClean] Container created with full structure');  // FIXED: Log for mount debug
        
        return container;
    }

    /**
     * Render all rails with real data from appData
     */
    async renderAllRails() {
        console.log('[HomeClean] Rendering all rails...');
        
        // Use real data from appData if available
        const appData = window.appData || {};
        const tvData = appData.tv || {};
        const moviesData = appData.movies || {};
        
        console.log('[HomeClean] AppData available:', !!appData);
        console.log('[HomeClean] TV data:', tvData);
        console.log('[HomeClean] Movies data:', moviesData);
        
        // FIXED: Combine TV and movies for Currently Watching (as per tab design)
        const tvWatching = tvData.watching || [];
        const movieWatching = moviesData.watching || [];
        const combinedWatching = [...tvWatching, ...movieWatching];
        
        console.log('[HomeClean] Combined watching:', combinedWatching);
        
        // Get real data or fallback to mock data
        const realData = {
            cw: combinedWatching.length > 0 ? combinedWatching : this.generateMockData('cw', 3),
            nextup: tvData.watching?.slice(0, 3) || this.generateMockData('nextup', 3),
            foryou: {
                drama: moviesData.wishlist?.slice(0, 4) || this.generateMockData('foryou', 4, 'Drama'),
                comedy: moviesData.wishlist?.slice(4, 8) || this.generateMockData('foryou', 4, 'Comedy'),
                horror: moviesData.wishlist?.slice(8, 12) || this.generateMockData('foryou', 4, 'Horror')
            },
            theaters: moviesData.watching?.slice(0, 6) || this.generateMockData('theaters', 6, 'Theater')
        };
        
        console.log('[HomeClean] Real data prepared for rendering');
        
        // Render CW rail
        await this.renderRail('cw-rail', 'cw', realData.cw);
        
        // Render Next Up rail
        await this.renderRail('up-next-rail', 'nextup', realData.nextup);
        
        // Render For You rails
        await this.renderRail('drama-rail', 'foryou', realData.foryou.drama, 'Drama');
        await this.renderRail('comedy-rail', 'foryou', realData.foryou.comedy, 'Comedy');
        await this.renderRail('horror-rail', 'foryou', realData.foryou.horror, 'Horror');
        
        // Render Theaters rail
        await this.renderRail('in-theaters-rail', 'theaters', realData.theaters);
        
        console.log('[HomeClean] All rails rendered successfully');
    }

    /**
     * Generate mock data for rails – FIXED: Genre param for FY, upNextLine for NextUp
     */
    generateMockData(type, count, genre = '') {
        const baseData = {
            id: Math.random().toString(36).substr(2, 9),
            title: `${genre || type.charAt(0).toUpperCase() + type.slice(1)} Show ${Math.floor(Math.random() * 1000)}`,
            meta: `${genre || type.toUpperCase()} • Oct 10, 2025`,
            blurb: 'Short blurb that truncates neatly to fit the card height without overflow. Oct 10, 2025 vibes.',
            poster: null  // FIXED: Use null to trigger fallback SVG
        };
        
        if (type === 'nextup') {
            baseData.upNextLine = 'Up next: S1E1 Oct 10, 2025';
            delete baseData.blurb;  // No blurb for read-only
        }
        
        if (type === 'theaters') {
            baseData.meta = 'Now Playing • Oct 10, 2025';
        }
        
        return Array.from({length: count}, (_, i) => ({
            ...baseData,
            id: baseData.id + i,
            title: baseData.title + ` #${i + 1}`
        }));
    }

    /**
     * Render a single rail – FIXED: Genre param for logging
     */
    async renderRail(railId, cardType, data, genre = '') {
        const rail = this.container.querySelector(`#${railId}`);
        if (!rail) {
            console.warn(`[HomeClean] Rail #${railId} not found`);
            return;
        }
        
        console.log(`[HomeClean] Rendering ${data.length} ${cardType} cards${genre ? ` (${genre})` : ''} in #${railId}`);
        
        // Clear existing cards
        rail.innerHTML = '';
        
        // Render cards
        data.forEach((item, index) => {
            const cardElement = this.createCard(item, cardType, index);
            if (cardElement) {
                rail.appendChild(cardElement);
            } else {
                console.warn(`[HomeClean] Skipped invalid card at index ${index} in ${railId}`);
            }
        });
        
        console.log(`[HomeClean] Rendered ${data.length} cards in #${railId}`);
    }

    /**
     * Create a card instance based on type – FIXED: Null-check on render, ARIA bonus
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
                case 'theaters':
                    card = new window.CardForYou(item);  // Reuse FY for theaters (simple card)
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
            
            // FIXED: ARIA for accessibility
            cardElement.setAttribute('role', 'article');
            cardElement.setAttribute('tabindex', '0');
            
            // Store card reference
            this.cards.set(`${cardType}-${index}`, card);
            
            return cardElement;
            
        } catch (error) {
            console.error(`[HomeClean] Error creating card for ${cardType}:`, error);
            return document.createElement('div');
        }
    }

    /**
     * Setup event listeners for interactions
     */
    setupEventListeners() {
        console.log('[HomeClean] Setting up event listeners...');
        
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

        // FIXED: Global escape for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.holidayModal && this.holidayModal.isOpen) {
                this.holidayModal.close();
            }
        });
        
        console.log('[HomeClean] Event listeners set up');
        
        // Listen for data ready events to refresh rails
        document.addEventListener('app:data:ready', (event) => {
            console.log('[HomeClean] Data ready event received, refreshing rails...', event.detail);
            this.refresh();
        });
        
        // Listen for cards changed events
        document.addEventListener('cards:changed', (event) => {
            console.log('[HomeClean] Cards changed event received, refreshing rails...', event.detail);
            this.refresh();
        });
        
        // Listen for item added/removed events
        document.addEventListener('item:added', (event) => {
            console.log('[HomeClean] Item added event received, refreshing rails...', event.detail);
            this.refresh();
        });
        
        document.addEventListener('item:removed', (event) => {
            console.log('[HomeClean] Item removed event received, refreshing rails...', event.detail);
            this.refresh();
        });
        
        // Old rendering system removed - no interference possible
    }


    /**
     * DEBUG: Setup holiday chip visibility monitoring
     */
    setupHolidayChipDebug() {
        // Holiday debug disabled to reduce console noise
        // console.log('[HOLIDAY DEBUG] Setting up holiday chip monitoring...');
        
        // Monitor for holiday chips being added/removed
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const holidayChips = node.querySelectorAll ? node.querySelectorAll('.holiday-chip') : [];
                            holidayChips.forEach(chip => {
                                // Holiday debug disabled
                                // console.log(`[HOLIDAY DEBUG] Holiday chip ADDED at ${new Date().toISOString()}:`, chip);
                                this.monitorChipVisibility(chip);
                            });
                            
                            if (node.classList && node.classList.contains('holiday-chip')) {
                                // Holiday debug disabled
                                // console.log(`[HOLIDAY DEBUG] Holiday chip ADDED at ${new Date().toISOString()}:`, node);
                                this.monitorChipVisibility(node);
                            }
                        }
                    });
                    
                    mutation.removedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && node.classList && node.classList.contains('holiday-chip')) {
                            // Holiday debug disabled
                            // console.log(`[HOLIDAY DEBUG] Holiday chip REMOVED at ${new Date().toISOString()}:`, node);
                        }
                    });
                }
                
                if (mutation.type === 'attributes' && mutation.target.classList && mutation.target.classList.contains('holiday-chip')) {
                    const chip = mutation.target;
                    const visibility = window.getComputedStyle(chip).visibility;
                    const display = window.getComputedStyle(chip).display;
                    const opacity = window.getComputedStyle(chip).opacity;
                    
                    if (visibility === 'hidden' || display === 'none' || opacity === '0') {
                        // Holiday debug disabled
                        // console.log(`[HOLIDAY DEBUG] Holiday chip HIDDEN at ${new Date().toISOString()}:`, {
                        //     visibility,
                        //     display,
                        //     opacity,
                        //     chip
                        // });
                    }
                }
            });
        });
        
        // Start observing
        observer.observe(this.container, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        // Also check existing chips
        setTimeout(() => {
            const existingChips = this.container.querySelectorAll('.holiday-chip');
            // Holiday debug disabled
            // console.log(`[HOLIDAY DEBUG] Found ${existingChips.length} existing holiday chips at ${new Date().toISOString()}`);
            existingChips.forEach(chip => this.monitorChipVisibility(chip));
        }, 1000);
    }
    
    /**
     * DEBUG: Monitor individual chip visibility
     */
    monitorChipVisibility(chip) {
        const checkVisibility = () => {
            const rect = chip.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(chip);
            
            const isVisible = rect.width > 0 && rect.height > 0 && 
                             computedStyle.visibility !== 'hidden' && 
                             computedStyle.display !== 'none' && 
                             computedStyle.opacity !== '0';
            
            if (!isVisible) {
                // Holiday debug disabled
                // console.log(`[HOLIDAY DEBUG] Holiday chip BECAME INVISIBLE at ${new Date().toISOString()}:`, {
                //     rect: { width: rect.width, height: rect.height },
                //     visibility: computedStyle.visibility,
                //     display: computedStyle.display,
                //     opacity: computedStyle.opacity,
                //     chip
                // });
            }
        };
        
        // Check immediately and then periodically
        checkVisibility();
        const interval = setInterval(checkVisibility, 500);
        
        // Stop monitoring after 30 seconds
        setTimeout(() => clearInterval(interval), 30000);
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
        } else {
            console.warn('[HomeClean] HolidayModal not initialized');
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
     * Update card holiday display – FIXED: Badge insertion if no chip
     */
    updateCardHoliday(cardId, holiday) {
        const card = this.container.querySelector(`[data-id="${cardId}"]`);
        if (card) {
            let holidayChip = card.querySelector('.holiday-chip');
            if (!holidayChip) {
                // FIXED: Create badge if chip missing
                holidayChip = document.createElement('div');
                holidayChip.className = 'holiday-badge';
                const titleEl = card.querySelector('.title');
                if (titleEl) {
                    titleEl.parentNode.insertBefore(holidayChip, titleEl.nextSibling);
                }
            }
            holidayChip.textContent = `Holiday: ${holiday}`;
            holidayChip.classList.add('assigned');
        }
    }

    /**
     * Refresh the component by re-rendering all rails
     */
    refresh() {
        console.log('[HomeClean] Refreshing component...');
        this.renderAllRails();
    }

    /**
     * Global refresh function for external access
     */
    static refreshGlobal() {
        if (window.homeCleanInstance) {
            console.log('[HomeClean] Global refresh called');
            window.homeCleanInstance.refresh();
        } else {
            console.warn('[HomeClean] No instance available for global refresh');
        }
    }

    /**
     * Action handlers - delegate to existing functions
     */
    moveToWishlist(cardId, title) {
        console.log(`[HomeClean] Moving ${title} to wishlist`);
        if (window.moveItemV2) {
            window.moveItemV2(cardId, 'wishlist');
        } else if (window.moveItem) {
            window.moveItem(cardId, 'wishlist');
        } else {
            console.warn('[HomeClean] No moveItem function available');
        }
        // FIXED: Refresh rails after mutation
        this.refresh();
    }

    markAsWatched(cardId, title) {
        console.log(`[HomeClean] Marking ${title} as watched`);
        if (window.moveItemV2) {
            window.moveItemV2(cardId, 'watched');
        } else if (window.moveItem) {
            window.moveItem(cardId, 'watched');
        } else {
            console.warn('[HomeClean] No moveItem function available');
        }
        // FIXED: Refresh rails after mutation
        this.refresh();
    }

    dismissItem(cardId, title) {
        console.log(`[HomeClean] Dismissing ${title}`);
        if (window.removeItemFromCurrentListV2) {
            window.removeItemFromCurrentListV2(cardId);
        } else if (window.removeItemFromCurrentList) {
            window.removeItemFromCurrentList(cardId);
        } else {
            console.warn('[HomeClean] No removeItem function available');
        }
        // FIXED: Refresh rails after mutation
        this.refresh();
    }

    deleteItem(cardId, title) {
        console.log(`[HomeClean] Deleting ${title}`);
        if (window.removeItemFromCurrentListV2) {
            window.removeItemFromCurrentListV2(cardId);
        } else if (window.removeItemFromCurrentList) {
            window.removeItemFromCurrentList(cardId);
        } else {
            console.warn('[HomeClean] No removeItem function available');
        }
        // FIXED: Refresh rails after mutation
        this.refresh();
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
        
        // Clear cards – FIXED: Destroy each card instance
        this.cards.forEach(card => card.destroy ? card.destroy() : null);
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

console.log('[HomeClean] Constructor exported – ready for resurrection!');  // FIXED: Debug log on load