
import { useState, useEffect } from 'react';

/**
 * A hook that returns whether a media query matches the current viewport
 * @param query - CSS media query string (e.g. '(max-width: 640px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with the current match state
  const [matches, setMatches] = useState<boolean>(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false; // Default to false for SSR
  });

  useEffect(() => {
    // Return early if not in the browser
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Update matches when the media query changes
    const updateMatches = () => {
      setMatches(mediaQuery.matches);
    };

    // Set initial value
    updateMatches();
    
    // Add event listener for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatches);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(updateMatches);
    }
    
    // Clean up
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateMatches);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(updateMatches);
      }
    };
  }, [query]);

  return matches;
}
