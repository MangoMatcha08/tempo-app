
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("SpeechRecognitionUtils");

// Cached recognition instance
let prewarmedRecognition: any = null;

/**
 * Check if device is running in PWA mode
 */
export const isPwaMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

/**
 * Detect if the device is running iOS
 */
export const isIOSDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|macintosh/.test(userAgent) && 'ontouchend' in document;
};

/**
 * Pre-initialize a speech recognition instance to improve startup time
 */
export function prewarmSpeechRecognition(): any {
  if (prewarmedRecognition) {
    return prewarmedRecognition;
  }
  
  try {
    // Get the appropriate speech recognition constructor
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      debugLog("Speech recognition not supported in this browser");
      return null;
    }
    
    // Create a new recognition instance
    const recognition = new SpeechRecognition();
    
    // Configure common properties
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = navigator.language || 'en-US';
    
    // Store for later use
    prewarmedRecognition = recognition;
    debugLog("Prewarmed recognition instance created");
    
    return recognition;
  } catch (error) {
    debugLog(`Error creating prewarmed recognition: ${error}`);
    return null;
  }
}

/**
 * Get the prewarmed speech recognition instance
 */
export function getPrewarmedSpeechRecognition(): any {
  return prewarmedRecognition;
}

/**
 * Force an audio permission check to prepare for speech recognition
 */
export async function forceAudioPermissionCheck(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      debugLog("MediaDevices API not supported");
      return false;
    }
    
    debugLog("Performing audio permission pre-check");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    debugLog("Audio permission granted");
    
    // Release the stream after a short period
    setTimeout(() => {
      stream.getTracks().forEach(track => track.stop());
      debugLog("Audio permission pre-check stream released");
    }, 1000);
    
    return true;
  } catch (error) {
    debugLog(`Audio permission pre-check failed: ${error}`);
    return false;
  }
}
