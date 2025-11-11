import { useState } from 'react';

export type StarRatingProps = {
  value: number; // 0-5 stars
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

/**
 * Interactive star rating component
 * - Shows 5 stars with half-star support
 * - Clickable when not read-only
 * - Hover effects for better UX
 */
export default function StarRating({ 
  value = 0, 
  onChange, 
  readOnly = false, 
  size = 'md',
  className = ''
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7', 
    lg: 'w-8 h-8'
  };
  
  const handleClick = (rating: number) => {
    if (!readOnly && onChange) {
      // Ensure rating is 1-5 integer (consistent scale)
      const normalizedRating = Math.max(1, Math.min(5, Math.round(rating)));
      onChange(normalizedRating);
    }
  };
  
  const handleMouseEnter = (rating: number) => {
    if (!readOnly) {
      setHoverValue(rating);
    }
  };
  
  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(null);
    }
  };
  
  const displayValue = hoverValue !== null ? hoverValue : value;
  
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayValue;
        const isHalfFilled = star === Math.ceil(displayValue) && displayValue % 1 !== 0;
        
        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={readOnly}
            className={`
              ${sizeClasses[size]} 
              ${readOnly ? 'cursor-default' : 'cursor-pointer'} 
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50 rounded
              ${!readOnly ? 'hover:scale-110' : ''}
            `}
            style={{
              color: isFilled ? 'var(--accent)' : 'var(--muted)',
              opacity: isHalfFilled ? 0.5 : 1
            }}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full"
              stroke={isFilled ? 'none' : 'currentColor'}
              strokeWidth={isFilled ? '0' : '1.5'}
              fill={isFilled ? 'currentColor' : 'none'}
            >
              {/* Empty star outline */}
              {!isFilled && (
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              )}
              {/* Filled star */}
              {isFilled && (
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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

