
/**
 * Enhanced environment detection for speech recognition
 * Identifies platform, mode (browser vs PWA), and sets appropriate configuration
 */
export const detectEnvironment = () => {
  // Check if running as installed PWA
  const isPwa = window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true;
  
  // Check platform
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  // Configure recognition parameters based on environment
  return {
    isPwa,
    isIOS,
    isAndroid,
    isMobile: isIOS || isAndroid,
    isIOSPwa: isPwa && isIOS,
    isSafari,
    recognitionConfig: {
      continuous: !(isPwa && isIOS), // iOS PWA can't use continuous mode reliably
      interimResults: true,
      maxAlternatives: isIOS ? 3 : 1, // Get more alternatives on iOS for better accuracy
      restartDelay: isPwa ? (isIOS ? 1000 : 800) : 300
    }
  };
};

/**
 * Returns a human-readable description of the current environment
 * Useful for debugging
 */
export const getEnvironmentDescription = () => {
  const env = detectEnvironment();
  
  return {
    platform: env.isIOS ? 'iOS' : (env.isAndroid ? 'Android' : 'Desktop'),
    mode: env.isPwa ? 'PWA' : 'Browser',
    browser: env.isSafari ? 'Safari' : (navigator.userAgent.indexOf('Chrome') > -1 ? 'Chrome' : 'Other'),
    description: `Running on ${env.isIOS ? 'iOS' : (env.isAndroid ? 'Android' : 'Desktop')} 
                  in ${env.isPwa ? 'PWA' : 'Browser'} mode
                  ${env.isIOSPwa ? '(iOS PWA - limited recognition capabilities)' : ''}`,
    capabilities: {
      continuous: !env.isIOSPwa,
      reliable: !env.isIOSPwa
    }
  };
};
