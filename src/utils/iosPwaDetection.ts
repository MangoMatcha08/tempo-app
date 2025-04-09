
/**
 * iOS PWA Detection Utilities
 * 
 * Provides more reliable detection of PWA installation status on iOS devices
 */

import { browserDetection } from './browserDetection';

/**
 * PWA installation status
 */
export interface PWAInstallationStatus {
  isPWA: boolean;
  isStandalone: boolean;
  usesAppleMobileWebAppCapable: boolean;
  hasManifest: boolean;
  matchesDisplayMode: boolean;
  confidence: 'high' | 'medium' | 'low';
  detectionMethod: string[];
}

/**
 * Check if the web app is running as a PWA
 * Uses multiple detection methods for higher confidence
 */
export function detectPWAStatus(): PWAInstallationStatus {
  // Not iOS, return early
  if (!browserDetection.isIOS()) {
    return {
      isPWA: false,
      isStandalone: false,
      usesAppleMobileWebAppCapable: false,
      hasManifest: false,
      matchesDisplayMode: false,
      confidence: 'low',
      detectionMethod: ['not-ios']
    };
  }
  
  // Start with optimistic assumption
  const result: PWAInstallationStatus = {
    isPWA: false,
    isStandalone: false,
    usesAppleMobileWebAppCapable: false,
    hasManifest: false,
    matchesDisplayMode: false,
    confidence: 'low',
    detectionMethod: []
  };
  
  let confidenceScore = 0;
  
  // Method 1: navigator.standalone (iOS-specific)
  if ((navigator as any).standalone === true) {
    result.isStandalone = true;
    result.detectionMethod.push('navigator-standalone');
    confidenceScore += 3; // Strong indicator
  }
  
  // Method 2: CSS display-mode media query
  if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
    result.matchesDisplayMode = true;
    result.detectionMethod.push('display-mode-media-query');
    confidenceScore += 2; // Good indicator
  }
  
  // Method 3: Check for apple-mobile-web-app-capable meta tag
  const appleMobileWebAppCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"][content="yes"]');
  if (appleMobileWebAppCapable) {
    result.usesAppleMobileWebAppCapable = true;
    result.detectionMethod.push('apple-mobile-web-app-capable');
    confidenceScore += 1; // Supporting indicator
  }
  
  // Method 4: Check for web app manifest
  const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
  if (hasManifest) {
    result.hasManifest = true;
    result.detectionMethod.push('has-manifest');
    confidenceScore += 1; // Supporting indicator
  }
  
  // Method 5: Check for startURL parameter in query string (custom app launch tracking)
  if (typeof window !== 'undefined' && window.location.search.includes('pwaSource=homescreen')) {
    result.detectionMethod.push('url-parameter');
    confidenceScore += 2; // Good indicator
  }
  
  // Method 6: Check if we have a service worker controlling the page
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    result.detectionMethod.push('has-controller-sw');
    confidenceScore += 1; // Supporting indicator
  }
  
  // Method 7: Check if user marked the PWA as installed
  if (localStorage.getItem('pwa-installed') === 'true') {
    result.detectionMethod.push('user-confirmed-install');
    confidenceScore += 2; // Good indicator
  }
  
  // Determine final status
  result.isPWA = result.isStandalone || (confidenceScore >= 3);
  
  // Set confidence level based on score
  if (confidenceScore >= 4) {
    result.confidence = 'high';
  } else if (confidenceScore >= 2) {
    result.confidence = 'medium';
  } else {
    result.confidence = 'low';
  }
  
  return result;
}

/**
 * Check if app is running in PWA mode on iOS
 * Returns a boolean for simple checks
 */
export function isRunningAsPwa(): boolean {
  const status = detectPWAStatus();
  return status.isPWA;
}

/**
 * Check if browser is configured for PWA
 * Used to determine if the app can be installed as a PWA
 */
export function canInstallAsPwa(): boolean {
  if (!browserDetection.isIOS()) return false;
  
  // Already running as PWA
  if (isRunningAsPwa()) return false;
  
  // iOS Safari is the only iOS browser that can install PWAs
  if (!browserDetection.isIOSSafari()) return false;
  
  // Has the needed tags for installation
  const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
  const hasAppleIcon = document.querySelector('link[rel="apple-touch-icon"]') !== null;
  
  return hasManifest && hasAppleIcon;
}

/**
 * Set a URL parameter to track PWA launches
 * Call this function during app initialization
 */
export function trackPWALaunch(): void {
  if (!browserDetection.isIOS()) return;
  
  if (isRunningAsPwa() && !window.location.search.includes('pwaSource=')) {
    // Add tracking parameter without affecting existing parameters
    const separator = window.location.search ? '&' : '?';
    const newUrl = `${window.location.pathname}${window.location.search}${separator}pwaSource=homescreen${window.location.hash}`;
    
    // Use history API to avoid reload
    window.history.replaceState({}, document.title, newUrl);
  }
}

/**
 * Mark that PWA has been successfully installed
 * Call this after the user completes the installation process
 */
export function markPwaInstalled(): void {
  localStorage.setItem('pwa-installed', 'true');
  localStorage.setItem('pwa-installed-date', Date.now().toString());
}

export const iosPwaDetection = {
  detectPWAStatus,
  isRunningAsPwa,
  canInstallAsPwa,
  trackPWALaunch,
  markPwaInstalled
};

export default iosPwaDetection;
