import { useState, useEffect } from 'react';

interface ScrollToTopArrowProps {
  threshold?: number; // Scroll threshold in pixels (default: 400)
  className?: string;
}

export default function ScrollToTopArrow({ threshold = 400, className = '' }: ScrollToTopArrowProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Show/hide arrow based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > threshold);
    };

    // Initial check
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-20 right-4 lg:bottom-24 lg:right-8 z-[9998] w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl ${className}`}
      style={{
        backgroundColor: 'var(--btn)',
        borderColor: 'var(--line)',
        color: 'var(--text)',
        border: '1px solid var(--line)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeInUp 0.3s ease-out'
      }}
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
}



