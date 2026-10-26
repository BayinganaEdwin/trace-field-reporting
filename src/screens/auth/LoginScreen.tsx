import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import {
  setCurrentUserId,
  setCurrentUserRole,
  setCurrentUserName,
  DEMO_USER_MAP,
  API_BASE_URL,
} from '../../services/config';
import { useReports } from '../../hooks/useReports';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// Demo emails map directly to seeded backend user IDs via DEMO_USER_MAP.
// These bypass the API call (no network needed for the demo tiles).
const DEMO_ACCOUNTS = [
  {
    role: 'worker' as const,
    label: 'Site Worker',
    name: 'Amara Diallo',
    email: 'worker@trace.demo',
    password: '••••••••',
    detail: 'Submit field reports & photos',
  },
  {
    role: 'manager' as const,
    label: 'Project Manager',
    name: 'Fatima Nkusi',
    email: 'manager@trace.demo',
    password: '••••••••',
    detail: 'Review, approve & monitor sites',
  },
  {
    role: 'owner' as const,
    label: 'Property Owner',
    name: 'Patrick Habimana',
    email: 'owner@trace.demo',
    password: '••••••••',
    detail: 'View project progress & reports',
  },
];

export function LoginScreen({ navigation }: Props) {
  const { refresh } = useReports();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[0]) => {
    Haptics.selectionAsync();
    setEmail(account.email);
    setPassword(account.password);
  };

  const handleSignIn = async () => {
    if (!email) return;
    setLoading(true);

    // ── Demo shortcut: known demo emails bypass the API ───────────────────
    const demoPrefix = email.startsWith('manager@trace')
      ? 'manager'
      : email.startsWith('owner@trace')
        ? 'owner'
        : email.startsWith('worker@trace')
          ? 'worker'
          : null;

    if (demoPrefix) {
      setCurrentUserId(DEMO_USER_MAP[demoPrefix]);
      setCurrentUserRole(demoPrefix as 'worker' | 'manager' | 'owner');
      refresh();
      setLoading(false);
      if (demoPrefix === 'manager') navigation.replace('ManagerApp');
      else if (demoPrefix === 'owner') navigation.replace('OwnerApp');
      else navigation.replace('WorkerApp');
      return;
    }

    // ── Real account: look up by email via API ─────────────────────────────
    try {
      const res = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        Alert.alert(
          'Sign in failed',
          body.error ??
            'Email not found. Check your credentials or create an account.',
        );
        return;
      }
      setCurrentUserId(body.id);
      setCurrentUserRole(body.role as 'worker' | 'manager' | 'owner');
      setCurrentUserName(body.name);
      refresh();
      if (body.role === 'manager') navigation.replace('ManagerApp');
      else if (body.role === 'owner') navigation.replace('OwnerApp');
      else navigation.replace('WorkerApp');
    } catch {
      Alert.alert(
        'Connection error',
        'Could not reach the server. Check your network and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Wordmark ─────────────────────────────────────────── */}
          <View style={styles.brand}>
            {/* Logo: square with inside cross-hair mark, suggests precision on site */}
            <View style={styles.logoMark}>
              {/* Horizontal bar */}
              <View style={styles.crossH} />
              {/* Vertical bar */}
              <View style={styles.crossV} />
              {/* Corner dot — surveying precision indicator */}
              <View style={styles.cornerDot} />
            </View>
            <View style={styles.brandText}>
              <Typography variant="title1" color={colors.textPrimary}>
                Trace
              </Typography>
              <Typography variant="subhead" color={colors.textTertiary}>
                Construction Field Reporting
              </Typography>
            </View>
          </View>

          {/* Form ─────────────────────────────────────────────── */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Typography
                variant="overline"
                color={colors.textTertiary}
                style={styles.fieldLabel}
              >
                Email
              </Typography>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@organisation.rw"
                placeholderTextColor={colors.textQuaternary}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Typography
                variant="overline"
                color={colors.textTertiary}
                style={styles.fieldLabel}
              >
                Password
              </Typography>
              <View style={styles.inputWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textQuaternary}
                  secureTextEntry={!showPassword}
                  style={[styles.input, styles.inputWithIcon]}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={19}
                    color={colors.textTertiary}
                  />
                </Pressable>
              </View>
            </View>

            <Button
              label="Sign In"
              onPress={handleSignIn}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={!email}
              style={styles.signInBtn}
            />
          </View>

          {/* Demo accounts ────────────────────────────────────── */}
          <View style={styles.demoSection}>
            <View style={styles.demoHeader}>
              <View style={styles.dividerLine} />
              <Typography
                variant="overline"
                color={colors.textQuaternary}
                style={styles.demoLabel}
              >
                Try
              </Typography>
              <View style={styles.dividerLine} />
            </View>

            {DEMO_ACCOUNTS.map((account) => (
              <TouchableOpacity
                key={account.role}
                onPress={() => fillDemo(account)}
                activeOpacity={0.78}
                style={styles.demoTile}
              >
                <View style={styles.demoLeft}>
                  <View
                    style={[
                      styles.roleIndicator,
                      {
                        backgroundColor:
                          account.role === 'manager'
                            ? colors.accentLight
                            : account.role === 'owner'
                              ? colors.warningBg
                              : colors.successBg,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.roleDot,
                        {
                          backgroundColor:
                            account.role === 'manager'
                              ? colors.accent
                              : account.role === 'owner'
                                ? colors.warningText
                                : colors.successText,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.demoTextGroup}>
                    <Typography
                      variant="subheadMedium"
                      color={colors.textPrimary}
                    >
                      {account.label}
                    </Typography>
                    <Typography variant="footnote" color={colors.textTertiary}>
                      {account.detail}
                    </Typography>
                  </View>
                </View>
                <Typography variant="overline" color={colors.accent}>
                  Use
                </Typography>
              </TouchableOpacity>
            ))}
          </View>

          {/* Create account link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.7}
            style={styles.signupLink}
          >
            <Typography
              variant="footnote"
              color={colors.textSecondary}
              align="center"
            >
              New to Trace?{' '}
              <Typography variant="footnoteSemiBold" color={colors.accent}>
                Create an account
              </Typography>
            </Typography>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgPrimary, // crisp white — login is a clean slate
  },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[10],
    paddingBottom: spacing[8],
  },

  // ── Brand ───────────────────────────────────────────────────
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[10],
  },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Cross-hair precision mark inside the logo
  crossH: {
    position: 'absolute',
    width: 20,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1,
  },
  crossV: {
    position: 'absolute',
    width: 1.5,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1,
  },
  cornerDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.textInverse,
    top: 10,
    right: 10,
  },
  brandText: {
    gap: 2,
  },

  // ── Form ────────────────────────────────────────────────────
  form: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.xl,
    padding: spacing[5],
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  field: {
    gap: spacing[1] + 2,
  },
  fieldLabel: {
    letterSpacing: 0.8,
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputWithIcon: {
    paddingRight: spacing[10], // make room for the eye icon
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing[4],
    height: '100%',
    justifyContent: 'center',
  },
  signInBtn: {
    marginTop: spacing[2],
  },

  // ── Demo accounts ────────────────────────────────────────────
  demoSection: {
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  dividerLine: {
    flex: 1,
    height: borderWidths.hairline,
    backgroundColor: colors.separator,
  },
  demoLabel: {
    flexShrink: 0,
    letterSpacing: 1,
  },
  demoTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3] + 2,
  },
  demoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  roleIndicator: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  demoTextGroup: {
    gap: 2,
    flex: 1,
  },
  signupLink: {
    paddingVertical: spacing[2],
  },
});
