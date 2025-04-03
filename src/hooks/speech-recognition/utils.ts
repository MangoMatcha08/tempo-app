
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("SpeechRecognitionUtils");

// Detect iOS device
export const isIOSDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|macintosh/.test(userAgent) && 'ontouchend' in document;
};

// Detect mobile device
export const isMobileDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
};

// Detect PWA mode
export const isPwaMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true || 
         document.referrer.includes('android-app://');
};

// Debounce function
export const debounce = <F extends (...args: any[]) => any>(fn: F, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<F>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
};

// Active audio stream reference
let activeAudioStream: MediaStream | null = null;

// Ensure we have an active audio stream
export const ensureActiveAudioStream = async (): Promise<boolean> => {
  try {
    // If we already have an active stream, check if it's still valid
    if (activeAudioStream) {
      const activeTracks = activeAudioStream.getAudioTracks().filter(track => track.readyState === 'live');
      
      if (activeTracks.length > 0) {
        debugLog("Reusing existing active audio stream");
        return true;
      } else {
        debugLog("Existing audio stream is inactive, requesting new stream");
        releaseAudioStream();
      }
    }
    
    // Request a new stream
    debugLog("Requesting audio stream");
    const constraints = { audio: true, video: false };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Store the stream
    activeAudioStream = stream;
    
    // Log active tracks
    const tracks = stream.getAudioTracks();
    debugLog(`Obtained ${tracks.length} audio tracks`);
    
    // Verify we have active tracks
    if (tracks.length === 0) {
      debugLog("No audio tracks in stream, may indicate issues");
      return false;
    }
    
    debugLog("Audio stream successfully obtained");
    return true;
  } catch (error) {
    debugLog(`Error getting audio stream: ${error}`);
    return false;
  }
};

// Release any active audio stream
export const releaseAudioStream = (): void => {
  if (activeAudioStream) {
    debugLog("Releasing audio stream");
    
    activeAudioStream.getAudioTracks().forEach(track => {
      track.stop();
      debugLog(`Stopped audio track: ${track.label || 'unnamed'}`);
    });
    
    activeAudioStream = null;
    debugLog("Audio stream released");
  }
};

// Add a no-results timeout utility
export const createNoResultsTimeout = (timeoutMs: number, callback: () => void): () => void => {
  debugLog(`Creating no-results timeout for ${timeoutMs}ms`);
  const timeoutId = setTimeout(() => {
    debugLog("No-results timeout triggered");
    callback();
  }, timeoutMs);
  
  // Return a function to clear the timeout
  return () => {
    debugLog("No-results timeout cleared");
    clearTimeout(timeoutId);
  };
};

// Add WebAudio diagnostic utility
export const diagnoseAudioContext = async (): Promise<boolean> => {
  try {
    debugLog("Initializing diagnostic audio context");
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    
    if (!AudioContext) {
      debugLog("WebAudio API not supported");
      return false;
    }
    
    const audioContext = new AudioContext();
    debugLog(`Audio context created, state: ${audioContext.state}`);
    
    // Attempt to resume the audio context if suspended
    if (audioContext.state === 'suspended') {
      try {
        debugLog("Attempting to resume suspended audio context");
        await audioContext.resume();
        debugLog(`Audio context resumed, new state: ${audioContext.state}`);
      } catch (resumeError) {
        debugLog(`Failed to resume audio context: ${resumeError}`);
      }
    }
    
    // Create an oscillator as a simple audio source test
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    
    // Connect to a silent node to avoid actual sound
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime); // Silent
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Start briefly then stop
    oscillator.start();
    
    // Check if successfully started
    debugLog("Test oscillator started successfully");
    
    // Stop after a brief moment
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
      debugLog("Test audio context closed");
    }, 100);
    
    return true;
  } catch (error) {
    debugLog(`Audio context diagnostic failed: ${error}`);
    return false;
  }
};

// Pre-warm the speech recognition engine
let preWarmedSpeechRecognition: any = null;

export const prewarmSpeechRecognition = (): void => {
  try {
    if (preWarmedSpeechRecognition) {
      debugLog("Speech recognition already prewarmed");
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      debugLog("Prewarming speech recognition");
      const recognition = new SpeechRecognition();
      
      // Configure with minimal settings
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = navigator.language || 'en-US';
      
      // Set up minimal handlers
      recognition.onstart = () => {
        debugLog("Prewarm recognition started");
        setTimeout(() => {
          try {
            recognition.stop();
            debugLog("Prewarm recognition stopped");
          } catch (e) {
            debugLog(`Error stopping prewarm recognition: ${e}`);
          }
        }, 300);
      };
      
      recognition.onend = () => {
        debugLog("Prewarm recognition ended");
        preWarmedSpeechRecognition = recognition;
      };
      
      recognition.onerror = (event: any) => {
        debugLog(`Prewarm recognition error: ${event.error}`);
        preWarmedSpeechRecognition = null;
      };
      
      // Start briefly to initialize the engine
      try {
        recognition.start();
        debugLog("Prewarm recognition start called");
      } catch (e) {
        debugLog(`Error starting prewarm recognition: ${e}`);
      }
    }
  } catch (e) {
    debugLog(`Error in prewarm speech recognition: ${e}`);
  }
};

// Get the prewarmed instance if available
export const getPrewarmedSpeechRecognition = (): any => {
  if (preWarmedSpeechRecognition) {
    debugLog("Returning prewarmed speech recognition");
    const instance = preWarmedSpeechRecognition;
    preWarmedSpeechRecognition = null; // Use only once
    return instance;
  }
  return null;
};

// Helper to force audio permission check
export const forceAudioPermissionCheck = async (): Promise<boolean> => {
  try {
    debugLog("Forcing audio permission check");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Store briefly then release
    const tracks = stream.getAudioTracks();
    debugLog(`Got ${tracks.length} audio tracks for permission check`);
    
    // Release after a short delay (in case needed by recognition)
    setTimeout(() => {
      tracks.forEach(track => track.stop());
      debugLog("Permission check audio tracks released");
    }, 500);
    
    return true;
  } catch (error) {
    debugLog(`Audio permission check failed: ${error}`);
    return false;
  }
};
