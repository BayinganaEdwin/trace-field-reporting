import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Typography } from '../ui/Typography';
import { Divider } from '../ui/Divider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { AIResult, ReportStatus } from '../../types';

interface AIVerificationCardProps {
  status: ReportStatus;
  aiResult: AIResult | null;
  hasPhoto?: boolean;
}

/**
 * Replace raw snake_case stage keys in AI feedback text with human-readable labels.
 * e.g. "Model detected reinforcement_placed with..." → "Model detected Reinforcement Placed with..."
 */
function humaniseFeedback(text: string): string {
  return Object.entries(STAGE_LABELS).reduce(
    (t, [key, label]) => t.replace(new RegExp(key, 'gi'), label),
    text,
  );
}

export function AIVerificationCard({
  status,
  aiResult,
  hasPhoto = true,
}: AIVerificationCardProps) {
  // Still uploading — show upload spinner
  if (status === 'uploading') {
    return (
      <Card style={styles.card}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.accent} />
          <View style={styles.loadingText}>
            <Typography variant="subheadMedium" color={colors.textPrimary}>
              Photo Check
            </Typography>
            <Typography variant="footnote" color={colors.textSecondary}>
              Uploading photo…
            </Typography>
          </View>
        </View>
      </Card>
    );
  }

  // Pending + no photo = AI never runs; don't show a spinner
  if (!aiResult && status === 'pending' && !hasPhoto) {
    return (
      <Card style={styles.card}>
        <View style={styles.loadingRow}>
          <Ionicons
            name="image-outline"
            size={18}
            color={colors.textQuaternary}
          />
          <View style={styles.loadingText}>
            <Typography variant="subheadMedium" color={colors.textPrimary}>
              Photo Check
            </Typography>
            <Typography variant="footnote" color={colors.textSecondary}>
              No photo attached — a manager will review this manually
            </Typography>
          </View>
        </View>
      </Card>
    );
  }

  // Pending + has photo = AI is still running → spinner
  if (!aiResult || status === 'ai_processing') {
    return (
      <Card style={styles.card}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.accent} />
          <View style={styles.loadingText}>
            <Typography variant="subheadMedium" color={colors.textPrimary}>
              Photo Check
            </Typography>
            <Typography variant="footnote" color={colors.textSecondary}>
              Analysing your photo…
            </Typography>
          </View>
        </View>
      </Card>
    );
  }

  // Non-construction image — model said this isn't a construction site
  if (aiResult.detectedStage === null) {
    return (
      <Card style={styles.card} padded={false}>
        <View style={styles.header}>
          <View>
            <Typography variant="subheadMedium" color={colors.textPrimary}>
              Photo Check
            </Typography>
            <Typography variant="footnote" color={colors.textSecondary}>
              Automated photo analysis
            </Typography>
          </View>
          <Ionicons
            name="camera-outline"
            size={18}
            color={colors.textQuaternary}
          />
        </View>
        <Divider />
        <View style={[styles.verdict, styles.verdictMismatch]}>
          <Ionicons
            name="alert-circle"
            size={16}
            color={colors.warningText}
            style={styles.verdictIcon}
          />
          <Typography
            variant="subheadMedium"
            color={colors.warningText}
            style={styles.verdictText}
          >
            This photo doesn't look like a construction site. A manager should
            review it
          </Typography>
        </View>
        {aiResult.textFeedback ? (
          <>
            <Divider />
            <View style={styles.feedbackSection}>
              <Typography
                variant="overline"
                color={colors.textTertiary}
                style={styles.feedbackLabel}
              >
                WHAT THE AI MODEL FOUND
              </Typography>
              <Typography
                variant="footnote"
                color={colors.textSecondary}
                style={styles.feedbackText}
              >
                {humaniseFeedback(aiResult.textFeedback)}
              </Typography>
            </View>
          </>
        ) : null}
      </Card>
    );
  }

  const isMatch = aiResult.isMatch;
  const confidence = aiResult.confidenceScore;

  const confidenceColor =
    confidence >= 90
      ? colors.successText
      : confidence >= 75
        ? colors.warningText
        : colors.dangerText;

  const fillColor =
    confidence >= 90 ? '#10B981' : confidence >= 75 ? '#F59E0B' : '#EF4444';

  // Plain-English certainty label
  const certaintyLabel =
    confidence >= 90
      ? 'Very confident'
      : confidence >= 75
        ? 'Fairly confident'
        : confidence >= 50
          ? 'Uncertain'
          : 'Low confidence';

  return (
    <Card style={styles.card} padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Typography variant="subheadMedium" color={colors.textPrimary}>
            Photo Check
          </Typography>
          <Typography variant="footnote" color={colors.textSecondary}>
            Automated photo analysis
          </Typography>
        </View>
        <Ionicons
          name="camera-outline"
          size={18}
          color={colors.textQuaternary}
        />
      </View>

      <Divider />

      {/* Confidence */}
      <View style={styles.section}>
        <View style={styles.confidenceRow}>
          <Typography variant="footnote" color={colors.textSecondary}>
            How certain the AI is
          </Typography>
          <View style={styles.confidenceBadge}>
            <Typography variant="footnoteSemiBold" color={confidenceColor}>
              {certaintyLabel} · {confidence}%
            </Typography>
          </View>
        </View>
        <ProgressBar
          value={confidence}
          fillColor={fillColor}
          style={styles.bar}
        />
      </View>

      <Divider />

      {/* Stage comparison */}
      <View style={styles.section}>
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonCell}>
            <Typography variant="overline" color={colors.textTertiary}>
              WORKER REPORTED
            </Typography>
            <Typography variant="subheadMedium" color={colors.textPrimary}>
              {STAGE_LABELS[aiResult.reportedStage]}
            </Typography>
          </View>

          <View style={styles.comparisonIcon}>
            {isMatch ? (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={colors.successText}
              />
            ) : (
              <Ionicons
                name="alert-circle"
                size={22}
                color={colors.warningText}
              />
            )}
          </View>

          <View style={styles.comparisonCell}>
            <Typography variant="overline" color={colors.textTertiary}>
              AI IDENTIFIED
            </Typography>
            <Typography
              variant="subheadMedium"
              color={isMatch ? colors.textPrimary : colors.warningText}
            >
              {aiResult.detectedStage
                ? STAGE_LABELS[aiResult.detectedStage]
                : 'Not a construction site'}
            </Typography>
          </View>
        </View>
      </View>

      {/* Verdict banner */}
      <View
        style={[
          styles.verdict,
          isMatch ? styles.verdictMatch : styles.verdictMismatch,
        ]}
      >
        <Ionicons
          name={isMatch ? 'checkmark-circle' : 'alert-circle'}
          size={16}
          color={isMatch ? colors.successText : colors.warningText}
          style={styles.verdictIcon}
        />
        <Typography
          variant="subheadMedium"
          color={isMatch ? colors.successText : colors.warningText}
          style={styles.verdictText}
        >
          {isMatch
            ? `Photo matches the reported stage`
            : `The photo shows a different stage than reported — a manager should review this`}
        </Typography>
      </View>

      {/* AI text feedback */}
      {aiResult.textFeedback ? (
        <>
          <Divider />
          <View style={styles.feedbackSection}>
            <Typography
              variant="overline"
              color={colors.textTertiary}
              style={styles.feedbackLabel}
            >
              WHAT THE AI MODELFOUND
            </Typography>
            <Typography
              variant="footnote"
              color={colors.textSecondary}
              style={styles.feedbackText}
            >
              {humaniseFeedback(aiResult.textFeedback)}
            </Typography>
          </View>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  section: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  confidenceBadge: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  bar: {},
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  comparisonCell: {
    flex: 1,
    gap: 2,
  },
  comparisonIcon: {
    width: 28,
    alignItems: 'center',
  },
  verdict: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3] + 2,
    gap: spacing[2],
  },
  verdictMatch: {
    backgroundColor: colors.successBg,
  },
  verdictMismatch: {
    backgroundColor: colors.warningBg,
  },
  verdictIcon: {
    marginTop: 1,
  },
  verdictText: {
    flex: 1,
    lineHeight: 20,
  },
  feedbackSection: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
    gap: spacing[2],
  },
  feedbackLabel: {
    letterSpacing: 0.8,
  },
  feedbackText: {
    lineHeight: 22,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  loadingText: {
    gap: 2,
  },
});
