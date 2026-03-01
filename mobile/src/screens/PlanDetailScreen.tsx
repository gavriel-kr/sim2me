import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { colors, spacing, radius, fontSize } from '../theme';
import { API_BASE_URL } from '../nav';
import type { RootStackParamList, Plan } from '../types';

type Route = RouteProp<RootStackParamList, 'PlanDetail'>;

const locationDisplay = (p: Plan) => p.locationName || (p as { location?: string }).location || '';

export function PlanDetailScreen() {
  const { params } = useRoute<Route>();
  const { plan } = params;

  const flagUri = plan.flagCode
    ? `https://flagcdn.com/w320/${plan.flagCode.toLowerCase()}.png`
    : `https://flagcdn.com/w320/${plan.locationCode.toLowerCase()}.png`;

  const handleBuy = () => {
    const base = API_BASE_URL.replace(/\/$/, '');
    const url = `${base}/destinations/${plan.locationCode.toLowerCase()}/plan/${plan.packageCode}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open checkout');
    });
  };

  const is5G = (plan.speed || '').toUpperCase().includes('5G');

  const details = [
    { icon: 'cellular-outline', label: 'Data', value: plan.dataAmount },
    { icon: 'time-outline', label: 'Validity', value: plan.duration },
    { icon: 'speedometer-outline', label: 'Speed', value: plan.speed || '4G/LTE' },
    { icon: 'globe-outline', label: 'Coverage', value: locationDisplay(plan) },
    { icon: 'card-outline', label: 'Price', value: `US$ ${plan.price.toFixed(2)}` },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTags}>
            {plan.featured ? (
              <View style={styles.heroTagFeatured}><Text style={styles.heroTagText}>Recommended</Text></View>
            ) : null}
            {plan.saleBadge ? (
              <View style={styles.heroTagSale}><Text style={styles.heroTagSaleText}>{plan.saleBadge}</Text></View>
            ) : null}
            {is5G ? (
              <View style={styles.heroTag5G}><Text style={styles.heroTag5GText}>5G</Text></View>
            ) : null}
          </View>
          <Image source={{ uri: flagUri }} style={styles.flag} resizeMode="cover" />
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.dataBadge}>
            <Text style={styles.dataText}>{plan.dataAmount}</Text>
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Total Price</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>US$</Text>
            <Text style={styles.price}>{plan.price.toFixed(2)}</Text>
          </View>
          <Text style={styles.priceNote}>One-time payment, no auto-renewal</Text>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Plan Details</Text>
          {details.map((d) => (
            <View key={d.label} style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name={d.icon as any} size={18} color={colors.textTertiary} />
                <Text style={styles.detailLabel}>{d.label}</Text>
              </View>
              <Text style={styles.detailValue}>{d.value}</Text>
            </View>
          ))}
        </View>

        {/* Info cards */}
        <View style={styles.infoCards}>
          <InfoCard
            icon="qr-code-outline"
            title="Instant Delivery"
            desc="QR code sent to your email within seconds"
          />
          <InfoCard
            icon="shield-checkmark-outline"
            title="Secure"
            desc="GSMA-certified eSIM technology"
          />
          <InfoCard
            icon="refresh-outline"
            title="No Hidden Fees"
            desc="One-time payment, no auto-renewal or roaming charges"
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPrice}>US$ {plan.price.toFixed(2)}</Text>
          <Text style={styles.bottomData}>{plan.dataAmount} · {plan.duration}</Text>
        </View>
        <TouchableOpacity style={styles.buyButton} onPress={handleBuy} activeOpacity={0.85}>
          <Text style={styles.buyText}>Buy Now</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function InfoCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <View style={styles.infoCard}>
      <Ionicons name={icon as any} size={20} color={colors.primary} />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base },

  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  heroTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  heroTagFeatured: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  heroTagText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  heroTagSale: {
    backgroundColor: colors.error + '18',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  heroTagSaleText: { fontSize: 11, fontWeight: '700', color: colors.error },
  heroTag5G: {
    backgroundColor: colors.info + '18',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  heroTag5GText: { fontSize: 11, fontWeight: '700', color: colors.info },
  flag: {
    width: 72,
    height: 50,
    borderRadius: radius.sm,
    backgroundColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  planName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  dataBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  dataText: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.primary,
  },

  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
  },
  priceLabel: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginRight: 4,
  },
  price: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.text,
  },
  priceNote: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },

  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },

  infoCards: {
    gap: spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryBg,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  infoTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  infoDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomPrice: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
  },
  bottomData: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.lg,
  },
  buyText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
});
