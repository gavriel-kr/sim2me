import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../theme';
import type { Destination } from '../types';

interface Props {
  destination: Destination;
  onPress: () => void;
  compact?: boolean;
}

export function DestinationCard({ destination, onPress, compact = false }: Props) {
  const flagUri = destination.flagCode
    ? `https://flagcdn.com/w160/${destination.flagCode.toLowerCase()}.png`
    : `https://flagcdn.com/w160/${destination.locationCode.toLowerCase()}.png`;

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.7}>
        <Image source={{ uri: flagUri }} style={styles.compactFlag} resizeMode="cover" />
        <Text style={styles.compactName} numberOfLines={1}>
          {destination.name}
        </Text>
        <Text style={styles.compactPrice}>
          from ${destination.minPrice.toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.flagContainer}>
        <Image source={{ uri: flagUri }} style={styles.flag} resizeMode="cover" />
        {destination.featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color={colors.white} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {destination.name}
        </Text>
        <Text style={styles.meta}>
          {destination.planCount} plan{destination.planCount !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.from}>from</Text>
        <Text style={styles.price}>${destination.minPrice.toFixed(2)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  flagContainer: {
    position: 'relative',
  },
  flag: {
    width: 48,
    height: 34,
    borderRadius: 6,
    backgroundColor: colors.borderLight,
  },
  featuredBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.warning,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  priceRow: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  from: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  price: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.primary,
  },

  // Compact (horizontal scroll)
  compactCard: {
    width: 130,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  compactFlag: {
    width: 56,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  compactName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  compactPrice: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
});
