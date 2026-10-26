import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { SitePickerBanner } from '../../components/layout/SitePickerBanner';
import { StageSelector } from '../../components/report/StageSelector';
import { useReports } from '../../hooks/useReports';
import { getCurrentUserId, getCurrentUserName } from '../../services/config';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import type { ConstructionStage, GeoLocation, WorkerStackParamList } from '../../types';

type Props = NativeStackScreenProps<WorkerStackParamList, 'SubmitReport'>;

export function SubmitReportScreen({ navigation }: Props) {
  const { submit, activeSite } = useReports();

  const [selectedStage, setSelectedStage] = useState<ConstructionStage | null>(null);
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Use the globally selected site (set via SitePickerBanner on the home screen)
  const site = activeSite ?? undefined;

  // Use authenticated user from config
  const currentUserId   = getCurrentUserId();
  const currentUserName = getCurrentUserName();

  // GPS acquisition skipped — real device GPS is a future enhancement
  useEffect(() => {
    setGeoLoading(false);
  }, []);

  // Validation — mirrors exactly what the backend requires
  const validationError: string | null = (() => {
    if (!getCurrentUserId()) return 'Not authenticated — please sign in again.';
    if (!site?.id) return 'No site available. Contact your manager to be assigned to a site.';
    if (!selectedStage) return 'Please select a construction stage.';
    if (!photoUri) return 'Please add a photo of the site.';
    if (!notes.trim()) return 'Please add notes before submitting.';
    return null;
  })();

  const canSubmit = validationError === null;

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
    if (validationError) {
      Alert.alert('Cannot submit', validationError);
      return;
    }
    if (!selectedStage || !site) return;

    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Navigate back immediately — optimistic update keeps the report visible
    navigation.goBack();

    try {
      await submit({
        siteId: site.id,
        siteName: site.name,
        submittedById: currentUserId,
        submittedByName: currentUserName,
        reportedStage: selectedStage,
        notes: notes.trim(),
        photoUri,
        isOfflineSubmission: false,
        geoLocation: geoLocation ?? undefined,
      });
    } catch (e: any) {
      const msg = e?.message ?? 'Could not submit report. Please try again.';
      console.error('[SubmitReport] error:', msg);
      Alert.alert('Submission failed', msg);
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
          {/* Site selector — tap to switch site */}
          <SitePickerBanner style={styles.siteCard} />

          {/* Geo status */}
          {geoLoading ? (
            <View style={styles.geoBanner}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Typography variant="footnote" color={colors.infoText}>
                Acquiring GPS location…
              </Typography>
            </View>
          ) : geoLocation ? (
            <View style={[styles.geoBanner, geoLocation.isOnSite ? styles.geoBannerOnSite : styles.geoBannerOffSite]}>
              <Ionicons
                name={geoLocation.isOnSite ? 'location' : 'location-outline'}
                size={14}
                color={geoLocation.isOnSite ? colors.successText : colors.warningText}
              />
              <Typography
                variant="footnote"
                color={geoLocation.isOnSite ? colors.successText : colors.warningText}
              >
                {geoLocation.isOnSite
                  ? `Location confirmed — ${geoLocation.distanceFromSite}m from site`
                  : `Warning: ${geoLocation.distanceFromSite}m from registered site`}
              </Typography>
              <Typography variant="mono" color={colors.textTertiary} style={styles.coordsText}>
                {geoLocation.lat.toFixed(4)}, {geoLocation.lng.toFixed(4)}
              </Typography>
            </View>
          ) : null}

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
              <Typography variant="footnote" color={colors.dangerText}>
                Required
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
              <TouchableOpacity
                onPress={takePhoto}
                style={[styles.photoBtn, styles.photoBtnPrimary]}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={20} color={colors.accent} />
                <Typography variant="subheadMedium" color={colors.accent}>
                  Camera
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickPhoto}
                style={[styles.photoBtn, styles.photoBtnSecondary]}
                activeOpacity={0.8}
              >
                <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
                <Typography variant="subheadMedium" color={colors.textSecondary}>
                  Library
                </Typography>
              </TouchableOpacity>
            </View>
          )}

          {/* Notes */}
          <SectionHeader
            title="Notes"
            action={
              <Typography variant="footnote" color={colors.dangerText}>
                Required
              </Typography>
            }
            style={styles.sectionHeader}
          />
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
          {validationError && (
            <Typography
              variant="footnote"
              color={colors.dangerText}
              align="center"
              style={styles.validationMsg}
            >
              {validationError}
            </Typography>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
    paddingVertical: spacing[4],
  },
  photoBtnPrimary: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent + '40',
  },
  photoBtnSecondary: {
    backgroundColor: colors.surface,
    borderColor: colors.separator,
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
  geoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.infoBg,
    borderRadius: radii.md,
    marginBottom: spacing[1],
    flexWrap: 'wrap',
  },
  geoBannerOnSite: {
    backgroundColor: colors.successBg,
  },
  geoBannerOffSite: {
    backgroundColor: colors.warningBg,
  },
  coordsText: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  footer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
    backgroundColor: colors.surface,
    borderTopWidth: borderWidths.thin,
    borderTopColor: colors.separator,
    gap: spacing[2],
  },
  validationMsg: {
    paddingHorizontal: spacing[2],
  },
});
