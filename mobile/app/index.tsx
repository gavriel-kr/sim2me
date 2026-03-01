import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (token) {
      router.replace('/(main)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [hydrated, token, router]);

  return null;
}
