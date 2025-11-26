import { useState, useRef } from 'react';

export type StarRatingProps = {
  value: number; // 0-5 stars (supports 0.5 increments)
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

/**
 * Interactive star rating component
 * - Shows 5 stars with half-star support (0.5 increments)
 * - Click left half = X.5 stars, right half = X stars
 * - Hover effects show preview
 * - Keyboard accessible: arrows adjust by 0.5
 */
export default function StarRating({ 
  value = 0, 
  onChange, 
  readOnly = false, 
  size = 'md',
  className = ''
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7', 
    lg: 'w-8 h-8'
  };
  
  // Handle click with half-star detection
  const handleClick = (star: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!readOnly && onChange) {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const isLeftHalf = clickX < rect.width / 2;
      
      // Left half = X - 0.5, right half = X
      const rating = isLeftHalf ? star - 0.5 : star;
      // Clamp to 0.5-5 range
      const normalizedRating = Math.max(0.5, Math.min(5, rating));
      onChange(normalizedRating);
    }
  };
  
  // Handle mouse move for half-star hover preview
  const handleMouseMove = (star: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!readOnly) {
      const rect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const isLeftHalf = mouseX < rect.width / 2;
      setHoverValue(isLeftHalf ? star - 0.5 : star);
    }
  };
  
  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(null);
    }
  };
  
  // Keyboard navigation (0.5 increments)
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (readOnly || !onChange) return;
    
    let newValue = value;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = Math.min(5, value + 0.5);
        event.preventDefault();
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = Math.max(0.5, value - 0.5);
        event.preventDefault();
        break;
      case 'Home':
        newValue = 0.5;
        event.preventDefault();
        break;
      case 'End':
        newValue = 5;
        event.preventDefault();
        break;
    }
    if (newValue !== value) {
      onChange(newValue);
    }
  };
  
  const displayValue = hoverValue !== null ? hoverValue : value;
  
  // Determine star fill state: empty, half, or full
  const getStarFill = (star: number): 'empty' | 'half' | 'full' => {
    if (displayValue >= star) return 'full';
    if (displayValue >= star - 0.5) return 'half';
    return 'empty';
  };
  
  return (
    <div 
      ref={containerRef}
      className={`flex items-center gap-1.5 ${className}`}
      role="slider"
      aria-valuemin={0.5}
      aria-valuemax={5}
      aria-valuenow={value}
      aria-valuetext={`${value} out of 5 stars`}
      tabIndex={readOnly ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fillState = getStarFill(star);
        
        return (
          <button
            key={star}
            type="button"
            onClick={(e) => handleClick(star, e)}
            onMouseMove={(e) => handleMouseMove(star, e)}
            onMouseLeave={handleMouseLeave}
            disabled={readOnly}
            tabIndex={-1}
            className={`
              ${sizeClasses[size]} 
              ${readOnly ? 'cursor-default' : 'cursor-pointer'} 
              transition-all duration-200
              focus:outline-none rounded relative
              ${!readOnly ? 'hover:scale-110' : ''}
            `}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full"
            >
              {/* Background empty star */}
              <path 
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="none"
                stroke="var(--muted)"
                strokeWidth="1.5"
              />
              
              {/* Half star (left half filled) */}
              {fillState === 'half' && (
                <defs>
                  <clipPath id={`half-clip-${star}`}>
                    <rect x="0" y="0" width="12" height="24" />
                  </clipPath>
                </defs>
              )}
              {fillState === 'half' && (
                <path 
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="var(--accent)"
                  clipPath={`url(#half-clip-${star})`}
                />
              )}
              
              {/* Full star */}
              {fillState === 'full' && (
                <path 
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="var(--accent)"
                />
              )}
            </svg>
          </button>
        );
      })}
      
      {/* Rating text */}
      <span 
        className="text-sm ml-2 font-medium" 
        style={{ color: 'var(--muted)' }}
      >
        ({displayValue}/5)
      </span>
    </div>
  );
}

