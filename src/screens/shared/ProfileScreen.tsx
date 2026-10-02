import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/layout/Screen';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Typography } from '../../components/ui/Typography';
import { Divider } from '../../components/ui/Divider';
import { useReports } from '../../hooks/useReports';
import { MOCK_WORKER, MOCK_MANAGER, MOCK_SITES } from '../../data/mockData';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import type { RootStackParamList, UserRole } from '../../types';

interface ProfileScreenProps {
  role: UserRole;
}

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen({ role }: ProfileScreenProps) {
  const navigation = useNavigation<RootNav>();
  const { reports } = useReports();

  const user = role === 'worker' ? MOCK_WORKER : MOCK_MANAGER;
  const site = MOCK_SITES.find((s) => s.id === user.siteId);
  const userReports = reports.filter((r) => r.submittedById === user.id);
  const approved = userReports.filter((r) => r.status === 'approved').length;
  const flagged = userReports.filter((r) => r.status === 'flagged').length;

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
      {/* User identity */}
      <Card style={styles.identityCard}>
        <View style={styles.identityRow}>
          <Avatar name={user.name} size={56} />
          <View style={styles.identityText}>
            <Typography variant="title3" color={colors.textPrimary}>
              {user.name}
            </Typography>
            <Badge
              label={role === 'worker' ? 'Site Worker' : 'Project Manager'}
              variant={role === 'worker' ? 'info' : 'success'}
              style={styles.roleBadge}
            />
          </View>
        </View>

        <Divider />

        <View style={styles.metaRows}>
          <MetaRow label="Email" value={`${role}@trace.rw`} />
          {site && <MetaRow label="Site" value={site.name} />}
          <MetaRow label="Organisation" value="Kigali Urban Dev. Ltd." />
        </View>
      </Card>

      {/* Stats */}
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
            <StatCard
              label="Flagged"
              value={String(flagged)}
              warn={flagged > 0}
            />
          </View>
        </>
      )}

      {/* Settings rows */}
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

      {/* <Typography variant="footnoteSemiBold" color={colors.textSecondary} style={styles.sectionLabel}>
        ABOUT
      </Typography>
      <Card padded={false} style={styles.settingsCard}>
        <SettingsRow label="Version" value="1.0.0 (Prototype)" />
        <Divider inset={spacing[4]} />
        <SettingsRow label="AI Model" value="MobileNetV2 v1.0" />
        <Divider inset={spacing[4]} />
        <SettingsRow label="Project" value="ALU Capstone 2025" />
      </Card> */}

      {/* Sign out */}
      <TouchableOpacity
        onPress={handleSignOut}
        style={styles.signOutBtn}
        activeOpacity={0.8}
      >
        <Typography
          variant="subheadMedium"
          color={colors.dangerText}
          align="center"
        >
          Sign Out
        </Typography>
      </TouchableOpacity>
    </Screen>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Typography variant="footnote" color={colors.textSecondary}>
        {label}
      </Typography>
      <Typography variant="subheadMedium" color={colors.textPrimary}>
        {value}
      </Typography>
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
          accent
            ? colors.accent
            : warn
              ? colors.warningText
              : colors.textPrimary
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
  metaRows: {
    gap: spacing[3],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
  signOutBtn: {
    marginTop: spacing[2],
    paddingVertical: spacing[4],
    backgroundColor: colors.dangerBg,
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
    borderColor: colors.dangerBorder,
  },
});
