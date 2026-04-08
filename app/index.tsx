import { Redirect } from 'expo-router';
import { useUserStore } from '@/stores/useUserStore';

export default function Index() {
  const onboardingComplete = useUserStore((s) => s.profile.onboardingComplete);
  return <Redirect href={onboardingComplete ? '/(tabs)' : '/onboarding/welcome'} />;
}
