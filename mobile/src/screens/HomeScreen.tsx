import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, radius, fontSize } from '../theme';
import { getPackages } from '../api/client';
import { SearchBar } from '../components/SearchBar';
import { DestinationCard } from '../components/DestinationCard';
import { SectionHeader } from '../components/SectionHeader';
import type { RootStackParamList, Destination } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FEATURES = [
  { icon: 'flash-outline' as const, title: 'Instant\nDelivery', color: '#10b981' },
  { icon: 'globe-outline' as const, title: '200+\nCountries', color: '#3b82f6' },
  { icon: 'shield-checkmark-outline' as const, title: 'Secure\nPayment', color: '#8b5cf6' },
  { icon: 'headset-outline' as const, title: '24/7\nSupport', color: '#f59e0b' },
];

export function HomeScreen() {
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['packages'],
    queryFn: () => getPackages(),
    staleTime: 5 * 60 * 1000,
  });

  const destinations = data?.destinations ?? [];
  const popular = useMemo(() => destinations.filter((d) => d.featured).slice(0, 10), [destinations]);
  const regions = useMemo(() => destinations.filter((d) => d.isRegional).slice(0, 8), [destinations]);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return destinations.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.locationCode.toLowerCase().includes(q) ||
        d.continent.toLowerCase().includes(q)
    );
  }, [search, destinations]);

  const goToDestination = (d: Destination) => {
    nav.navigate('DestinationDetail', {
      locationCode: d.locationCode,
      name: d.name,
      flagCode: d.flagCode,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.logo}>
            Sim<Text style={styles.logoAccent}>2</Text>Me
          </Text>
          <Text style={styles.heroTitle}>Stay connected{'\n'}anywhere you travel</Text>
          <Text style={styles.heroSub}>
            Buy eSIM data for 200+ countries. Instant delivery, no physical SIM needed.
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Where are you traveling?" />
        </View>

        {/* Search Results */}
        {search.trim().length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={`Results (${filtered.length})`} />
            {filtered.length === 0 ? (
              <Text style={styles.emptyText}>No destinations found</Text>
            ) : (
              filtered.slice(0, 10).map((d) => (
                <View key={d.locationCode} style={{ paddingHorizontal: spacing.base }}>
                  <DestinationCard destination={d} onPress={() => goToDestination(d)} />
                </View>
              ))
            )}
          </View>
        )}

        {/* Features */}
        {!search.trim() && (
          <>
            <View style={styles.features}>
              {FEATURES.map((f) => (
                <View key={f.title} style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: f.color + '18' }]}>
                    <Ionicons name={f.icon} size={22} color={f.color} />
                  </View>
                  <Text style={styles.featureLabel}>{f.title}</Text>
                </View>
              ))}
            </View>

            {/* Popular Destinations */}
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <>
                <SectionHeader
                  title="Popular Destinations"
                  action="See All"
                  onAction={() => nav.navigate('Tabs', { screen: 'Destinations' } as any)}
                />
                <FlatList
                  data={popular}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: spacing.base }}
                  keyExtractor={(d) => d.locationCode}
                  renderItem={({ item }) => (
                    <DestinationCard destination={item} onPress={() => goToDestination(item)} compact />
                  )}
                />

                {/* Regional Plans */}
                {regions.length > 0 && (
                  <View style={styles.section}>
                    <SectionHeader title="Regional Plans" action="See All" onAction={() => nav.navigate('Tabs', { screen: 'Destinations' } as any)} />
                    <FlatList
                      data={regions}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: spacing.base }}
                      keyExtractor={(d) => d.locationCode}
                      renderItem={({ item }) => (
                        <DestinationCard destination={item} onPress={() => goToDestination(item)} compact />
                      )}
                    />
                  </View>
                )}

                {/* How It Works */}
                <View style={styles.section}>
                  <SectionHeader title="How It Works" />
                  <View style={styles.stepsContainer}>
                    {[
                      { step: '1', title: 'Choose a Plan', desc: 'Browse 200+ destinations and pick your data plan' },
                      { step: '2', title: 'Get Your eSIM', desc: 'Receive QR code instantly via email' },
                      { step: '3', title: 'Connect', desc: 'Scan QR code and enjoy mobile data' },
                    ].map((s, i) => (
                      <View key={s.step} style={styles.stepCard}>
                        <View style={styles.stepBadge}>
                          <Text style={styles.stepNumber}>{s.step}</Text>
                        </View>
                        <Text style={styles.stepTitle}>{s.title}</Text>
                        <Text style={styles.stepDesc}>{s.desc}</Text>
                        {i < 2 && <View style={styles.stepDivider} />}
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },

  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.primaryBg,
  },
  logo: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  logoAccent: {
    color: colors.primary,
  },
  heroTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: '800',
    color: colors.text,
    lineHeight: 42,
  },
  heroSub: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },

  searchSection: {
    paddingHorizontal: spacing.base,
    marginTop: -spacing.lg,
    marginBottom: spacing.lg,
  },

  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.base,
    marginBottom: spacing['2xl'],
  },
  featureItem: {
    alignItems: 'center',
    width: 70,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  featureLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },

  section: {
    marginTop: spacing.xl,
  },

  emptyText: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: fontSize.base,
    paddingVertical: spacing['2xl'],
  },

  stepsContainer: {
    paddingHorizontal: spacing.base,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    flexWrap: 'wrap',
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumber: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
  stepTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  stepDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 44,
    width: '100%',
    lineHeight: 20,
  },
  stepDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginLeft: 15,
    marginTop: 4,
  },
});
