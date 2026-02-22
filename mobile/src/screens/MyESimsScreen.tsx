import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, radius, fontSize } from '../theme';
import { getMyEsims } from '../api/client';
import { FlagImage } from '../components/FlagImage';
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

export function MyESimsScreen() {
  const nav = useNavigation<Nav>();
  const { data: esims = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['myEsims'],
    queryFn: getMyEsims,
    staleTime: 2 * 60 * 1000,
  });

  const onEsimPress = (esim: ESim) => {
    nav.navigate('ESimDetail', { esim });
  };

  if (esims.length === 0 && !isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My eSIMs</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="phone-portrait-outline" size={48} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No eSIMs yet</Text>
          <Text style={styles.emptyDesc}>
            Your purchased eSIMs will appear here.{'\n'}Sign in and buy plans on the website, or browse destinations to get started.
          </Text>
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
            <TouchableOpacity
              key={esim.id}
              style={styles.card}
              onPress={() => onEsimPress(esim)}
              activeOpacity={0.8}
            >
              <View style={styles.cardLeft}>
                <FlagImage code={getFlagCodeForDestination(esim.destinationName)} size={40} rounded />
                <View style={styles.cardText}>
                  <Text style={styles.cardDestination}>{esim.destinationName}</Text>
                  <Text style={styles.cardPlan}>{esim.planName}</Text>
                  <Text style={styles.cardOrder}>Order: {esim.orderId}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <View
                  style={[
                    styles.statusBadge,
                    esim.status === 'activated' ? styles.statusActivated : styles.statusPending,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {esim.status === 'activated' ? 'Active' : 'Pending'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    marginBottom: spacing.md,
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
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.text,
  },
  cardPlan: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardOrder: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
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
    backgroundColor: colors.warning + '22',
  },
  statusActivated: {
    backgroundColor: colors.success + '22',
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.text,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    fontSize: fontSize.base,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
