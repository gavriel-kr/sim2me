import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useNavigation } from 'expo-router';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, radius, fontSize } from '../theme';
import { getOrders } from '../services/api';
import { ordersToEsims } from '../services/ordersToEsim';
import { useAuthStore } from '../store/authStore';
import { FlagImage } from '../components/FlagImage';
import { DataUsageRing } from '../components/DataUsageRing';
import { API_BASE_URL } from '../nav';
import type { RootStackParamList, ESim } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function getFlagCodeForDestination(name: string): string {
  const m: Record<string, string> = {
    'United States': 'us',
    'Europe (42 countries)': 'eu',
    'Japan': 'jp',
    'Thailand': 'th',
    'United Kingdom': 'gb',
    'Australia': 'au',
  };
  return m[name] || 'un';
}

function maskIccid(iccid: string | null): string {
  if (!iccid) return '—';
  if (iccid.length <= 8) return iccid;
  return `…${iccid.slice(-4)}`;
}

export function MyESimsScreen() {
  const router = useRouter();
  const nav = useNavigation<Nav>();
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  // Not logged in: show sign-in prompt
  if (!token) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My eSIMs</Text>
          <Text style={styles.subtitle}>Your plans and data usage</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed-outline" size={48} color={colors.primary} />
            </View>
          </View>
          <Text style={styles.emptyTitle}>Sign in to view your eSIMs</Text>
          <Text style={styles.emptyDesc}>
            Use the same account you use on sim2me.net to see your purchased eSIMs here.
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={22} color={colors.white} />
            <Text style={styles.exploreButtonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exploreButton, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary, marginTop: 12 }]}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.85}
          >
            <Text style={[styles.exploreButtonText, { color: colors.primary }]}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const {
    data: orders = [],
    isLoading,
    refetch,
    isRefetching,
    error,
    isError,
  } = useQuery({
    queryKey: ['account', 'orders'],
    queryFn: async () => {
      const list = await getOrders();
      return list;
    },
    staleTime: 2 * 60 * 1000,
    retry: (failureCount, err) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401')) return false;
      return failureCount < 2;
    },
  });

  React.useEffect(() => {
    if (isError && error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        logout().then(() => router.replace('/(auth)/login'));
      }
    }
  }, [isError, error, logout, router]);

  const esims = React.useMemo(() => ordersToEsims(orders), [orders]);

  const onEsimPress = (esim: ESim) => {
    nav.navigate('ESimDetail', { esim });
  };

  const openTopUp = () => {
    Linking.openURL(`${API_BASE_URL}/account/esims`).catch(() =>
      Alert.alert('Error', 'Could not open page')
    );
  };

  const goToExplore = () => {
    (nav as any).navigate('Home');
  };

  if (esims.length === 0 && !isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My eSIMs</Text>
          <Text style={styles.subtitle}>Your plans and data usage</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <View style={styles.iconCircle}>
              <Ionicons name="phone-portrait-outline" size={52} color={colors.primary} />
            </View>
          </View>
          <Text style={styles.emptyTitle}>No eSIMs yet</Text>
          <Text style={styles.emptyDesc}>
            Your purchased eSIMs will appear here. Sign in with the same account you use on the website to see them.
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={goToExplore}
            activeOpacity={0.85}
          >
            <Ionicons name="compass-outline" size={22} color={colors.white} />
            <Text style={styles.exploreButtonText}>Explore Plans</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My eSIMs</Text>
        <Text style={styles.subtitle}>Connect and manage your eSIMs</Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
          {esims.map((esim) => (
            <View key={esim.id} style={styles.card}>
              <TouchableOpacity
                style={styles.cardMain}
                onPress={() => onEsimPress(esim)}
                activeOpacity={0.8}
              >
                <View style={styles.cardLeft}>
                  <FlagImage code={getFlagCodeForDestination(esim.destinationName)} size={44} rounded />
                  <View style={styles.cardText}>
                    <Text style={styles.cardDestination}>{esim.destinationName}</Text>
                    <Text style={styles.cardPlan}>{esim.planName}</Text>
                    {(esim.dataAmount || esim.validity) && (
                      <Text style={styles.cardMeta}>
                        {[esim.dataAmount, esim.validity].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                    {esim.iccid && (
                      <Text style={styles.cardIccid}>ICCID {maskIccid(esim.iccid)}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <DataUsageRing
                    used={esim.usedVolume ?? 0}
                    total={esim.orderVolume && esim.orderVolume > 0 ? esim.orderVolume : 1}
                    size={48}
                    strokeWidth={4}
                  />
                  <View
                    style={[
                      styles.statusBadge,
                      esim.status === 'active' && styles.statusActive,
                      esim.status === 'expired' && styles.statusExpired,
                      esim.status === 'pending' && styles.statusPending,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {esim.status === 'active' ? 'Active' : esim.status === 'expired' ? 'Expired' : 'Pending'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onEsimPress(esim)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
                  <Text style={styles.actionBtnText}>Install eSIM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnSecondary]}
                  onPress={openTopUp}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.actionBtnTextSecondary}>Top up</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 4,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },

  list: {
    paddingHorizontal: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
    overflow: 'hidden',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  cardDestination: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
  },
  cardPlan: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  cardMeta: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  cardIccid: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusPending: {
    backgroundColor: `${colors.warning}22`,
  },
  statusActive: {
    backgroundColor: `${colors.success}22`,
  },
  statusExpired: {
    backgroundColor: `${colors.textTertiary}22`,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.text,
  },

  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryBg,
  },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
  },
  actionBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  actionBtnTextSecondary: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingBottom: 80,
  },
  emptyIconWrap: {
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  emptyDesc: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreButtonText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.2,
  },
});
