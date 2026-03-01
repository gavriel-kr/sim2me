import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../theme';
import { API_BASE_URL } from '../nav';

const IOS_STEPS = [
  'Go to Settings → Cellular (or Mobile Data).',
  'Tap Add Cellular Plan.',
  'Scan the QR code you received, or enter the SM-DP+ address and Activation Code manually.',
  'Label the plan (e.g. "Travel") and tap Continue.',
  'Turn on the line when you arrive. Enable Data Roaming for this plan.',
];

const ANDROID_STEPS = [
  'Go to Settings → Network & internet → SIMs (or Mobile network).',
  'Tap Add eSIM or Download a SIM instead.',
  'Scan the QR code, or choose "Enter details manually" and add SM-DP+ and Activation Code.',
  'Name the eSIM and confirm. Activate when you land and turn on Data Roaming for this SIM.',
];

const TIPS = [
  'Install the eSIM while you have Wi‑Fi (e.g. before you travel).',
  'Only turn on Data Roaming when you are in the destination country.',
  'Keep the QR code and activation details in a safe place.',
];

export function InstallationGuideScreen() {
  const openWebGuide = () => {
    const base = API_BASE_URL.replace(/\/$/, '');
    Linking.openURL(`${base}/installation-guide`);
  };

  const steps = Platform.OS === 'ios' ? IOS_STEPS : ANDROID_STEPS;
  const deviceName = Platform.OS === 'ios' ? 'iPhone (iOS)' : 'Android';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>eSIM installation guide</Text>
        <Text style={styles.subtitle}>
          Follow these steps to install your eSIM on your {deviceName} device.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{deviceName}</Text>
          <View style={styles.stepsCard}>
            {steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips</Text>
          <View style={styles.tipsCard}>
            {TIPS.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Ionicons name="bulb-outline" size={18} color={colors.primary} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.pdfButton} onPress={openWebGuide} activeOpacity={0.85}>
          <Ionicons name="document-text-outline" size={22} color={colors.primary} />
          <Text style={styles.pdfButtonText}>Open full guide (PDF / print)</Text>
          <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base },

  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },

  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
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
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
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

  tipsCard: {
    backgroundColor: colors.primaryBg,
    borderRadius: radius.xl,
    padding: spacing.base,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  pdfButtonText: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.primary,
  },
});
