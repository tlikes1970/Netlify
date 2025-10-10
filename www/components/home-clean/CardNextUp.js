/**
 * CardNextUp Component - Next Up Card
 * Phase 4: Modular Component Architecture
 */

class CardNextUp {
    constructor(data) {
        this.data = data;
        this.element = null;
    }

    /**
     * Render the Next Up card
     */
    render() {
        const card = document.createElement('div');
        card.className = 'card card-nextup';
        card.dataset.id = this.data.id;
        
        // Generate poster
        const poster = this.generatePoster();
        
        // Generate actions
        const actions = this.generateActions();
        
        card.innerHTML = `
            <div class="poster-container">
                ${poster}
            </div>
            <div class="card-content">
                <div class="title">${this.data.title}</div>
                <div class="meta">${this.data.meta || ''}</div>
                <div class="blurb">${this.data.blurb || ''}</div>
                <div class="actions">
                    ${actions}
                </div>
            </div>
        `;
        
        this.element = card;
        return card;
    }

    /**
     * Generate poster element
     */
    generatePoster() {
        if (this.data.poster && this.data.poster !== 'null') {
            return `
                <img 
                    src="${this.data.poster}" 
                    alt="${this.data.title}"
                    class="poster"
                    loading="lazy"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                />
                <div class="poster-fallback" style="display:none;">
                    ${this.generatePosterSVG(this.data.title)}
                </div>
            `;
        } else {
            return `
                <div class="poster-fallback">
                    ${this.generatePosterSVG(this.data.title)}
                </div>
            `;
        }
    }

    /**
     * Generate action buttons for Next Up cards
     */
    generateActions() {
        return `
            <button class="action-btn" data-action="want" data-id="${this.data.id}">
                Want to Watch
            </button>
            <button class="action-btn" data-action="watched" data-id="${this.data.id}">
                Watched
            </button>
            <button class="action-btn" data-action="dismiss" data-id="${this.data.id}">
                Not Interested
            </button>
            <button class="action-btn" data-action="delete" data-id="${this.data.id}">
                Delete
            </button>
            <div class="holiday-chip" data-id="${this.data.id}">
                Holiday +
            </div>
        `;
    }

    /**
     * Generate SVG fallback poster
     */
    generatePosterSVG(title) {
        const svg = `
            <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#1a1a1a"/>
                <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
                      font-family="Arial, sans-serif" font-size="14" fill="#888">
                    ${title}
                </text>
            </svg>
        `;
        return `<img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}" alt="${title}" class="poster-fallback-img" />`;
    }

    /**
     * Update card data
     */
    updateData(newData) {
        this.data = { ...this.data, ...newData };
        if (this.element) {
            this.render();
        }
    }

    /**
     * Destroy the card
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}

// Export for global access
window.CardNextUp = CardNextUp;
