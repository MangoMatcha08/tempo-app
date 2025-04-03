
import { useEffect, useState } from 'react';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("PWAUtils");

// Check if running on iOS device
export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|macintosh/.test(userAgent) && 'ontouchend' in document;
};

// Check if running on Android device
export const isAndroidDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
};

// Check if running in standalone PWA mode
export const isPWAMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true || 
         document.referrer.includes('android-app://');
};

// Hook to detect PWA and device type
export const usePWADetection = () => {
  const [isPWA, setIsPWA] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    // Detect device and PWA status
    const detectEnvironment = () => {
      const ios = isIOSDevice();
      const android = isAndroidDevice();
      const pwa = isPWAMode();
      
      setIsIOS(ios);
      setIsAndroid(android);
      setIsPWA(pwa);
      setIsReady(true);
      
      debugLog(`Environment detection - iOS: ${ios}, Android: ${android}, PWA: ${pwa}`);
    };

    // Run detection on mount
    detectEnvironment();
    
    // Also check when visibility changes (useful for PWA detection)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        detectEnvironment();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { isPWA, isIOS, isAndroid, isReady };
};

// iOS PWA specific utilities
export const iOSPWAUtils = {
  // Add delay for iOS PWA transitions
  getTransitionDelay: (): number => {
    if (isIOSDevice() && isPWAMode()) {
      return 300; // Longer delay for iOS PWA
    }
    return 100; // Normal delay for other platforms
  },
  
  // Fix for iOS PWA audio context issues
  fixAudioContext: (): void => {
    if (isIOSDevice() && isPWAMode() && typeof window !== 'undefined') {
      // Create and immediately suspend a dummy audio context to "warm up" the audio system
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const dummyContext = new AudioContext();
          dummyContext.suspend();
          
          // Resume on user interaction
          const resumeAudio = () => {
            dummyContext.resume().then(() => {
              debugLog('Audio context resumed for iOS PWA');
            }).catch(err => {
              debugLog('Error resuming audio context:', err);
            });
            
            // Remove listeners after first interaction
            document.removeEventListener('touchstart', resumeAudio);
            document.removeEventListener('touchend', resumeAudio);
          };
          
          document.addEventListener('touchstart', resumeAudio);
          document.addEventListener('touchend', resumeAudio);
          
          debugLog('iOS PWA audio context fix applied');
        }
      } catch (err) {
        debugLog('Error applying iOS PWA audio fix:', err);
      }
    }
  },
  
  // Fix for iOS PWA scroll issues
  fixScrolling: (): void => {
    if (isIOSDevice() && isPWAMode() && typeof document !== 'undefined') {
      // Prevent overscroll/bounce
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.height = '100%';
      document.body.style.width = '100%';
      
      debugLog('iOS PWA scroll fix applied');
    }
  }
};

// Test PWA compatibility
export const testPWACompatibility = (): {
  isPWA: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  features: Record<string, boolean>;
} => {
  const ios = isIOSDevice();
  const android = isAndroidDevice();
  const pwa = isPWAMode();
  
  // Test various features
  const features = {
    serviceWorker: 'serviceWorker' in navigator,
    webAudio: !!(window.AudioContext || (window as any).webkitAudioContext),
    notifications: 'Notification' in window,
    pushManager: 'PushManager' in window,
    mediaRecorder: 'MediaRecorder' in window,
    speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    indexedDB: 'indexedDB' in window,
    localStorage: 'localStorage' in window,
    webShare: 'share' in navigator,
    vibration: 'vibrate' in navigator,
    geolocation: 'geolocation' in navigator,
    deviceOrientation: 'DeviceOrientationEvent' in window,
    deviceMotion: 'DeviceMotionEvent' in window,
    fullscreen: document.documentElement.requestFullscreen !== undefined
  };
  
  debugLog('PWA Compatibility Test Results:', {
    isPWA: pwa,
    isIOS: ios,
    isAndroid: android,
    features
  });
  
  return {
    isPWA: pwa,
    isIOS: ios,
    isAndroid: android,
    features
  };
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

// Function to ensure an active audio stream is available
export const ensureActiveAudioStream = async (): Promise<boolean> => {
  try {
    debugLog("Ensuring active audio stream");
    
    // Check if we already have active streams
    if (activeStreams.length > 0) {
      // Check if any stream is still active
      for (const stream of activeStreams) {
        const activeTracks = stream.getAudioTracks().filter(track => track.readyState === 'live');
        
        if (activeTracks.length > 0) {
          debugLog("Using existing active audio stream");
          return true;
        }
      }
      
      debugLog("No active tracks in existing streams, requesting new stream");
    }
    
    // Request a new stream
    const constraints = { audio: true, video: false };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Store reference in PWA mode
    if (isPwaMode()) {
      activeStreams.push(stream);
      debugLog(`New stream stored in PWA mode (total: ${activeStreams.length})`);
      
      // Clean up older streams if we have too many
      if (activeStreams.length > 3) {
        const oldStream = activeStreams.shift();
        if (oldStream) {
          oldStream.getTracks().forEach(track => track.stop());
          debugLog("Released oldest stream to prevent memory issues");
        }
      }
    }
    
    // Check if we got audio tracks
    const audioTracks = stream.getAudioTracks();
    debugLog(`Obtained ${audioTracks.length} audio tracks`);
    
    if (audioTracks.length === 0) {
      debugLog("No audio tracks in new stream");
      return false;
    }
    
    return true;
  } catch (error) {
    debugLog(`Error ensuring audio stream: ${error}`);
    return false;
  }
};

