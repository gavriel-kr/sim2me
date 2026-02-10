import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, radius, fontSize } from '../theme';
import { getPackages } from '../api/client';
import { SearchBar } from '../components/SearchBar';
import { DestinationCard } from '../components/DestinationCard';
import type { RootStackParamList, Destination } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Tab = 'countries' | 'regions';
type SortOption = 'name' | 'price' | 'popular';

const CONTINENTS = ['All', 'Asia', 'Europe', 'Africa', 'North America', 'South America', 'Oceania', 'Global'];

export function DestinationsScreen() {
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('countries');
  const [continent, setContinent] = useState('All');
  const [sort, setSort] = useState<SortOption>('popular');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['packages'],
    queryFn: () => getPackages(),
    staleTime: 5 * 60 * 1000,
  });

  const destinations = data?.destinations ?? [];

  const filtered = useMemo(() => {
    let list = destinations.filter((d) => (tab === 'countries' ? !d.isRegional : d.isRegional));

    if (continent !== 'All') {
      list = list.filter((d) => d.continent === continent);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.locationCode.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sort) {
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        list.sort((a, b) => a.minPrice - b.minPrice);
        break;
      case 'popular':
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.planCount - a.planCount);
        break;
    }

    return list;
  }, [destinations, tab, continent, search, sort]);

  const goToDestination = (d: Destination) => {
    nav.navigate('DestinationDetail', {
      locationCode: d.locationCode,
      name: d.name,
      flagCode: d.flagCode,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Destinations</Text>
        <Text style={styles.subtitle}>{destinations.length} available</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search country or region..." />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['countries', 'regions'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'countries' ? 'Countries' : 'Regions'}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.sortRow}>
          {(['popular', 'name', 'price'] as SortOption[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sortChip, sort === s && styles.sortChipActive]}
              onPress={() => setSort(s)}
            >
              <Text style={[styles.sortText, sort === s && styles.sortTextActive]}>
                {s === 'popular' ? 'Popular' : s === 'name' ? 'A-Z' : 'Price'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Continent filter (horizontal) */}
      <FlatList
        data={CONTINENTS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.continentBar}
        keyExtractor={(c) => c}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.continentChip, continent === item && styles.continentChipActive]}
            onPress={() => setContinent(item)}
          >
            <Text style={[styles.continentText, continent === item && styles.continentTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Results */}
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.locationCode}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No destinations found</Text>
              <Text style={styles.emptyHint}>Try changing your filters</Text>
            </View>
          }
          ListHeaderComponent={
            <Text style={styles.resultCount}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</Text>
          }
          renderItem={({ item }) => (
            <DestinationCard destination={item} onPress={() => goToDestination(item)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  searchRow: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },

  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },

  sortRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: 'auto',
  },
  sortChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  sortChipActive: {
    backgroundColor: colors.primaryBg,
  },
  sortText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  sortTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  continentBar: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  continentChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  continentChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  continentText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  continentTextActive: {
    color: colors.white,
    fontWeight: '600',
  },

  list: {
    paddingHorizontal: spacing.base,
    paddingBottom: 100,
  },
  resultCount: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  emptyHint: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 4,
  },
});
