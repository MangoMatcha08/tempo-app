
// PWA (Progressive Web App) utility functions

/**
 * Checks if the app is running in PWA mode
 * @returns boolean indicating if the app is running as a PWA
 */
export const isPWAMode = (): boolean => {
  // Check if running in standalone mode (added to home screen)
  return window.matchMedia('(display-mode: standalone)').matches || 
         // iOS specific check for standalone mode
         (window.navigator as any).standalone === true;
};

/**
 * Forces a check for audio permission in PWA mode
 * This can help with iOS PWA issues where permission is needed
 * before any user interaction
 */
export const forceAudioPermissionCheck = async (): Promise<boolean> => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log('Media devices API not supported');
      return false;
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('Audio permission pre-check successful');
    
    // Release the stream after a short period
    setTimeout(() => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }, 1000);
    
    return true;
  } catch (error) {
    console.log('Audio permission pre-check failed:', error);
    return false;
  }
};

/**
 * Request microphone access explicitly
 */
export const requestMicrophoneAccess = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Store the stream for future reference if needed
    (window as any).microphoneStream = stream;
    
    return true;
  } catch (error) {
    console.error('Error requesting microphone access:', error);
    return false;
  }
};

/**
 * Releases all active microphone streams
 */
export const releaseMicrophoneStreams = () => {
  if ((window as any).microphoneStream) {
    (window as any).microphoneStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    (window as any).microphoneStream = null;
  }
};

/**
 * Ensures an active audio stream is available (important for iOS PWA)
 * @param existingStream Optional existing stream to check
 * @returns boolean indicating if an audio stream is available
 */
export const ensureActiveAudioStream = async (existingStream: MediaStream | null): Promise<boolean> => {
  // If we already have a stream stored in the window object, check if it's active
  if ((window as any).microphoneStream) {
    const tracks = (window as any).microphoneStream.getAudioTracks();
    if (tracks.length > 0 && tracks[0].readyState === 'live') {
      return true;
    }
    
    // If not active, release it
    releaseMicrophoneStreams();
  }
  
  // If a stream was passed in, check it
  if (existingStream) {
    const tracks = existingStream.getAudioTracks();
    if (tracks.length > 0 && tracks[0].readyState === 'live') {
      return true;
    }
  }
  
  // No valid stream found, try to get a new one
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    (window as any).microphoneStream = stream;
    return true;
  } catch (error) {
    console.error('Failed to acquire audio stream:', error);
    return false;
  }
};

/**
 * Fix for iOS audio context issues in PWA mode
 */
export const iOSPWAUtils = {
  fixAudioContext: () => {
    // Create a dummy audio context to "wake up" the audio system on iOS
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const audioCtx = new AudioContext();
        
        // iOS requires a sound to be played during a user gesture
        document.addEventListener('click', function iosAudioFix() {
          // Create and play a short silent sound
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          gainNode.gain.value = 0; // Silent
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          oscillator.start(0);
          oscillator.stop(0.1);
          
          // Only need to do this once
          document.removeEventListener('click', iosAudioFix);
        }, { once: true });
        
        return audioCtx;
      }
    } catch (error) {
      console.error('Error fixing iOS audio context:', error);
    }
    
    return null;
  }
};
