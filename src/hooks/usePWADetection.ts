
import { useState, useEffect } from 'react';
import { pwaDetection } from '@/utils/pwaDetection';
import type { PWAEnvironment, PWACapabilities } from '@/types/pwa';

export function usePWADetection() {
  const [environment, setEnvironment] = useState<PWAEnvironment>(
    pwaDetection.getPWAEnvironment()
  );
  const [capabilities, setCapabilities] = useState<PWACapabilities>(
    pwaDetection.getCapabilities()
  );

  useEffect(() => {
    // Update on display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => {
      setEnvironment(pwaDetection.getPWAEnvironment());
      setCapabilities(pwaDetection.getCapabilities());
    };

    if ('addEventListener' in mediaQuery) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // @ts-ignore - Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if ('removeEventListener' in mediaQuery) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // @ts-ignore - Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return {
    ...environment,
    ...capabilities,
    promptInstall: pwaDetection.promptInstall.bind(pwaDetection)
  };
}

export default usePWADetection;
