
import { useState, useEffect } from "react"

/**
 * Breakpoint sizes in pixels
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
}

/**
 * Type for predefined breakpoint keys
 */
export type BreakpointKey = keyof typeof breakpoints

/**
 * Hook that listens for matches to a media query
 * @param query The media query to match against
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false)

  useEffect(() => {
    // Create media query list
    const mediaQueryList = window.matchMedia(query)
    
    // Set initial value
    setMatches(mediaQueryList.matches)

    // Define event handler
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }
    
    // Add event listener
    mediaQueryList.addEventListener("change", handler)
    
    // Cleanup
    return () => {
      mediaQueryList.removeEventListener("change", handler)
    }
  }, [query])

  return matches
}

/**
 * Hook that returns true when the screen width is less than a breakpoint
 * @param key Predefined breakpoint key or number in pixels
 * @returns Boolean indicating if the screen width is less than the breakpoint
 */
export function useBreakpointDown(key: BreakpointKey | number): boolean {
  const breakpointValue = typeof key === "number" ? key : breakpoints[key]
  return useMediaQuery(`(max-width: ${breakpointValue - 1}px)`)
}

/**
 * Hook that returns true when the screen width is greater than or equal to a breakpoint
 * @param key Predefined breakpoint key or number in pixels
 * @returns Boolean indicating if the screen width is greater than or equal to the breakpoint
 */
export function useBreakpointUp(key: BreakpointKey | number): boolean {
  const breakpointValue = typeof key === "number" ? key : breakpoints[key]
  return useMediaQuery(`(min-width: ${breakpointValue}px)`)
}

/**
 * Hook that returns true when the screen width is between two breakpoints
 * @param minKey Minimum breakpoint key or number in pixels (inclusive)
 * @param maxKey Maximum breakpoint key or number in pixels (exclusive)
 * @returns Boolean indicating if the screen width is between the breakpoints
 */
export function useBreakpointBetween(
  minKey: BreakpointKey | number,
  maxKey: BreakpointKey | number
): boolean {
  const minValue = typeof minKey === "number" ? minKey : breakpoints[minKey]
  const maxValue = typeof maxKey === "number" ? maxKey : breakpoints[maxKey]
  
  return useMediaQuery(
    `(min-width: ${minValue}px) and (max-width: ${maxValue - 1}px)`
  )
}
