import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontSize } from '../../src/theme';
import { register as apiRegister } from '../../src/services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    lastName: '',
    phone: '',
    newsletter: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError('');
    if (!form.email.trim() || !form.password || !form.name.trim() || !form.phone) {
      setError('Please fill in email, password, name, and phone');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await apiRegister({
        email: form.email,
        password: form.password,
        name: form.name,
        lastName: form.lastName || undefined,
        phone: form.phone,
        newsletter: form.newsletter,
      });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>Account created</Text>
          <Text style={styles.successText}>You can sign in with your email and password.</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Go to sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Same account as sim2me.net</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
            placeholder="you@example.com"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.label}>Password (min 8 characters)</Text>
          <TextInput
            style={styles.input}
            value={form.password}
            onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
            placeholder="Password"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
            editable={!loading}
          />

          <Text style={styles.label}>First name</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="First name"
            placeholderTextColor={colors.textTertiary}
            editable={!loading}
          />

          <Text style={styles.label}>Last name (optional)</Text>
          <TextInput
            style={styles.input}
            value={form.lastName}
            onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))}
            placeholder="Last name"
            placeholderTextColor={colors.textTertiary}
            editable={!loading}
          />

          <Text style={styles.label}>Phone (e.g. +1234567890)</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="+1234567890"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Create account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              disabled={loading}
            >
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  header: { marginBottom: spacing.xl },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: `${colors.error}18`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  errorText: { fontSize: fontSize.sm, color: colors.error },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.text,
    marginBottom: spacing.base,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 48,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: { fontSize: fontSize.sm, color: colors.textSecondary },
  footerLink: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
  successBox: {
    flex: 1,
    paddingHorizontal: spacing.base,
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  successText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
});
