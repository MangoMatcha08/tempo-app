/**
 * Enhanced environment detection for speech recognition
 * Identifies platform, mode (browser vs PWA), and sets appropriate configuration
 */

/**
 * Comprehensive environment detection for speech recognition
 * Detects platform, PWA status, browser type, and available speech features
 * to optimize speech recognition parameters for each environment
 * 
 * @returns Environment configuration object with detection results and platform-specific settings
 */
export const detectEnvironment = () => {
  // Check if running as installed PWA using multiple detection methods
  const isPwa = window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true;
  
  // Platform detection - focus on identifying problematic environments
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isChrome = /Chrome/.test(userAgent) && !/Edg/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  const isEdge = /Edg/.test(userAgent);
  
  // Determine if this is the problematic iOS PWA environment
  const isIOSPwa = isPwa && isIOS;
  const isMobile = isIOS || isAndroid;

  // Feature detection for Speech Recognition API
  const SpeechRecognition = window.SpeechRecognition || 
                           window.webkitSpeechRecognition ||
                           window.mozSpeechRecognition ||
                           window.msSpeechRecognition;
  
  const hasSpeechRecognition = !!SpeechRecognition;
  
  // Determine speech recognition capabilities
  let recognitionCapabilities = {
    supportsInterimResults: true,
    supportsContinuous: true,
    requiresPolling: false,
    needsManualRestart: isIOSPwa
  };
  
  // Configure recognition parameters based on environment
  // These values have been fine-tuned based on testing
  return {
    // Environment information
    isPwa,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isFirefox,
    isEdge,
    isMobile,
    isIOSPwa,
    userAgent,
    
    // Feature support detection
    features: {
      hasSpeechRecognition,
      ...recognitionCapabilities
    },
    
    // Recognition configuration tailored to the environment
    recognitionConfig: {
      // iOS PWA cannot use continuous recognition reliably
      continuous: !(isIOSPwa || (isIOS && isSafari)),
      
      // All modern supported browsers handle interim results
      interimResults: true,
      
      // iOS benefits from more alternatives for better recognition
      maxAlternatives: isIOS ? 3 : 1,
      
      // Restart delays - iOS needs longer pauses between recognition sessions
      restartDelay: isPwa ? (isIOS ? 1000 : 800) : 300,
      
      // Maximum session duration - iOS PWA speech recognition sessions should be kept short
      maxSessionDuration: isIOSPwa ? 10000 : 30000, // 10 sec for iOS PWA, 30 sec for others
      
      // iOS often needs multiple attempts to get a good recognition result
      maxRetries: isIOSPwa ? 3 : 2,
      
      // Base delay for retry backoff strategy
      baseRetryDelay: isIOSPwa ? 800 : 300,
      
      // When true, fallback to manual button to restart if recognition stalls
      enableManualRestart: isIOSPwa || (isPwa && isSafari)
    }
  };
};

/**
 * Returns a human-readable description of the current environment
 * Useful for debugging and displaying to users
 */
export const getEnvironmentDescription = () => {
  const env = detectEnvironment();
  
  // Determine the platform name for display
  let platformName = 'Desktop';
  if (env.isIOS) platformName = 'iOS';
  else if (env.isAndroid) platformName = 'Android';
  
  // Determine browser name for display
  let browserName = 'Other';
  if (env.isSafari) browserName = 'Safari';
  else if (env.isChrome) browserName = 'Chrome';
  else if (env.isFirefox) browserName = 'Firefox';
  else if (env.isEdge) browserName = 'Edge';
  
  // Generate user-friendly mode description
  const modeDesc = env.isPwa ? 'PWA' : 'Browser';
  
  // Generate a comprehensive environment description
  return {
    platform: platformName,
    mode: modeDesc,
    browser: browserName,
    description: `Running on ${platformName} in ${modeDesc} mode
                  ${env.isIOSPwa ? '(iOS PWA - limited recognition capabilities)' : ''}`,
    capabilities: {
      continuous: !env.isIOSPwa,
      reliable: !env.isIOSPwa,
      speechRecognitionSupported: env.features.hasSpeechRecognition
    }
  };
};
