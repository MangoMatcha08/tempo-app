import { useState, useEffect } from 'react';
import { recordTelemetryEvent } from '@/utils/iosPushTelemetry';
import { createMetadata } from '@/utils/telemetryUtils';

export type InstallStep = {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  troubleshooting?: string;
};

const useInstallProgress = () => {
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const saved = sessionStorage.getItem('pwa-install-step');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sessionStorage.setItem('pwa-install-step', currentStep.toString());
  }, [currentStep]);

  const nextStep = () => {
    setCurrentStep(prev => {
      const next = prev + 1;
      recordTelemetryEvent({
        eventType: 'pwa-install',
        isPWA: false,
        timestamp: Date.now(),
        result: 'success',
        metadata: createMetadata('Installation progress', { 
          step: next 
        })
      });
      return next;
    });
    setError(null);
  };

  const previousStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
    setError(null);
  };

  const handleError = (message: string) => {
    setError(message);
    recordTelemetryEvent({
      eventType: 'pwa-install',
      isPWA: false,
      timestamp: Date.now(),
      result: 'error',
      metadata: createMetadata('Installation error', {
        error: message,
        step: currentStep
      })
    });
  };

  return {
    currentStep,
    error,
    nextStep,
    previousStep,
    handleError,
    setCurrentStep
  };
};

export default useInstallProgress;
