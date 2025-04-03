
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("PWAUtils");

// Check if running in PWA mode
export const isPwaMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true || 
         document.referrer.includes('android-app://');
};

// Get a timeout value adjusted for PWA
export const getPwaAdjustedTimeout = (baseTimeout: number, isMobile = false): number => {
  const isPWA = isPwaMode();
  
  // Increase timeouts in PWA mode and/or on mobile
  const multiplier = (isPWA && isMobile) ? 1.5 : 
                    (isPWA || isMobile) ? 1.3 : 1;
  
  return Math.round(baseTimeout * multiplier);
};

// Store active audio stream references to avoid garbage collection in PWA mode
const activeStreams: MediaStream[] = [];

// Request microphone access
export const requestMicrophoneAccess = async (): Promise<boolean> => {
  try {
    debugLog("Requesting microphone access");
    
    // Check if we already have permission
    if (navigator.permissions && navigator.permissions.query) {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permissionStatus.state === 'granted') {
        debugLog("Microphone permission already granted");
        return true;
      }
    }
    
    // Request audio access
    const constraints = { audio: true, video: false };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Store reference to prevent garbage collection in PWA
    if (isPwaMode()) {
      activeStreams.push(stream);
      debugLog(`Stream stored in PWA mode (total: ${activeStreams.length})`);
    }
    
    // Check if we got audio tracks
    const audioTracks = stream.getAudioTracks();
    debugLog(`Obtained ${audioTracks.length} audio tracks`);
    
    if (audioTracks.length === 0) {
      debugLog("No audio tracks in stream");
      return false;
    }
    
    return true;
  } catch (error) {
    debugLog(`Error requesting microphone access: ${error}`);
    return false;
  }
};

// Helper to release microphone streams
export const releaseMicrophoneStreams = (): void => {
  // Only release non-PWA streams or when explicitly cleaning up
  if (!isPwaMode() || activeStreams.length > 3) {
    debugLog(`Releasing ${activeStreams.length} microphone streams`);
    
    activeStreams.forEach(stream => {
      try {
        stream.getTracks().forEach(track => {
          track.stop();
          debugLog(`Released track: ${track.kind}`);
        });
      } catch (e) {
        debugLog(`Error releasing stream: ${e}`);
      }
    });
    
    activeStreams.length = 0;
    debugLog("All microphone streams released");
  } else if (isPwaMode()) {
    debugLog(`Keeping ${activeStreams.length} streams in PWA mode`);
  }
};

// Force audio permission check
export const forceAudioPermissionCheck = async (): Promise<boolean> => {
  try {
    debugLog("Forcing audio permission check");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Store briefly then release
    const tracks = stream.getAudioTracks();
    debugLog(`Got ${tracks.length} audio tracks for permission check`);
    
    if (isPwaMode()) {
      activeStreams.push(stream);
      debugLog(`Stream stored in PWA mode (total: ${activeStreams.length})`);
      // Clean up older streams if we have too many
      if (activeStreams.length > 3) {
        const oldStream = activeStreams.shift();
        if (oldStream) {
          oldStream.getTracks().forEach(track => track.stop());
          debugLog("Released oldest stream to prevent memory issues");
        }
      }
    } else {
      // Release after a short delay (in case needed by recognition)
      setTimeout(() => {
        tracks.forEach(track => track.stop());
        debugLog("Permission check audio tracks released");
      }, 500);
    }
    
    return true;
  } catch (error) {
    debugLog(`Audio permission check failed: ${error}`);
    return false;
  }
};

// Test audio functionality
export const testAudioContext = async (): Promise<boolean> => {
  try {
    debugLog("Testing audio context");
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    
    if (!AudioContext) {
      debugLog("Web Audio API not supported");
      return false;
    }
    
    const audioCtx = new AudioContext();
    debugLog(`Audio context created, state: ${audioCtx.state}`);
    
    if (audioCtx.state === "suspended") {
      try {
        await audioCtx.resume();
        debugLog(`Audio context resumed, state: ${audioCtx.state}`);
      } catch (e) {
        debugLog(`Failed to resume audio context: ${e}`);
      }
    }
    
    // Create a silent oscillator to test
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0; // Silent
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    
    // Stop after a short time
    setTimeout(() => {
      oscillator.stop();
      audioCtx.close();
      debugLog("Audio context test completed");
    }, 100);
    
    return true;
  } catch (error) {
    debugLog(`Audio context test failed: ${error}`);
    return false;
  }
};
