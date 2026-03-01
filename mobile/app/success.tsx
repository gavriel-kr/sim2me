import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../src/theme';

/**
 * Shown after successful payment (e.g. deep link from web checkout).
 * User can go to My eSIMs to see the new order.
 */
export default function SuccessScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </View>
        <Text style={styles.title}>Payment successful</Text>
        <Text style={styles.subtitle}>
          Your eSIM will appear in My eSIMs shortly. You can also check your email for the QR code.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(main)')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>View My eSIMs</Text>
          <Ionicons name="phone-portrait-outline" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing['2xl'],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
  },
  buttonText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
});
