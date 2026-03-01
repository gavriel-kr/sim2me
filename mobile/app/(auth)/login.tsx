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
import { login as apiLogin } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await apiLogin(email, password);
      await setAuth(token, user);
      router.replace('/(main)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>Use your sim2me.net account</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
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
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              disabled={loading}
            >
              <Text style={styles.footerLink}>Create account</Text>
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
    paddingTop: spacing['2xl'],
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
});
