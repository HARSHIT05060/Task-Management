import { useState, useRef, useEffect } from 'react';

export default function Tooltip({ children, content, side = 'bottom', delay = 400 }) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const positionClasses = {
    top: 'bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2',
    bottom: 'top-[calc(100%+6px)] left-1/2 -translate-x-1/2',
    left: 'right-[calc(100%+6px)] top-1/2 -translate-y-1/2',
    right: 'left-[calc(100%+6px)] top-1/2 -translate-y-1/2'
  };

  if (!content) return <>{children}</>;

  return (
    <div 
      className="relative inline-flex" 
      onMouseEnter={showTooltip} 
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <div 
        className={`
          absolute z-50 px-2 py-1 text-xs font-medium text-white bg-[#1A1D23] 
          rounded-md shadow-md whitespace-nowrap pointer-events-none transition-opacity duration-150
          ${isVisible ? 'opacity-100' : 'opacity-0'}
          ${positionClasses[side]}
        `}
      >
        {content}
      </div>
    </div>
  );
}
