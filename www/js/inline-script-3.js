
      (function() {
        // Single mobile detection system - viewport width only
        function applyMobileClass() {
          const isMobileSize = window.innerWidth <= 768;
          
          if (isMobileSize && document.body) {
            document.body.classList.add('mobile');
            console.log('📱 Mobile class applied - viewport width:', window.innerWidth);
          }
        }
        
        // Apply immediately if body is ready
        if (document.body) {
          applyMobileClass();
        } else {
          // Wait for DOM ready
          document.addEventListener('DOMContentLoaded', applyMobileClass);
        }
        
        // Listen for resize events to update mobile class
        window.addEventListener('resize', () => {
          const isMobile = window.innerWidth <= 768;
          if (isMobile && !document.body.classList.contains('mobile')) {
            document.body.classList.add('mobile');
            console.log('📱 Mobile class added on resize');
          } else if (!isMobile && document.body.classList.contains('mobile')) {
            document.body.classList.remove('mobile');
            console.log('📱 Mobile class removed on resize');
          }
        });
      })();
    