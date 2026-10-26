/**
 * mockService.ts
 *
 * Simulates a REST API with realistic delays and optimistic-update patterns.
 * All mutations return immediately with the updated object (optimistic) and
 * then resolve after a network simulation delay.
 *
 * When the real Node.js/Express backend is ready, swap each function body
 * for an actual fetch() call — the hook interfaces stay the same.
 */

import { MOCK_REPORTS, MOCK_SITES, SITE_COORDS } from './mockData';
import type { ConstructionStage, GeoLocation, InferenceMode, Report, ReportStatus, Site } from '../types';

// In-memory store — simulates server state for the session
let reports: Report[] = [...MOCK_REPORTS];
let sites: Site[]     = [...MOCK_SITES];

// ── Helpers ───────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

const generateId = () => `rpt-${String(Math.floor(Math.random() * 9000) + 1000)}`;

/** Stage-specific AI narrative feedback */
const AI_FEEDBACK: Record<ConstructionStage, { match: string; mismatch: string }> = {
  formwork_erected: {
    match: 'Wooden formwork panels and support shoring are clearly visible and correctly positioned. Panel alignment and bracing geometry match formwork erection standards. This is a high-confidence match for the declared stage.',
    mismatch: 'The image does not show assembled formwork panels or shoring structures. Visible elements appear inconsistent with the formwork erection stage — please verify the stage declaration and re-submit with an updated photo.',
  },
  reinforcement_placed: {
    match: 'Steel rebar grid and tie wires are present with consistent spacing. The reinforcement layout appears well-executed with no visible gaps at column intersections. Tie patterns confirm the reinforcement placement stage.',
    mismatch: 'Reinforcement elements such as rebar and tie wires are not the dominant feature in this photo. The image may show an earlier or later stage — please recheck the stage and submit a clearer photo of the rebar grid.',
  },
  concrete_poured: {
    match: 'Concrete surface texture, fresh pour characteristics, and vibration patterns are clearly visible. Formwork edges align with an active casting event. No structural anomalies detected in the visible area.',
    mismatch: 'The image shows exposed rebar or dry formwork inconsistent with an active concrete pour. The concrete poured stage typically presents wet or setting surface material. Please verify the stage and retake the photo.',
  },
  structure_complete: {
    match: 'Cured structural elements, clean slab surfaces, and removed formwork are evident. The section shows characteristics consistent with a completed and inspected structural phase.',
    mismatch: 'The image shows construction activity or wet material that suggests the structure is not yet complete. Evidence of ongoing work is visible — please confirm the stage and resubmit once the section has cured.',
  },
};

/** Simulate GPS capture near a site — adds ±80m jitter to site coords */
function simulateGeo(siteId: string): GeoLocation {
  const base = SITE_COORDS[siteId];
  if (!base) {
    return { lat: -1.9500, lng: 30.0588, distanceFromSite: 0, isOnSite: true, capturedAt: new Date().toISOString() };
  }
  // 1 degree lat ≈ 111 km → 80m ≈ 0.00072 degrees
  const jitter = () => (Math.random() - 0.5) * 0.00144;
  const lat = base.lat + jitter();
  const lng = base.lng + jitter();
  // Haversine approx (flat-earth ok for short distances)
  const dlat = (lat - base.lat) * 111000;
  const dlng = (lng - base.lng) * 111000 * Math.cos(base.lat * Math.PI / 180);
  const distance = Math.round(Math.sqrt(dlat * dlat + dlng * dlng));
  return {
    lat: parseFloat(lat.toFixed(6)),
    lng: parseFloat(lng.toFixed(6)),
    distanceFromSite: distance,
    isOnSite: distance <= 200,
    capturedAt: new Date().toISOString(),
  };
}

/** Deterministic mock AI result — confidence varies by stage match */
const simulateAI = (
  reportedStage: ConstructionStage,
  photoUri: string | null,
): { detectedStage: ConstructionStage; confidence: number; match: boolean; mode: InferenceMode; feedback: string } => {
  const hasPhoto = photoUri !== null;
  // Without a photo the model can't run — return low confidence
  if (!hasPhoto) {
    return { detectedStage: reportedStage, confidence: 0, match: true, mode: 'server', feedback: 'No photo was attached — AI stage verification was skipped. Attach a site photo for automatic verification.' };
  }
  // 85% chance of a correct detection (match), 15% chance of a stage mismatch
  const isMatch = Math.random() > 0.15;
  const stages: ConstructionStage[] = [
    'formwork_erected',
    'reinforcement_placed',
    'concrete_poured',
    'structure_complete',
  ];
  const detectedStage = isMatch
    ? reportedStage
    : stages.filter((s) => s !== reportedStage)[Math.floor(Math.random() * 3)];
  const confidence = isMatch
    ? Math.floor(Math.random() * 12 + 86)  // 86–97%
    : Math.floor(Math.random() * 20 + 70); // 70–89% (lower when mismatch)
  const feedback = isMatch
    ? AI_FEEDBACK[reportedStage].match
    : AI_FEEDBACK[reportedStage].mismatch;
  return { detectedStage, confidence, match: isMatch, mode: 'server', feedback };
};

