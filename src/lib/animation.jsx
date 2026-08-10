import React from 'react';
import { useInView } from './useInView.js';

// Animated component wrapper
export const AnimatedSection = ({ children, className = '', animation = 'animate-on-scroll' }) => {
  const [ref, isVisible] = useInView();
  return (
    <div ref={ref} className={`${animation} ${isVisible ? 'is-visible' : ''} ${className}`}>
      {children}
    </div>
  );
};
