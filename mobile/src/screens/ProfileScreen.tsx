import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, fontSize } from '../theme';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../nav';
import type { RootStackParamList } from '../types';

const baseUrl = API_BASE_URL.replace(/\/$/, '');

const MENU_SECTIONS = [
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help Center', url: `${baseUrl}/help`, internal: false },
      { icon: 'chatbubble-outline', label: 'Contact Us', url: `${baseUrl}/contact`, internal: false },
      { icon: 'book-outline', label: 'Installation guide', url: 'InstallationGuide', internal: true },
      { icon: 'document-text-outline', label: 'How It Works', url: `${baseUrl}/how-it-works`, internal: false },
      { icon: 'phone-portrait-outline', label: 'Compatible Devices', url: `${baseUrl}/compatible-devices`, internal: false },
      { icon: 'receipt-outline', label: 'Order history & invoices', url: `${baseUrl}/account`, internal: false },
    ],
  },
  {
    title: 'Legal',
    items: [
      { icon: 'shield-outline', label: 'Privacy Policy', url: `${baseUrl}/privacy`, internal: false },
      { icon: 'document-outline', label: 'Terms of Service', url: `${baseUrl}/terms`, internal: false },
      { icon: 'refresh-outline', label: 'Refund Policy', url: `${baseUrl}/refund`, internal: false },
    ],
  },
];

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const router = useRouter();
  const nav = useNavigation<Nav>();
  const { user, logout } = useAuthStore();

  const openLink = (url: string, internal?: boolean) => {
    if (internal && url === 'InstallationGuide') {
      nav.navigate('InstallationGuide');
      return;
    }
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open page'));
  };

  async function handleSignOut() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={colors.white} />
          </View>
          <Text style={styles.name}>{user?.name ? `Hi, ${user.name}` : 'Sim2Me'}</Text>
          <Text style={styles.email}>{user?.email ?? 'Signed in — eSIMs synced with account'}</Text>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signInButton}
          onPress={handleSignOut}
          activeOpacity={0.85}
        >
          <View style={styles.signInButtonContent}>
            <Ionicons name="log-out-outline" size={20} color={colors.white} />
            <Text style={styles.signInText}>Sign out</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.connectHint}>
          Your eSIMs and orders are synced with {API_BASE_URL.replace(/^https?:\/\//, '')}.
        </Text>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, i < section.items.length - 1 && styles.menuItemBorder]}
                  onPress={() => openLink(item.url, 'internal' in item && item.internal)}
                  activeOpacity={0.6}
                >
                  <Ionicons name={item.icon as any} size={20} color={colors.textSecondary} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Version */}
        <Text style={styles.version}>Sim2Me v1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base },

  header: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 4,
  },

  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  signInButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectHint: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  signInText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },

  menuSection: {
    marginBottom: spacing.lg,
  },
  menuSectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: '500',
  },

  version: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xl,
  },
});
