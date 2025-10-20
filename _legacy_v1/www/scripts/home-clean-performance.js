/**
 * Home Clean Performance Optimizations
 * Phase 4: Modular Component Architecture
 */

class HomeCleanPerformance {
    constructor() {
        this.observers = new Map();
        this.rafId = null;
        this.updateQueue = [];
    }

    /**
     * Initialize performance optimizations
     */
    init() {
        this.setupIntersectionObserver();
        this.setupRAFUpdates();
        console.log('[HomeCleanPerformance] Performance optimizations initialized');
    }

    /**
     * Setup intersection observer for lazy loading
     */
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            console.warn('[HomeCleanPerformance] IntersectionObserver not supported');
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.handleImageLoad(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px'
        });

        this.observers.set('images', observer);
    }

    /**
     * Handle image loading
     */
    handleImageLoad(img) {
        if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }
    }

    /**
     * Setup request animation frame updates
     */
    setupRAFUpdates() {
        const processUpdates = () => {
            if (this.updateQueue.length > 0) {
                const updates = this.updateQueue.splice(0);
                updates.forEach(update => update());
            }
            this.rafId = requestAnimationFrame(processUpdates);
        };
        
        this.rafId = requestAnimationFrame(processUpdates);
    }

    /**
     * Queue DOM update for next frame
     */
    queueUpdate(updateFn) {
        this.updateQueue.push(updateFn);
    }

    /**
     * Optimize card rendering
     */
    optimizeCardRendering(cards) {
        // Batch DOM operations
        const fragment = document.createDocumentFragment();
        
        cards.forEach(card => {
            fragment.appendChild(card);
        });
        
        return fragment;
    }

    /**
     * Debounce function calls
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function calls
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Preload critical images
     */
    preloadImages(urls) {
        urls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }

    /**
     * Measure performance
     */
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        console.log(`[HomeCleanPerformance] ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
            loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
            domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
            firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
        };
    }

    /**
     * Cleanup performance optimizations
     */
    destroy() {
        // Cleanup observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        // Cancel RAF
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        // Clear update queue
        this.updateQueue = [];
        
        console.log('[HomeCleanPerformance] Performance optimizations destroyed');
    }
}

// Create global performance instance
window.HomeCleanPerformance = new HomeCleanPerformance();

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.HomeCleanPerformance.init();
});

console.log('[HomeCleanPerformance] Performance optimizations loaded');
