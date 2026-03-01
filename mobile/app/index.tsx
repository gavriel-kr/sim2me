import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    // Always go to main app. My eSIMs tab handles auth gating internally.
    router.replace('/(main)');
  }, [hydrated, router]);

  return null;
}
