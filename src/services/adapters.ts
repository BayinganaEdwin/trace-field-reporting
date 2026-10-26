/**
 * adapters.ts — converts backend snake_case responses to frontend camelCase types.
 *
 * The backend uses snake_case column names (site_id, submitted_by_id, …).
 * The frontend domain types in src/types/index.ts use camelCase.
 * All mapping lives here so no other file has to know about backend field names.
 */

import { API_BASE_URL } from './config';
import type {
  AIResult,
  ConstructionStage,
  GeoLocation,
  Report,
  ReportStatus,
  Site,
} from '../types';

// ── Raw backend shapes (loosely typed — we own the backend) ──────────────────

interface RawReport {
  id: string;
  site_id: string;
  site_name: string;
  submitted_by_id: string;
  submitted_by_name?: string;   // not yet in schema; falls back to id
  reported_stage: ConstructionStage;
  status: ReportStatus;
  notes: string | null;
  photo_urls: string[];          // rowToReport already parses this from JSON
  latitude: number | null;
  longitude: number | null;
  ai_detected_stage: ConstructionStage | null;
  ai_confidence: number | null;  // 0–1
  ai_all_scores: Record<string, number> | null;
  ai_model_version: string | null;
  ai_inference_ms: number | null;
  ai_observations: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by_id: string | null;
  updated_at: string | null;
  rejection_reason: string | null;
}

interface RawSite {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  target_stage: ConstructionStage | null;
  created_at: string;
  updated_at: string | null;
  // enrichSite additions
  totalReports: number;
  approvedCount: number;
  flaggedCount: number;
  pendingCount: number;
  rei: number;               // 0–100
  currentStage: ConstructionStage | null;
}

// ── Report adapter ────────────────────────────────────────────────────────────

export function adaptReport(row: RawReport): Report {
  // Photo: use the first URL from the array, resolved to an absolute URL
  const photoUrls = Array.isArray(row.photo_urls) ? row.photo_urls : [];
  const photoUri = photoUrls.length > 0
    ? `${API_BASE_URL}${photoUrls[0]}`
    : null;

  // AI result — present after async inference completes.
  // ai_detected_stage is null for non-construction images (model says "not construction")
  // but we still have ai_confidence + ai_observations in that case.
  let aiResult: AIResult | null = null;
  if (row.ai_confidence != null || row.ai_observations) {
    aiResult = {
      detectedStage: row.ai_detected_stage ?? null,   // null = non-construction
      reportedStage: row.reported_stage,
      confidenceScore: row.ai_confidence != null
        ? Math.round(row.ai_confidence * 100)          // 0–1 → 0–100
        : 0,
      isMatch: row.ai_detected_stage != null &&
               row.ai_detected_stage === row.reported_stage,
      inferenceMode: 'server',
      modelVersion: row.ai_model_version ?? 'mobilenetv2-v1',
      processedAt: row.updated_at ?? row.submitted_at,
      textFeedback: row.ai_observations ?? undefined,
    };
  }

  // Geo location (basic — no distanceFromSite without site coords on client)
  const geoLocation: GeoLocation | undefined =
    row.latitude != null && row.longitude != null
      ? {
          lat: row.latitude,
          lng: row.longitude,
          distanceFromSite: 0,
          isOnSite: true,
          capturedAt: row.submitted_at,
        }
      : undefined;

  return {
    id: row.id,
    siteId: row.site_id,
    siteName: row.site_name,
    submittedById: row.submitted_by_id,
    // submitted_by_name isn't stored yet — fall back gracefully
    submittedByName: row.submitted_by_name ?? row.submitted_by_id,
    reportedStage: row.reported_stage,
    notes: row.notes ?? '',
    photoUri,
    status: row.status,
    aiResult,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at ?? null,
    reviewedById: row.reviewed_by_id ?? null,
    isOfflineSubmission: false,
    geoLocation,
  };
}

// ── Site adapter ──────────────────────────────────────────────────────────────

export function adaptSite(row: RawSite): Site {
  return {
    id: row.id,
    name: row.name,
    location: row.address ?? `${row.latitude ?? '—'}, ${row.longitude ?? '—'}`,
    currentStage: row.currentStage ?? 'formwork_erected',
    progressPercent: row.rei ?? 0,
    workerCount: 0,            // not yet returned by backend — future enhancement
    lastReportAt: row.updated_at ?? null,
  };
}
