import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 2, refetchOnWindowFocus: false },
  },
});

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
