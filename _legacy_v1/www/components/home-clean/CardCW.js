/**
 * CardCW Component - Currently Watching Card
 * Phase 4: Modular Component Architecture
 */

class CardCW {
    constructor(data) {
        this.data = data;
        this.element = null;
    }

    /**
     * Render the Currently Watching card
     */
    render() {
        const card = document.createElement('div');
        card.className = 'card cw-card';  // FIXED: Use 'cw-card' class for CSS targeting
        card.dataset.id = this.data.id;
        
        // Generate poster with relative positioning for chip
        const posterContainer = this.generatePosterContainer();
        
        // Generate content without actions (handled separately)
        const content = this.generateContent();
        
        // Generate actions grid (no chip here)
        const actions = this.generateActions();
        
        card.appendChild(posterContainer);
        card.appendChild(content);
        card.appendChild(actions);
        
        this.element = card;
        return card;
    }

    /**
     * Generate poster container with holiday chip
     */
    generatePosterContainer() {
        const container = document.createElement('div');
        container.className = 'poster-container';  // FIXED: Relative pos for absolute chip
        
        const poster = this.generatePoster();
        const chip = this.generateHolidayChip();
        
        container.appendChild(poster);
        container.appendChild(chip);
        
        return container;
    }

    /**
     * Generate poster element
     */
    generatePoster() {
        const posterDiv = document.createElement('div');
        posterDiv.className = 'poster-wrap';  // FIXED: Use 'poster-wrap' for consistent CSS
        
        if (this.data.poster && this.data.poster !== 'null') {
            const img = document.createElement('img');
            img.src = this.data.poster;
            img.alt = this.data.title;
            img.className = 'poster';
            img.loading = 'lazy';
            img.style.width = '100%';
            img.style.aspectRatio = '2/3';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '10px';
            img.onerror = () => {
                img.style.display = 'none';
                const fallback = posterDiv.querySelector('.poster-fallback');
                if (fallback) {
                    fallback.style.display = 'flex';
                    fallback.style.alignItems = 'center';
                    fallback.style.justifyContent = 'center';
                    fallback.style.background = '#f3f4f6';
                }
            };
            posterDiv.appendChild(img);
        }
        
        // Always append fallback
        const fallback = document.createElement('div');
        fallback.className = 'poster-fallback';
        fallback.style.display = 'flex';
        fallback.style.alignItems = 'center';
        fallback.style.justifyContent = 'center';
        fallback.style.background = '#f3f4f6';
        fallback.innerHTML = this.generatePosterSVG(this.data.title);
        posterDiv.appendChild(fallback);
        
        return posterDiv;
    }

    /**
     * Generate holiday chip as separate element
     */
    generateHolidayChip() {
        const chip = document.createElement('div');
        chip.className = 'holiday-chip';
        chip.dataset.id = this.data.id;
        chip.textContent = 'Holiday +';
        chip.title = 'Add to Holiday';
        chip.style.position = 'absolute';
        chip.style.top = '8px';
        chip.style.right = '8px';
        chip.style.zIndex = '2';
        chip.style.padding = '4px 8px';
        chip.style.borderRadius = '999px';
        chip.style.border = '1px solid #3a4250';
        chip.style.background = 'rgba(43,99,255,.12)';
        chip.style.color = '#93c5fd';
        chip.style.fontSize = '11px';
        chip.style.fontWeight = '600';
        chip.style.cursor = 'pointer';
        return chip;
    }

    /**
     * Generate card content (title, meta, blurb)
     */
    generateContent() {
        const content = document.createElement('div');
        content.className = 'card-content';
        
        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = this.data.title;
        
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = this.data.meta || '';
        
        const blurb = document.createElement('div');
        blurb.className = 'blurb';
        blurb.textContent = this.data.blurb || '';
        
        content.appendChild(title);
        content.appendChild(meta);
        content.appendChild(blurb);
        
        return content;
    }

    /**
     * Generate action buttons for CW cards (2x2 grid, no chip)
     */
    generateActions() {
        const actions = document.createElement('div');
        actions.className = 'cw-actions';  // FIXED: Dedicated class for grid
        
        const buttons = [
            { action: 'want', text: 'Want to Watch' },
            { action: 'watched', text: 'Watched' },
            { action: 'dismiss', text: 'Not Interested' },
            { action: 'delete', text: 'Delete' }
        ];
        
        buttons.forEach(btnData => {
            const button = document.createElement('button');
            button.className = 'action-btn';
            button.dataset.action = btnData.action;
            button.dataset.id = this.data.id;
            button.textContent = btnData.text;
            
            actions.appendChild(button);
        });
        
        // Remove debug styling - use proper CSS classes instead
        actions.className = 'cw-actions';
        
        console.log(`[CardCW] Generated actions container with ${buttons.length} buttons for ${this.data.title}`);
        
        return actions;
    }

    /**
     * Generate SVG fallback poster
     */
    generatePosterSVG(title) {
        const svg = `
            <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f3f4f6"/>
                <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
                      font-family="system-ui, Segoe UI, Roboto" font-size="14" fill="#6b7280">
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
            const newCard = this.render();
            this.element.parentNode.replaceChild(newCard, this.element);
            this.element = newCard;
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
window.CardCW = CardCW;