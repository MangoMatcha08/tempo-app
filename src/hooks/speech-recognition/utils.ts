
/**
 * Utility functions for speech recognition
 */

// Create a debounce function
export function debounce<F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<F>): void {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

// Check if speech recognition is supported
export const isSpeechRecognitionSupported = (): boolean => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

// Create a speech recognition instance
export const createSpeechRecognition = (): any | null => {
  try {
    // @ts-ignore - SpeechRecognition is not in the types
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      return new SpeechRecognition();
    }
  } catch (error) {
    console.error('Error creating speech recognition instance:', error);
  }
  return null;
};

// IMPROVEMENT 1: Enhanced Speech Recognition Configuration for Mobile
// Configure speech recognition with optimized settings for different platforms
export const configureSpeechRecognition = (recognition: any, options: SpeechRecognitionOptions = {}): void => {
  if (!recognition) return;
  
  const {
    isHighLatency = false,
    isPWA = false,
    isMobile = false,
    isIOS = false
  } = options;
  
  try {
    // Base configuration that works across platforms
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    // Platform-specific optimizations
    if (isMobile || isPWA) {
      // Mobile optimizations - reduce processing burden
      recognition.maxAlternatives = 1; // Limit alternatives to improve performance
      
      // iOS Safari has specific behavior that needs accommodation
      if (isIOS) {
        // iOS Safari works better with these settings
        recognition.interimResults = true; // Ensure this is on for iOS
      }
      
      // Android-specific tweaks
      if (isMobile && !isIOS) {
        // Android sometimes needs these adjustments
        if ('audioContext' in recognition) {
          // @ts-ignore - This is a non-standard property
          recognition.audioContext = {
            sampleRate: 16000 // Lower sample rate for better performance on mobile
          };
        }
      }
      
      // PWA-specific optimizations
      if (isPWA) {
        // PWA mode - extra robustness for context switches
        recognition.continuous = true; // Keep continuous mode for PWAs
      }
    }
    
    // High latency network accommodations (especially for mobile data)
    if (isHighLatency) {
      // For higher latency environments, these settings may work better
      recognition.maxAlternatives = 1;
    } else {
      // For low latency environments (usually desktop)
      recognition.maxAlternatives = 3;
    }
  } catch (error) {
    console.error('Error configuring speech recognition:', error);
  }
};

// Check device and browser support level
export const getSpeechRecognitionSupportLevel = (): 'full' | 'limited' | 'unsupported' => {
  if (!isSpeechRecognitionSupported()) {
    return 'unsupported';
  }
  
  // Check for mobile browsers with known issues
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  
  // iOS Safari has better support than most mobile browsers
  if (isIOS && isSafari) {
    return 'full';
  }
  
  // Most mobile browsers have limitations
  if (isMobile) {
    return 'limited';
  }
  
  return 'full';
};

// IMPROVEMENT 2: Platform-Aware Timing Adjustments
// Get optimized timeout based on platform detection
export const getPlatformAdjustedTimeout = (
  baseTimeout: number,
  options: { isPWA?: boolean; isMobile?: boolean; isIOS?: boolean } = {}
): number => {
  const { isPWA = false, isMobile = false, isIOS = false } = options;
  
  let multiplier = 1;
  
  // Apply multipliers based on platform
  if (isPWA) multiplier *= 2.0; // PWA needs longer timeouts
  if (isMobile) multiplier *= 1.5; // Mobile generally needs more time
  if (isIOS) multiplier *= 1.2; // iOS Safari has specific timing needs
  
  // Combine factors but ensure reasonable bounds
  multiplier = Math.max(1, Math.min(multiplier, 3.5));
  
  return Math.round(baseTimeout * multiplier);
};

// Detect iOS device
export const isIOSDevice = (): boolean => {
  const userAgent = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent);
};

// Detect if running in a high latency environment
export const isHighLatencyEnvironment = (): boolean => {
  // Simple heuristic - mobile networks are often higher latency
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Could be enhanced with actual network detection
  // For now, assume mobile is higher latency than desktop
  return isMobile;
};

// Helper interface for speech recognition configuration
export interface SpeechRecognitionOptions {
  isHighLatency?: boolean;
  isPWA?: boolean;
  isMobile?: boolean;
  isIOS?: boolean;
}
