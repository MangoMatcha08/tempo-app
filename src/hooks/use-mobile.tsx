
import * as React from "react"
import { useBreakpointDown } from "@/hooks/use-media-query"

/**
 * Hook to determine if the current viewport is mobile-sized
 * @returns boolean indicating if the viewport is mobile-sized (smaller than md breakpoint)
 */
export function useIsMobile() {
  return useBreakpointDown("md")
}
