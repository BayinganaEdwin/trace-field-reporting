import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../components/layout/Screen';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Typography } from '../../components/ui/Typography';
import { Divider } from '../../components/ui/Divider';
import { useReports } from '../../hooks/useReports';
import { getCurrentUserId, getCurrentUserName, setCurrentUserName, USE_REAL_API } from '../../services/config';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import type { RootStackParamList, UserRole } from '../../types';

interface ProfileScreenProps {
  role: UserRole;
}

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen({ role }: ProfileScreenProps) {
  const navigation = useNavigation<RootNav>();
  const { reports, sites } = useReports();

  const userId   = getCurrentUserId();
  const userName = getCurrentUserName();
  const site     = sites[0] ?? null;
  const userReports = reports.filter((r) => r.submittedById === userId);
  const approved = userReports.filter((r) => r.status === 'approved').length;
  const flagged  = userReports.filter((r) => r.status === 'flagged').length;

  // ── Editable profile state ────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userName);
  const [phone, setPhone] = useState('');
  const [org, setOrg] = useState('Kigali Urban Dev. Ltd.');
  // Saved copies (to revert on cancel)
  const [savedName, setSavedName] = useState(userName);
  const [savedPhone, setSavedPhone] = useState('');
  const [savedOrg, setSavedOrg] = useState('Kigali Urban Dev. Ltd.');

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    setName(savedName);
    setPhone(savedPhone);
    setOrg(savedOrg);
    setEditing(false);
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      if (USE_REAL_API) {
        await api.patch('/users/me', {
          name: name.trim(),
          phone: phone.trim() || undefined,
        });
      }
      setCurrentUserName(name.trim());
      setSavedName(name.trim());
      setSavedPhone(phone.trim());
      setSavedOrg(org.trim());
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Could not save profile. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Return to the login screen?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => navigation.replace('Login'),
      },
    ]);
  };

  return (
    <Screen>
      {/* User identity card */}
      <Card style={styles.identityCard}>
        <View style={styles.identityRow}>
          <Avatar name={savedName} size={56} />
          <View style={styles.identityText}>
            <Typography variant="title3" color={colors.textPrimary}>
              {savedName}
            </Typography>
            <Badge
              label={
                role === 'worker'  ? 'Site Worker' :
                role === 'manager' ? 'Project Manager' :
                                     'Property Owner'
              }
              variant={
                role === 'worker'  ? 'info' :
                role === 'manager' ? 'success' :
                                     'neutral'
              }
              style={styles.roleBadge}
            />
          </View>
          {/* Edit / Save / Cancel toggle */}
          {!editing ? (
            <TouchableOpacity
              onPress={handleEdit}
              style={styles.editBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-outline" size={15} color={colors.accent} />
              <Typography variant="footnoteSemiBold" color={colors.accent}>
                Edit
              </Typography>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.cancelBtn}
              activeOpacity={0.8}
            >
              <Typography variant="footnoteSemiBold" color={colors.textSecondary}>
                Cancel
              </Typography>
            </TouchableOpacity>
          )}
        </View>

        <Divider />

        {/* Editable fields */}
        <View style={styles.fieldsContainer}>
          <EditableField
            label="Full Name"
            value={name}
            editing={editing}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <EditableField
            label="Phone"
            value={phone}
            editing={editing}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <EditableField
            label="Email"
            value={`${role}@trace.rw`}
            editing={false}   // email not editable (locked to account)
            onChangeText={() => {}}
          />
          {site && (
            <EditableField
              label="Site"
              value={site.name}
              editing={false}
              onChangeText={() => {}}
            />
          )}
          <EditableField
            label="Organisation"
            value={org}
            editing={editing}
            onChangeText={setOrg}
            autoCapitalize="words"
            isLast
          />
        </View>

        {/* Save button inside card */}
        {editing && (
          <View style={styles.saveRow}>
            <Button
              label={saving ? 'Saving…' : 'Save Changes'}
              onPress={handleSave}
              variant="primary"
              size="md"
              fullWidth
            />
          </View>
        )}
      </Card>

      {/* Activity stats (workers only) */}
      {role === 'worker' && (
        <>
          <Typography
            variant="footnoteSemiBold"
            color={colors.textSecondary}
            style={styles.sectionLabel}
          >
            ACTIVITY
          </Typography>
          <View style={styles.statsRow}>
            <StatCard label="Submitted" value={String(userReports.length)} />
            <StatCard label="Approved" value={String(approved)} accent />
            <StatCard label="Flagged" value={String(flagged)} warn={flagged > 0} />
          </View>
        </>
      )}

      {/* Preferences */}
      <Typography
        variant="footnoteSemiBold"
        color={colors.textSecondary}
        style={styles.sectionLabel}
      >
        PREFERENCES
      </Typography>
      <Card padded={false} style={styles.settingsCard}>
        <SettingsRow label="Notifications" value="On" />
        <Divider inset={spacing[4]} />
        <SettingsRow label="Offline Mode" value="Auto" />
        <Divider inset={spacing[4]} />
        <SettingsRow label="AI Verification" value="Server" />
      </Card>

      {/* Sign out */}
      <TouchableOpacity
        onPress={handleSignOut}
        style={styles.signOutBtn}
        activeOpacity={0.8}
      >
        <Typography variant="subheadMedium" color={colors.dangerText} align="center">
          Sign Out
        </Typography>
      </TouchableOpacity>
    </Screen>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface EditableFieldProps {
  label: string;
  value: string;
  editing: boolean;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  isLast?: boolean;
}

function EditableField({
  label,
  value,
  editing,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  isLast,
}: EditableFieldProps) {
  return (
    <View style={[styles.fieldRow, !isLast && styles.fieldRowDivider]}>
      <Typography variant="footnote" color={colors.textSecondary} style={styles.fieldLabel}>
        {label}
      </Typography>
      {editing ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={styles.fieldInput}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholderTextColor={colors.textQuaternary}
          returnKeyType="done"
        />
      ) : (
        <Typography variant="subheadMedium" color={colors.textPrimary} style={styles.fieldValue}>
          {value}
        </Typography>
      )}
    </View>
  );
}

