import * as React from "react"
import { useBreakpointDown } from "@/hooks/use-media-query"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  return useBreakpointDown("md")
}
