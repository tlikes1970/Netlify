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
        card.className = 'card up-card';  // FIXED: Use 'up-card' class, no actions/chip
        card.dataset.id = this.data.id;
        
        // Generate poster (no chip)
        const posterContainer = this.generatePosterContainer();
        
        // Generate content (title, meta, up-next line)
        const content = this.generateContent();
        
        card.appendChild(posterContainer);
        card.appendChild(content);
        
        this.element = card;
        return card;
    }

    /**
     * Generate poster container (no chip for read-only)
     */
    generatePosterContainer() {
        const container = document.createElement('div');
        container.className = 'poster-container';
        
        const poster = this.generatePoster();
        container.appendChild(poster);
        
        return container;
    }

    /**
     * Generate poster element
     */
    generatePoster() {
        const posterDiv = document.createElement('div');
        posterDiv.className = 'poster-wrap';
        
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
     * Generate card content (title, meta, up-next line - no blurb/actions)
     */
    generateContent() {
        const content = document.createElement('div');
        content.className = 'card-content';
        content.style.padding = '12px';  // FIXED: Explicit padding for consistency
        content.style.gap = '6px';
        
        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = this.data.title;
        
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = this.data.meta || '';
        
        const upNext = document.createElement('div');
        upNext.className = 'up-next-line';  // FIXED: Dedicated class for green line
        upNext.textContent = this.data.upNextLine || `Up next: S1E1 Oct 10, 2025`;  // Date stub
        
        content.appendChild(title);
        content.appendChild(meta);
        content.appendChild(upNext);
        
        return content;
    }

    /**
     * Generate SVG fallback poster
     */
    generatePosterSVG(title) {
        const svg = `
            <svg width="220" height="330" xmlns="http://www.w3.org/2000/svg">
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
window.CardNextUp = CardNextUp;