import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { StageSelector } from '../../components/report/StageSelector';
import { useReports } from '../../hooks/useReports';
import { MOCK_WORKER, MOCK_SITES } from '../../data/mockData';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import type { ConstructionStage, WorkerStackParamList } from '../../types';

type Props = NativeStackScreenProps<WorkerStackParamList, 'SubmitReport'>;

export function SubmitReportScreen({ navigation }: Props) {
  const { submit } = useReports();

  const [selectedStage, setSelectedStage] = useState<ConstructionStage | null>(null);
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const site = MOCK_SITES.find((s) => s.id === MOCK_WORKER.siteId) ?? MOCK_SITES[0];

  const canSubmit = selectedStage !== null;

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Photo library access is needed to attach a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to capture site photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStage) return;
    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Navigate back immediately — optimistic update keeps the report visible
    navigation.goBack();

    try {
      await submit({
        siteId: site.id,
        siteName: site.name,
        submittedById: MOCK_WORKER.id,
        submittedByName: MOCK_WORKER.name,
        reportedStage: selectedStage,
        notes: notes.trim(),
        photoUri,
        isOfflineSubmission: false,
      });
    } catch (e) {
      Alert.alert('Submission failed', 'Could not submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Site context */}
          <Card style={styles.siteCard}>
            <Typography variant="overline" color={colors.textTertiary}>
              Reporting for
            </Typography>
            <Typography variant="headline" color={colors.textPrimary}>
              {site.name}
            </Typography>
            <Typography variant="footnote" color={colors.textSecondary}>
              {site.location}
            </Typography>
          </Card>

          {/* Stage */}
          <SectionHeader title="Construction Stage" style={styles.sectionHeader} />
          <StageSelector
            selected={selectedStage}
            onSelect={setSelectedStage}
            style={styles.stageSelector}
          />

          {/* Photo */}
          <SectionHeader
            title="Site Photo"
            action={
              <Typography variant="footnote" color={colors.textSecondary}>
                Used by AI model
              </Typography>
            }
            style={styles.sectionHeader}
          />

          {photoUri ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
              <TouchableOpacity
                onPress={() => setPhotoUri(null)}
                style={styles.removePhoto}
                activeOpacity={0.8}
              >
                <Typography variant="footnoteSemiBold" color={colors.dangerText}>
                  Remove
                </Typography>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoRow}>
              <Button
                label="Camera"
                onPress={takePhoto}
                variant="secondary"
                size="md"
                style={styles.photoBtn}
              />
              <Button
                label="Library"
                onPress={pickPhoto}
                variant="secondary"
                size="md"
                style={styles.photoBtn}
              />
            </View>
          )}

          {/* Notes */}
          <SectionHeader title="Notes" style={styles.sectionHeader} />
          <View style={styles.notesWrapper}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Describe what was completed, any issues or observations…"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              style={styles.notesInput}
              textAlignVertical="top"
            />
          </View>

          {/* AI notice */}
          <View style={styles.aiNotice}>
            <Typography variant="footnote" color={colors.textSecondary}>
              Your photo will be automatically checked to confirm the construction stage
              you selected. This works even without an internet connection.
            </Typography>
          </View>
        </ScrollView>

        {/* Sticky submit */}
        <View style={styles.footer}>
          <Button
            label={submitting ? 'Submitting…' : 'Submit Report'}
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canSubmit}
            loading={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
  },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  siteCard: {
    marginBottom: spacing[5],
    gap: 3,
  },
  sectionHeader: {
    marginTop: spacing[5],
    marginBottom: spacing[2],
  },
  stageSelector: {
    marginBottom: spacing[2],
  },
  photoRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  photoBtn: {
    flex: 1,
  },
  photoPreview: {
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
  },
  photo: {
    width: '100%',
    height: 200,
  },
  removePhoto: {
    paddingVertical: spacing[3],
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
  },
  notesWrapper: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  notesInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 96,
  },
  aiNotice: {
    marginTop: spacing[5],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
  },
  footer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
    backgroundColor: colors.surface,
    borderTopWidth: borderWidths.thin,
    borderTopColor: colors.separator,
  },
});
