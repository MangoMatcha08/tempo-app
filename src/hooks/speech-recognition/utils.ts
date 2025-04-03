
/**
 * Utility functions for speech recognition 
 */

// Speech recognition feature detection
export const isSpeechRecognitionSupported = (): boolean => {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};

// Platform detection utilities
export const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window.MSStream);
};

export const isHighLatencyEnvironment = (): boolean => {
  return isIOSDevice() || /Android/.test(navigator.userAgent);
};

export const isPwaMode = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches || 
    // @ts-ignore - Property 'standalone' exists on iOS Safari but not in TS types
    window.navigator.standalone === true
  );
};

export interface SpeechRecognitionOptions {
  isPWA?: boolean;
  isMobile?: boolean;
  isIOS?: boolean;
  isHighLatency?: boolean;
}

// Enhanced speech recognition factory with iOS optimizations
export const createSpeechRecognition = (): any => {
  // More robust feature detection
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.error("Speech recognition not supported");
    return null;
  }
  
  return new SpeechRecognition();
};

// Configure speech recognition with platform-specific settings
export const configureSpeechRecognition = (recognition: any, options: SpeechRecognitionOptions = {}): void => {
  const { isPWA = false, isMobile = false, isIOS = false, isHighLatency = false } = options;
  
  // Base configuration
  recognition.lang = 'en-US';
  
  // iOS Safari-specific settings
  if (isIOS) {
    recognition.interimResults = true; // Critical for iOS
    recognition.continuous = false;    // Better on iOS with false
    recognition.maxAlternatives = 1;   // Reduce processing burden
    console.log("Applying iOS-specific speech recognition settings");
  } else {
    // Default settings for other platforms
    recognition.interimResults = true;
    recognition.continuous = !isPWA; // PWAs work better with continuous = false in some cases
    recognition.maxAlternatives = 1;
  }
  
  // Additional logging
  console.log(`Speech recognition configured with: isPWA=${isPWA}, isMobile=${isMobile}, isIOS=${isIOS}`);
};

// Platform-aware timeout adjustment
export const getPlatformAdjustedTimeout = (
  baseTimeout: number,
  options: { isPWA?: boolean; isMobile?: boolean; isIOS?: boolean } = {}
): number => {
  const { isPWA = false, isMobile = false, isIOS = false } = options;
  
  let multiplier = 1;
  if (isPWA) multiplier *= 2.0; 
  if (isMobile) multiplier *= 1.5;
  if (isIOS) multiplier *= 1.8; // Increased for iOS
  
  // Cap the multiplier to avoid extreme values
  multiplier = Math.max(1, Math.min(multiplier, 5));
  return Math.round(baseTimeout * multiplier);
};

// Helper functions for processing speech results
export function debounce<F extends (...args: any[]) => any>(
  func: F,
  wait: number
): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<F>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * Ensures an active audio stream is maintained
 * This is critical for iOS permission persistence
 */
export const ensureActiveAudioStream = async (): Promise<boolean> => {
  try {
    // Get stream and KEEP REFERENCE to prevent garbage collection
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: true,
      video: false
    });
    
    // Store globally - critical for iOS permission persistence
    (window as any).activeMicrophoneStream = stream;
    console.log("Acquired and stored active microphone stream");
    return true;
  } catch (error) {
    console.error("Microphone permission error:", error);
    return false;
  }
};

/**
 * Closes any existing microphone streams
 */
export const releaseAudioStream = (): void => {
  if ((window as any).activeMicrophoneStream) {
    try {
      const stream = (window as any).activeMicrophoneStream;
      const tracks = stream.getTracks();
      
      tracks.forEach((track: MediaStreamTrack) => {
        track.stop();
      });
      
      (window as any).activeMicrophoneStream = null;
      console.log("Released active microphone stream");
    } catch (error) {
      console.error("Error releasing microphone stream:", error);
    }
  }
};
