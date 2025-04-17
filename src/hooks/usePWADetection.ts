
import { useState, useEffect, useCallback } from 'react';
import { pwaDetection } from '@/utils/pwaDetection';
import type { PWAEnvironment, PWACapabilities } from '@/types/pwa';

export function usePWADetection() {
  const [environment, setEnvironment] = useState<PWAEnvironment>(
    pwaDetection.getPWAEnvironment()
  );
  const [capabilities, setCapabilities] = useState<PWACapabilities>(
    pwaDetection.getCapabilities()
  );
  const [installPromptShown, setInstallPromptShown] = useState<boolean>(
    pwaDetection.hasPromptBeenShown()
  );

  // Update detection state when display mode changes
  useEffect(() => {
    // Update on display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => {
      setEnvironment(pwaDetection.getPWAEnvironment());
      setCapabilities(pwaDetection.getCapabilities());
      setInstallPromptShown(pwaDetection.hasPromptBeenShown());
    };

    if ('addEventListener' in mediaQuery) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // @ts-ignore - Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Also check at regular intervals for iOS PWA installations
    // since iOS doesn't trigger media query changes reliably
    const checkInterval = setInterval(() => {
      if (pwaDetection.isPWA() !== environment.isPwa) {
        handleChange();
      }
    }, 2000);

    // Cleanup
    return () => {
      if ('removeEventListener' in mediaQuery) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // @ts-ignore - Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
      clearInterval(checkInterval);
    };
  }, [environment.isPwa]);

  // Wrapper for promptInstall to update state after prompting
  const promptInstall = useCallback(async () => {
    const result = await pwaDetection.promptInstall();
    setInstallPromptShown(pwaDetection.hasPromptBeenShown());
    return result;
  }, []);

  // Reset prompt state
  const resetInstallPrompt = useCallback(() => {
    pwaDetection.resetPromptState();
    setInstallPromptShown(false);
  }, []);

  return {
    ...environment,
    ...capabilities,
    isIOSPWA: pwaDetection.isIOSPWA(),
    isIOSPushCapable: pwaDetection.isIOSPushCapable(),
    installPromptShown,
    promptInstall,
    resetInstallPrompt,
    wasRecentlyInstalled: (minutes: number = 5) => pwaDetection.wasRecentlyInstalled(minutes)
  };
}

export default usePWADetection;
