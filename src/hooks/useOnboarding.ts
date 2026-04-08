import { useState, useCallback, useMemo } from 'react';
import { useUserStore } from '@/stores/useUserStore';

const TOTAL_STEPS = 3; // Steps 0, 1, 2

export function useOnboarding() {
  const [step, setStep] = useState(0);
  const profile = useUserStore((s) => s.profile);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const giveConsent = useUserStore((s) => s.giveConsent);

  const canProceed = useMemo(() => {
    switch (step) {
      case 0:
        // Step 0: Consent must be given
        return profile.consentGiven;
      case 1:
        // Step 1: Name must be provided
        return profile.name.trim().length > 0;
      case 2:
        // Step 2: At least one goal selected
        return profile.goals.length > 0;
      default:
        return false;
    }
  }, [step, profile.consentGiven, profile.name, profile.goals]);

  const nextStep = useCallback(() => {
    if (step < TOTAL_STEPS - 1 && canProceed) {
      setStep((s) => s + 1);
    }
  }, [step, canProceed]);

  const prevStep = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  }, [step]);

  const complete = useCallback(() => {
    if (canProceed) {
      completeOnboarding();
    }
  }, [canProceed, completeOnboarding]);

  return {
    step,
    nextStep,
    prevStep,
    canProceed,
    complete,
    totalSteps: TOTAL_STEPS,
    isFirstStep: step === 0,
    isLastStep: step === TOTAL_STEPS - 1,
  };
}
