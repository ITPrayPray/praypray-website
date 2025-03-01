'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { ChevronUp } from 'lucide-react';

/**
 * ScrollToTopButton - A button that appears when the user scrolls down
 * and allows them to quickly return to the top of the page
 */
export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Update visibility state based on scroll position
  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled more than 500px
      const scrolled = document.documentElement.scrollTop;
      setIsVisible(scrolled > 500);
    };

    // Add event listener
    window.addEventListener('scroll', toggleVisibility);

    // Clean up event listener on component unmount
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Scroll to top with smooth animation
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Button
        onClick={scrollToTop}
        size="icon"
        className="h-10 w-10 rounded-full shadow-md"
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-5 w-5" />
      </Button>
    </div>
  );
};