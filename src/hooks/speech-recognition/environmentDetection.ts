// Keep existing imports

export interface EnvironmentConfig {
  platform: string;
  mode: string;
  browser: string;
  description: string;
  isIOSPwa: boolean;
  isPwa: boolean; // Added for consistency 
  isMobile: boolean; // Added for consistency
  capabilities: {
    continuous: boolean;
    reliable: boolean;
  };
  recognitionConfig: {
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    restartDelay: number;
  };
}

export const detectEnvironment = (): EnvironmentConfig => {
  // Detect platform
  const userAgent = navigator.userAgent || '';
  const platform = /iPad|iPhone|iPod/.test(userAgent) ? 'iOS' :
                   /Android/.test(userAgent) ? 'Android' :
                   /Windows/.test(userAgent) ? 'Windows' :
                   /Mac/.test(userAgent) ? 'MacOS' :
                   /Linux/.test(userAgent) ? 'Linux' : 'Unknown';
  
  // Detect browser
  const isChrome = /Chrome/.test(userAgent) && !/Edge|Edg/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isEdge = /Edge|Edg/.test(userAgent);
  
  const browser = isChrome ? 'Chrome' :
                  isFirefox ? 'Firefox' :
                  isSafari ? 'Safari' :
                  isEdge ? 'Edge' : 'Unknown';
  
  // Detect if running as PWA
  const isPwa = window.matchMedia('(display-mode: standalone)').matches || 
                (navigator.standalone === true);
  const mode = isPwa ? 'PWA' : 'Browser';
  
  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // iOS Safari has specific limitations
  const isIOS = platform === 'iOS';
  const isIOSPwa = isIOS && isPwa;
  
  // Set capabilities based on environment
  let capabilities = {
    continuous: true,
    reliable: true
  };
  
  // iOS Safari doesn't support continuous recognition reliably
  if (isIOS) {
    capabilities.continuous = false;
    capabilities.reliable = false;
  }
  
  // Create a description of the environment
  const description = `${platform} ${browser} ${mode}`;
  
  // Recognition configuration based on environment
  const recognitionConfig = {
    continuous: capabilities.continuous,
    interimResults: true,
    maxAlternatives: 1,
    restartDelay: isIOS ? 500 : 300
  };
  
  return {
    platform,
    mode,
    browser,
    isIOSPwa,
    isPwa,
    isMobile,
    description,
    capabilities,
    recognitionConfig
  };
};

export const getEnvironmentDescription = (): string => {
  const env = detectEnvironment();
  return env.description;
};
