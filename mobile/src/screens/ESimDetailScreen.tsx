import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

import { colors, spacing, radius, fontSize } from '../theme';
import type { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'ESimDetail'>;

const INSTALL_STEPS = [
  'Open Settings → Cellular → Add Cellular Plan',
  'Scan the QR code below',
  'Activate when you arrive at your destination',
];

export function ESimDetailScreen() {
  const { params } = useRoute<Route>();
  const { esim } = params;
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await Clipboard.setStringAsync(esim.activationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Error', 'Could not copy to clipboard');
    }
  };

  const isActivated = esim.status === 'activated';

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
            <View style={[styles.badge, isActivated ? styles.badgeActivated : styles.badgePending]}>
              <Text style={styles.badgeText}>
                {esim.status === 'activated' ? 'Activated' : 'Pending'}
              </Text>
            </View>
          </View>
          <Text style={styles.planName}>{esim.planName}</Text>
          <Text style={styles.orderId}>Order: {esim.orderId}</Text>
        </View>

        {/* Install instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Install instructions</Text>
          <View style={styles.stepsCard}>
            {INSTALL_STEPS.map((step, i) => (
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
            {esim.qrPlaceholder ? (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.qrPlaceholderText}>QR code</Text>
                <Text style={styles.qrPlaceholderSub}>Available in your email</Text>
              </View>
            ) : (
              <Text style={styles.qrPlaceholderText}>QR code would display here</Text>
            )}
          </View>
        </View>

        {/* Activation code + copy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activation code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText} selectable>
              {esim.activationCode}
            </Text>
            <TouchableOpacity
              style={[styles.copyBtn, copied && styles.copyBtnDone]}
              onPress={copyCode}
              activeOpacity={0.8}
            >
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={20}
                color={copied ? colors.success : colors.primary}
              />
              <Text style={[styles.copyBtnText, copied && styles.copyBtnTextDone]}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
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
  badgeActivated: {
    backgroundColor: colors.success + '22',
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
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
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
