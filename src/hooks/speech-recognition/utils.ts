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

// Configure speech recognition with optimal settings
export const configureSpeechRecognition = (recognition: any, isHighLatency = false): void => {
  if (!recognition) return;
  
  try {
    // Adjust settings for high latency environments (mobile/PWA)
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Use a language setting that works well on mobile
    recognition.lang = 'en-US';
    
    // Other possible settings to experiment with
    if (isHighLatency) {
      // For higher latency environments, these settings may work better
      recognition.maxAlternatives = 1;
      
      // Some browsers support additional settings
      if ('audioContext' in recognition) {
        // @ts-ignore - This is a non-standard property
        recognition.audioContext = {
          sampleRate: 16000 // Lower sample rate for better performance on mobile
        };
      }
    } else {
      // For low latency environments
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
