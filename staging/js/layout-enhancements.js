/**
 * Process: Layout Enhancements
 * Purpose: Implement high-priority layout fixes including skeleton loaders and scroll indicators
 * Data Source: Layout audit findings and accessibility requirements
 * Update Path: Modify this file to adjust enhancement behavior
 * Dependencies: DOM elements with specific classes and IDs
 */

(function() {
  'use strict';
  
  console.log('🔧 Layout Enhancements loaded');
  
  // Skeleton Loader Management
  const SkeletonManager = {
    // Show skeleton for an element
    showSkeleton(element, skeletonType = 'card') {
      if (!element) return;
      
      element.classList.add('loading');
      element.setAttribute('aria-busy', 'true');
      
      // Add appropriate skeleton class
      const skeletonClass = `skeleton-${skeletonType}`;
      element.classList.add(skeletonClass);
      
      // Add skeleton content based on type
      this.addSkeletonContent(element, skeletonType);
    },
    
    // Hide skeleton and show content
    hideSkeleton(element) {
      if (!element) return;
      
      element.classList.remove('loading');
      element.classList.add('loaded');
      element.removeAttribute('aria-busy');
      
      // Remove skeleton classes
      const skeletonClasses = element.className.match(/skeleton-\w+/g);
      if (skeletonClasses) {
        skeletonClasses.forEach(cls => element.classList.remove(cls));
      }
      
      // Remove skeleton content
      this.removeSkeletonContent(element);
    },
    
    // Add skeleton content based on type
    addSkeletonContent(element, type) {
      const skeletonContent = this.createSkeletonContent(type);
      if (skeletonContent) {
        element.appendChild(skeletonContent);
      }
    },
    
    // Remove skeleton content
    removeSkeletonContent(element) {
      const skeletonElements = element.querySelectorAll('.skeleton-content, .skeleton-poster, .skeleton-text, .skeleton-button');
      skeletonElements.forEach(el => el.remove());
    },
    
    // Create skeleton content based on type
    createSkeletonContent(type) {
      const container = document.createElement('div');
      container.className = 'skeleton-content';
      
      switch (type) {
        case 'show-card':
          container.innerHTML = `
            <div class="skeleton-poster"></div>
            <div class="skeleton-text skeleton-text-large"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text skeleton-text-small"></div>
            <div class="skeleton-actions">
              <div class="skeleton-button"></div>
              <div class="skeleton-button"></div>
              <div class="skeleton-button"></div>
            </div>
          `;
          break;
          
        case 'preview-card':
          container.innerHTML = `
            <div class="skeleton-poster"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text skeleton-text-small"></div>
          `;
          break;
          
        case 'quote':
          container.innerHTML = `
            <div class="skeleton-text" style="width: 80%;"></div>
            <div class="skeleton-text" style="width: 60%;"></div>
          `;
          break;
          
        case 'list-item':
          container.innerHTML = `
            <div class="skeleton-text"></div>
            <div class="skeleton-text skeleton-text-small"></div>
          `;
          break;
          
        default:
          container.innerHTML = `
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text skeleton-text-small"></div>
          `;
      }
      
      return container;
    }
  };
  
  // Scroll Indicator Management
  const ScrollIndicatorManager = {
  // Initialize scroll indicators for all carousels
  init() {
    const carousels = document.querySelectorAll('.preview-row-scroll');
    carousels.forEach(carousel => this.addScrollIndicators(carousel));
  },
    
    // Add scroll indicators to a carousel
    addScrollIndicators(carousel) {
      if (!carousel) return;
      
      // Add scroll event listener
      carousel.addEventListener('scroll', () => this.updateScrollIndicators(carousel));
      
      // Initial check
      this.updateScrollIndicators(carousel);
    },
    
    // Update scroll indicators based on scroll position
    updateScrollIndicators(carousel) {
      const scrollLeft = carousel.scrollLeft;
      const scrollWidth = carousel.scrollWidth;
      const clientWidth = carousel.clientWidth;
      
      // Check if content is scrollable
      const isScrollable = scrollWidth > clientWidth;
      
      if (isScrollable) {
        carousel.classList.add('scrollable');
        
        // Add left indicator if scrolled
        if (scrollLeft > 0) {
          carousel.classList.add('scrollable-left');
        } else {
          carousel.classList.remove('scrollable-left');
        }
        
        // Add right indicator if more content to scroll
        if (scrollLeft < scrollWidth - clientWidth - 1) {
          carousel.classList.add('scrollable-right');
        } else {
          carousel.classList.remove('scrollable-right');
        }
      } else {
        carousel.classList.remove('scrollable', 'scrollable-left', 'scrollable-right');
      }
    }
  };
  
  // Aspect Ratio Enforcement
  const AspectRatioManager = {
    // Ensure all images maintain aspect ratio
    enforceAspectRatio() {
      const images = document.querySelectorAll('.show-poster, .poster-placeholder, .preview-card-poster img');
      
      images.forEach(img => {
        // Add aspect ratio if not present
        if (!img.style.aspectRatio) {
          img.style.aspectRatio = '2 / 3';
        }
        
        // Ensure object-fit is set
        if (!img.style.objectFit) {
          img.style.objectFit = 'cover';
        }
      });
    },
    
    // Handle image loading
    handleImageLoad(img) {
      img.addEventListener('load', () => {
        // Ensure aspect ratio is maintained
        img.style.aspectRatio = '2 / 3';
        img.style.objectFit = 'cover';
      });
      
      img.addEventListener('error', () => {
        // Show placeholder if image fails to load
        img.style.background = 'var(--border)';
        img.style.aspectRatio = '2 / 3';
      });
    }
  };
  
  // Skip Link Management
  const SkipLinkManager = {
    // Initialize skip links
    init() {
      const skipLinks = document.querySelectorAll('.skip-link');
      
      skipLinks.forEach(link => {
        link.addEventListener('click', (e) => this.handleSkipLink(e, link));
      });
    },
    
    // Handle skip link clicks
    handleSkipLink(e, link) {
      e.preventDefault();
      
      const targetId = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      
      if (target) {
        // Focus the target element
        target.focus();
        
        // Scroll to target if it's not visible
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Announce to screen readers
        this.announceSkip(target);
      }
    },
    
    // Announce skip to screen readers
    announceSkip(target) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Skipped to ${target.getAttribute('aria-label') || target.textContent || 'content'}`;
      
      document.body.appendChild(announcement);
      
      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  };
  
  // Initialize all enhancements
  function initLayoutEnhancements() {
    console.log('🔧 Initializing layout enhancements...');
    
    // Initialize scroll indicators
    ScrollIndicatorManager.init();
    
    // Initialize skip links
    SkipLinkManager.init();
    
    // Enforce aspect ratios
    AspectRatioManager.enforceAspectRatio();
    
    // Handle dynamic content loading
    observeDynamicContent();
    
    console.log('✅ Layout enhancements initialized');
  }
  
  // Observe dynamic content for skeleton loading
  function observeDynamicContent() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if it's a card that needs skeleton loading
              if (node.classList && node.classList.contains('show-card')) {
                // Show skeleton while content loads
                SkeletonManager.showSkeleton(node, 'show-card');
                
                // Simulate loading delay (replace with actual loading logic)
                setTimeout(() => {
                  SkeletonManager.hideSkeleton(node);
                }, 1000);
              }
            }
          });
        }
      });
    });
    
    // Observe the main content areas
    const contentAreas = document.querySelectorAll('#homeSection, .list-container, .preview-row-scroll, .tab-section');
    contentAreas.forEach(area => {
      observer.observe(area, { childList: true, subtree: true });
    });
  }
  
  // Expose managers globally for external use
  window.LayoutEnhancements = {
    SkeletonManager,
    ScrollIndicatorManager,
    AspectRatioManager,
    SkipLinkManager
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLayoutEnhancements);
  } else {
    initLayoutEnhancements();
  }
  
})();