function StatCard({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <Card style={styles.statCard}>
      <Typography
        variant="title2"
        color={
          accent ? colors.accent : warn ? colors.warningText : colors.textPrimary
        }
      >
        {value}
      </Typography>
      <Typography variant="footnote" color={colors.textSecondary}>
        {label}
      </Typography>
    </Card>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingsRow}>
      <Typography variant="subhead" color={colors.textPrimary}>
        {label}
      </Typography>
      <Typography variant="subhead" color={colors.textSecondary}>
        {value}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  identityCard: {
    marginBottom: spacing[5],
    paddingBottom: 0,
    overflow: 'hidden',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  identityText: {
    flex: 1,
    gap: spacing[2],
  },
  roleBadge: {
    alignSelf: 'flex-start',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.accentLight,
    borderRadius: radii.full,
  },
  cancelBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },

  // ── Fields ───────────────────────────────────────────────────
  fieldsContainer: {
    gap: 0,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3] + 2,
    gap: spacing[4],
  },
  fieldRowDivider: {
    borderBottomWidth: borderWidths.hairline,
    borderBottomColor: colors.separator,
  },
  fieldLabel: {
    width: 100,
    flexShrink: 0,
  },
  fieldValue: {
    flex: 1,
    textAlign: 'right',
  },
  fieldInput: {
    flex: 1,
    textAlign: 'right',
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.accentLight,
    borderRadius: radii.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  saveRow: {
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    borderTopWidth: borderWidths.hairline,
    borderTopColor: colors.separator,
    marginTop: spacing[2],
  },

  // ── Activity ─────────────────────────────────────────────────
  sectionLabel: {
    letterSpacing: 0.6,
    marginBottom: spacing[2],
    marginTop: spacing[1],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  statCard: {
    flex: 1,
    gap: 3,
  },

  // ── Settings ─────────────────────────────────────────────────
  settingsCard: {
    marginBottom: spacing[4],
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },

  // ── Sign out ─────────────────────────────────────────────────
  signOutBtn: {
    marginTop: spacing[2],
    paddingVertical: spacing[4],
    backgroundColor: colors.dangerBg,
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
    borderColor: colors.dangerBorder,
  },
});
