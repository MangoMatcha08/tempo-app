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
 * Detect if the device is running Android
 */
export const isAndroidDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
};

/**
 * Detect if the device is a mobile device
 */
export const isMobileDevice = (): boolean => {
  return isIOSDevice() || isAndroidDevice() || /android|webos|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
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

/**
 * Request microphone access and return whether it was granted
 */
export async function requestMicrophoneAccess(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      debugLog("MediaDevices API not supported");
      return false;
    }
    
    debugLog("Requesting microphone access");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    debugLog("Microphone access granted");
    
    // Store the stream for later use
    const existingStreams = (window as any).microphoneStreams || [];
    existingStreams.push(stream);
    (window as any).microphoneStreams = existingStreams;
    
    return true;
  } catch (error) {
    debugLog(`Microphone access request failed: ${error}`);
    return false;
  }
}

/**
 * Release all microphone streams
 */
export function releaseMicrophoneStreams(): void {
  try {
    const streams = (window as any).microphoneStreams || [];
    
    streams.forEach((stream: MediaStream) => {
      if (stream && stream.getTracks) {
        stream.getTracks().forEach(track => track.stop());
      }
    });
    
    (window as any).microphoneStreams = [];
    debugLog("Released all microphone streams");
  } catch (error) {
    debugLog(`Error releasing microphone streams: ${error}`);
  }
}

/**
 * Ensure there is an active audio stream
 */
export async function ensureActiveAudioStream(fallbackStream: MediaStream | null): Promise<boolean> {
  try {
    // Check if we already have active streams
    const existingStreams = (window as any).microphoneStreams || [];
    
    // Check if any of the existing streams are active
    for (const stream of existingStreams) {
      if (stream && stream.active && stream.getAudioTracks().some(track => track.readyState === "live")) {
        debugLog("Found existing active audio stream");
        return true;
      }
    }
    
    // If we have a fallback stream and it's active, use it
    if (fallbackStream && fallbackStream.active && fallbackStream.getAudioTracks().some(track => track.readyState === "live")) {
      debugLog("Using fallback audio stream");
      existingStreams.push(fallbackStream);
      (window as any).microphoneStreams = existingStreams;
      return true;
    }
    
    // Otherwise, request a new stream
    debugLog("No active audio stream found, requesting new one");
    return await requestMicrophoneAccess();
  } catch (error) {
    debugLog(`Error ensuring active audio stream: ${error}`);
    return false;
  }
}
