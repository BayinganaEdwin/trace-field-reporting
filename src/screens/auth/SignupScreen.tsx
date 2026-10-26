/**
 * SignupScreen.tsx
 *
 * Account creation screen with:
 * - Role selection (Worker / Manager) as big tap-to-select tiles
 * - Full name, email, password fields
 * - Password strength indicator
 * - Eye toggle on password
 * - "Already have an account? Sign in" link back to Login
 *
 * In prototype: "Create Account" simulates a short delay then navigates
 * to the appropriate app (worker or manager).
 */

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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import { setCurrentUserId, setCurrentUserRole, setCurrentUserName, API_BASE_URL } from '../../services/config';
import { useReports } from '../../hooks/useReports';
import type { RootStackParamList, UserRole } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

// ── Password strength ─────────────────────────────────────────────────────────
function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  if (pw.length === 0) return { score: 0, label: '', color: colors.separator };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 10) score++;
  const map = [
    { label: 'Weak',   color: colors.dangerText },
    { label: 'Fair',   color: colors.warningText },
    { label: 'Good',   color: colors.successText },
    { label: 'Strong', color: colors.successText },
  ] as const;
  return { score: score as 0 | 1 | 2 | 3, ...map[score] };
}

// ── Role tile ─────────────────────────────────────────────────────────────────
interface RoleTileProps {
  role: UserRole;
  selected: boolean;
  onSelect: () => void;
}

function RoleTile({ role, selected, onSelect }: RoleTileProps) {
  const isWorker = role === 'worker';
  const tileColor = isWorker ? colors.successBg : colors.accentLight;
  const activeColor = isWorker ? colors.successText : colors.accent;
  const iconName = isWorker ? 'construct-outline' : 'briefcase-outline';

  return (
    <TouchableOpacity
      onPress={() => { onSelect(); Haptics.selectionAsync(); }}
      activeOpacity={0.82}
      style={[
        styles.roleTile,
        selected && { borderColor: activeColor, backgroundColor: tileColor },
      ]}
    >
      <View
        style={[
          styles.roleTileIcon,
          { backgroundColor: selected ? activeColor : colors.bgSecondary },
        ]}
      >
        <Ionicons
          name={iconName as any}
          size={20}
          color={selected ? colors.textInverse : colors.textTertiary}
        />
      </View>
      <View style={styles.roleTileText}>
        <Typography
          variant="subheadMedium"
          color={selected ? activeColor : colors.textPrimary}
        >
          {isWorker ? 'Site Worker' : 'Project Manager'}
        </Typography>
        <Typography variant="footnote" color={colors.textTertiary}>
          {isWorker
            ? 'Submit field reports & photos'
            : 'Review, approve & monitor sites'}
        </Typography>
      </View>
      {selected && (
        <View style={[styles.checkCircle, { backgroundColor: activeColor }]}>
          <Ionicons name="checkmark" size={12} color={colors.textInverse} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export function SignupScreen({ navigation }: Props) {
  const { refresh } = useReports();
  const [role, setRole] = useState<UserRole>('worker');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(password);

  const canSubmit =
    role !== null && fullName.trim().length >= 2 && email.includes('@') && password.length >= 6;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.toLowerCase().trim(),
          role,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        Alert.alert('Registration failed', body.error ?? 'Please try again');
        return;
      }
      setCurrentUserId(body.id);
      setCurrentUserRole(role as 'worker' | 'manager');
      setCurrentUserName(body.name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refresh();
      if (role === 'manager') {
        navigation.replace('ManagerApp');
      } else {
        navigation.replace('WorkerApp');
      }
    } catch {
      Alert.alert('Connection error', 'Could not reach the server. Check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.logoMark}>
              <View style={styles.crossH} />
              <View style={styles.crossV} />
              <View style={styles.cornerDot} />
            </View>
            <View>
              <Typography variant="title2" color={colors.textPrimary}>
                Create Account
              </Typography>
              <Typography variant="footnote" color={colors.textTertiary}>
                Join Trace · Construction Field Reporting
              </Typography>
            </View>
          </View>

          {/* Role picker */}
          <View style={styles.section}>
            <Typography variant="overline" color={colors.textTertiary} style={styles.sectionLabel}>
              I am a
            </Typography>
            <View style={styles.roleRow}>
              <RoleTile role="worker" selected={role === 'worker'} onSelect={() => setRole('worker')} />
              <RoleTile role="manager" selected={role === 'manager'} onSelect={() => setRole('manager')} />
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full name */}
            <View style={styles.field}>
              <Typography variant="overline" color={colors.textTertiary} style={styles.fieldLabel}>
                Full Name
              </Typography>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Jean Claude Nzeyimana"
                placeholderTextColor={colors.textQuaternary}
                autoCapitalize="words"
                style={styles.input}
              />
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Typography variant="overline" color={colors.textTertiary} style={styles.fieldLabel}>
                Work Email
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

            {/* Password */}
            <View style={styles.field}>
              <Typography variant="overline" color={colors.textTertiary} style={styles.fieldLabel}>
                Password
              </Typography>
              <View style={styles.inputWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimum 6 characters"
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

              {/* Strength bar */}
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthTrack}>
                    {[0, 1, 2].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.strengthSegment,
                          i < strength.score + 1
                            ? { backgroundColor: strength.color }
                            : { backgroundColor: colors.separator },
                        ]}
                      />
                    ))}
                  </View>
                  <Typography variant="overline" color={strength.color} style={styles.strengthLabel}>
                    {strength.label}
                  </Typography>
                </View>
              )}
            </View>

            <Button
              label="Create Account"
              onPress={handleCreate}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={!canSubmit}
              style={styles.submitBtn}
            />
          </View>

          {/* Sign in link */}
          <TouchableOpacity
            onPress={() => navigation.replace('Login')}
            style={styles.loginLink}
            activeOpacity={0.7}
          >
            <Typography variant="footnote" color={colors.textSecondary} align="center">
              Already have an account?{' '}
              <Typography variant="footnoteSemiBold" color={colors.accent}>
                Sign in
              </Typography>
            </Typography>
          </TouchableOpacity>

          <Typography
            variant="overline"
            color={colors.textQuaternary}
            align="center"
            style={styles.notice}
          >
            Prototype · ALU Capstone · Mock data only
          </Typography>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[10],
  },

  // ── Header ───────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[8],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  crossH: {
    position: 'absolute',
    width: 16,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1,
  },
  crossV: {
    position: 'absolute',
    width: 1.5,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1,
  },
  cornerDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textInverse,
    top: 8,
    right: 8,
  },

  // ── Role picker ──────────────────────────────────────────────
  section: {
    marginBottom: spacing[6],
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: spacing[3],
  },
  roleRow: {
    gap: spacing[3],
  },
  roleTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: borderWidths.base,
    borderColor: 'transparent',
  },
  roleTileIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roleTileText: {
    flex: 1,
    gap: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // ── Form ─────────────────────────────────────────────────────
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
    paddingRight: spacing[10],
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing[4],
    height: '100%',
    justifyContent: 'center',
  },

  // ── Password strength ─────────────────────────────────────────
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  strengthTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing[1],
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    width: 40,
    textAlign: 'right',
  },

  submitBtn: {
    marginTop: spacing[2],
  },

  // ── Links ────────────────────────────────────────────────────
  loginLink: {
    marginBottom: spacing[4],
  },
  notice: {
    letterSpacing: 0.8,
  },
});
