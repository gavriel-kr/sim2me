import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../theme';
import type { Plan } from '../types';

interface Props {
  plan: Plan;
  onPress: () => void;
}

const locationDisplay = (p: Plan) => p.locationName || (p as { location?: string }).location || '';

export function PlanCard({ plan, onPress }: Props) {
  const is5G = (plan.speed || '').toUpperCase().includes('5G');
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Tags: Best Seller / Sale */}
      <View style={styles.tagsRow}>
        {plan.featured ? (
          <View style={styles.tagFeatured}>
            <Text style={styles.tagFeaturedText}>Recommended</Text>
          </View>
        ) : null}
        {plan.saleBadge ? (
          <View style={styles.tagSale}>
            <Text style={styles.tagSaleText}>{plan.saleBadge}</Text>
          </View>
        ) : null}
        {is5G ? (
          <View style={styles.tag5G}>
            <Text style={styles.tag5GText}>5G</Text>
          </View>
        ) : null}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.dataBadge}>
          <Text style={styles.dataText}>{plan.dataAmount}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>US$</Text>
          <Text style={styles.price}>{plan.price.toFixed(2)}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <DetailRow icon="time-outline" label="Validity" value={plan.duration} />
        <DetailRow icon="speedometer-outline" label="Speed" value={plan.speed || '4G/LTE'} />
        <DetailRow icon="globe-outline" label="Coverage" value={locationDisplay(plan)} />
      </View>

      {/* Buy button */}
      <View style={styles.buyRow}>
        <Text style={styles.buyLabel}>View Details</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={16} color={colors.textTertiary} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  tagFeatured: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tagFeaturedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tagSale: {
    backgroundColor: colors.error + '18',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tagSaleText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.error,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tag5G: {
    backgroundColor: colors.info + '18',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tag5GText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.info,
    letterSpacing: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dataBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  dataText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginRight: 2,
  },
  price: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  details: {
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    flex: 1,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  buyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryBg,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  buyLabel: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.primary,
  },
});
