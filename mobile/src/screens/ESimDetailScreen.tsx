import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';

import { colors, spacing, radius, fontSize } from '../theme';
import { getEsimUsage } from '../services/api';
import { DataUsageRing } from '../components/DataUsageRing';
import type { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'ESimDetail'>;

const INSTALL_STEPS_IOS = [
  'Open Settings → Cellular → Add Cellular Plan',
  'Scan the QR code below or enter the activation code',
  'Activate when you arrive at your destination',
];

const INSTALL_STEPS_ANDROID = [
  'Open Settings → Network & internet → SIMs → Add eSIM',
  'Scan the QR code below or enter the activation code',
  'Activate when you arrive at your destination',
];

export function ESimDetailScreen() {
  const { params } = useRoute<Route>();
  const { esim } = params;
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSmdp, setCopiedSmdp] = useState(false);

  const { data: usage } = useQuery({
    queryKey: ['esim-usage', esim.iccid, esim.orderId],
    queryFn: () => getEsimUsage(esim.iccid!, esim.orderId),
    enabled: !!esim.iccid && !!esim.orderId,
    staleTime: 60 * 1000,
  });

  const copyCode = async () => {
    if (!esim.activationCode) return;
    try {
      await Clipboard.setStringAsync(esim.activationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      Alert.alert('Error', 'Could not copy to clipboard');
    }
  };

  const copySmdp = async () => {
    if (!esim.smdpAddress) return;
    try {
      await Clipboard.setStringAsync(esim.smdpAddress);
      setCopiedSmdp(true);
      setTimeout(() => setCopiedSmdp(false), 2000);
    } catch {
      Alert.alert('Error', 'Could not copy to clipboard');
    }
  };

  const expiredByUsage = usage?.expiredTime != null && usage.expiredTime > 0 && Date.now() > usage.expiredTime;
  const isActive = esim.status === 'active' && !expiredByUsage;
  const isExpired = esim.status === 'expired' || expiredByUsage;
  const installSteps = Platform.OS === 'ios' ? INSTALL_STEPS_IOS : INSTALL_STEPS_ANDROID;
  const orderVol = usage?.orderVolume ?? esim.orderVolume ?? 0;
  const usedVol = usage?.usedVolume ?? esim.usedVolume ?? 0;
  const hasUsage = orderVol > 0 || usedVol > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: destination, plan, status */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.destination}>{esim.destinationName}</Text>
            <View
              style={[
                styles.badge,
                isActive && styles.badgeActive,
                isExpired && styles.badgeExpired,
                !isActive && !isExpired && styles.badgePending,
              ]}
            >
              <Text style={styles.badgeText}>
                {isExpired ? 'Expired' : isActive ? 'Active' : 'Pending'}
              </Text>
            </View>
          </View>
          <Text style={styles.planName}>{esim.planName}</Text>
          {(esim.dataAmount || esim.validity) && (
            <Text style={styles.orderId}>
              {[esim.dataAmount, esim.validity].filter(Boolean).join(' · ')}
            </Text>
          )}
          {hasUsage && (
            <View style={styles.usageRow}>
              <DataUsageRing
                used={usedVol}
                total={orderVol > 0 ? orderVol : 1}
                size={64}
                strokeWidth={5}
              />
              <Text style={styles.usageLabel}>Data used</Text>
            </View>
          )}
        </View>

        {/* Install instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Install instructions</Text>
          <View style={styles.stepsCard}>
            {installSteps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* QR code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR code</Text>
          <View style={styles.qrBox}>
            {esim.qrCodeUrl ? (
              <Image
                source={{ uri: esim.qrCodeUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : esim.qrPlaceholder ? (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.qrPlaceholderText}>QR code</Text>
                <Text style={styles.qrPlaceholderSub}>Available in your email</Text>
              </View>
            ) : (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.qrPlaceholderText}>QR code not yet available</Text>
              </View>
            )}
          </View>
        </View>

        {/* SM-DP+ Address + copy */}
        {esim.smdpAddress ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SM-DP+ Address</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeText} selectable numberOfLines={2}>
                {esim.smdpAddress}
              </Text>
              <TouchableOpacity
                style={[styles.copyBtn, copiedSmdp && styles.copyBtnDone]}
                onPress={copySmdp}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copiedSmdp ? 'checkmark-circle' : 'copy-outline'}
                  size={20}
                  color={copiedSmdp ? colors.success : colors.primary}
                />
                <Text style={[styles.copyBtnText, copiedSmdp && styles.copyBtnTextDone]}>
                  {copiedSmdp ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Activation code + copy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activation code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText} selectable>
              {esim.activationCode || '—'}
            </Text>
            {esim.activationCode ? (
              <TouchableOpacity
                style={[styles.copyBtn, copiedCode && styles.copyBtnDone]}
                onPress={copyCode}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copiedCode ? 'checkmark-circle' : 'copy-outline'}
                  size={20}
                  color={copiedCode ? colors.success : colors.primary}
                />
                <Text style={[styles.copyBtnText, copiedCode && styles.copyBtnTextDone]}>
                  {copiedCode ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base },

  header: {
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  destination: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgePending: {
    backgroundColor: colors.warning + '22',
  },
  badgeActive: {
    backgroundColor: colors.success + '22',
  },
  badgeExpired: {
    backgroundColor: colors.textTertiary + '22',
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.text,
  },
  planName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  orderId: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 4,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  usageLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: 22,
  },

  qrBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrPlaceholder: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  qrPlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  qrPlaceholderSub: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 4,
  },

  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  codeText: {
    flex: 1,
    fontSize: fontSize.base,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: colors.text,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryBg,
  },
  copyBtnDone: {
    backgroundColor: colors.success + '18',
  },
  copyBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  copyBtnTextDone: {
    color: colors.success,
  },
});