// ── Queries ───────────────────────────────────────────────────────────────────

export async function fetchReports(): Promise<Report[]> {
  await delay(600);
  return [...reports].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export async function fetchReport(id: string): Promise<Report> {
  await delay(300);
  const report = reports.find((r) => r.id === id);
  if (!report) throw new Error(`Report ${id} not found`);
  return { ...report };
}

export async function fetchSites(): Promise<Site[]> {
  await delay(400);
  return [...sites];
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export interface SubmitReportPayload {
  siteId: string;
  siteName: string;
  submittedById: string;
  submittedByName: string;
  reportedStage: ConstructionStage;
  notes: string;
  photoUri: string | null;
  isOfflineSubmission: boolean;
  /** Captured from simulateGeo at submit time */
  geoLocation?: GeoLocation;
}

/**
 * submitReport — three-phase optimistic flow:
 *   Phase 1 (0ms)    → returns optimistic report with status='uploading'
 *   Phase 2 (1400ms) → status='pending' (upload done, AI queued)
 *   Phase 3 (3500ms) → status='verified' | 'flagged' (AI result arrives)
 *
 * The caller (hook) receives the optimistic object immediately and subscribes
 * to phase updates via onPhaseUpdate callback.
 */
export async function submitReport(
  payload: SubmitReportPayload,
  onPhaseUpdate: (report: Report) => void,
): Promise<Report> {
  const id = generateId();
  const now = new Date().toISOString();

  // Simulate geo capture at submit time
  const geoLocation = payload.geoLocation ?? simulateGeo(payload.siteId);

  const optimistic: Report = {
    id,
    ...payload,
    geoLocation,
    status: 'uploading',
    aiResult: null,
    submittedAt: now,
    reviewedAt: null,
    reviewedById: null,
  };

  // Immediately push into local store (optimistic)
  reports = [optimistic, ...reports];
  onPhaseUpdate({ ...optimistic });

  // Phase 2 — upload complete, waiting for AI
  await delay(1400);
  const pending: Report = { ...optimistic, status: 'pending' };
  reports = reports.map((r) => (r.id === id ? pending : r));
  onPhaseUpdate({ ...pending });

  // Phase 3 — AI inference result
  await delay(2100);
  const ai = simulateAI(payload.reportedStage, payload.photoUri);
  const finalStatus: ReportStatus = ai.match && ai.confidence >= 80 ? 'verified' : 'flagged';
  const final: Report = {
    ...pending,
    status: finalStatus,
    aiResult: {
      detectedStage: ai.detectedStage,
      reportedStage: payload.reportedStage,
      confidenceScore: ai.confidence,
      isMatch: ai.match,
      inferenceMode: ai.mode,
      modelVersion: 'mobilenetv2-v1.0',
      processedAt: new Date().toISOString(),
      textFeedback: ai.feedback,
    },
  };
  reports = reports.map((r) => (r.id === id ? final : r));
  onPhaseUpdate({ ...final });

  return { ...final };
}

export async function approveReport(reportId: string, reviewerId: string): Promise<Report> {
  await delay(700);
  const updated = reports.find((r) => r.id === reportId);
  if (!updated) throw new Error('Report not found');
  const result: Report = {
    ...updated,
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    reviewedById: reviewerId,
  };
  reports = reports.map((r) => (r.id === reportId ? result : r));
  return { ...result };
}

export async function flagReport(reportId: string, reviewerId: string): Promise<Report> {
  await delay(700);
  const updated = reports.find((r) => r.id === reportId);
  if (!updated) throw new Error('Report not found');
  const result: Report = {
    ...updated,
    status: 'flagged',
    reviewedAt: new Date().toISOString(),
    reviewedById: reviewerId,
  };
  reports = reports.map((r) => (r.id === reportId ? result : r));
  return { ...result };
}

export async function rejectReport(
  reportId: string,
  reviewerId: string,
  comment: string,
): Promise<Report> {
  await delay(700);
  const updated = reports.find((r) => r.id === reportId);
  if (!updated) throw new Error('Report not found');
  const result: Report = {
    ...updated,
    status: 'rejected',
    reviewedAt: new Date().toISOString(),
    reviewedById: reviewerId,
    notes: comment ? `[Rejected] ${comment}` : updated.notes,
  };
  reports = reports.map((r) => (r.id === reportId ? result : r));
  return { ...result };
}
