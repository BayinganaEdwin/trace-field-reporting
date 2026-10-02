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

import { MOCK_REPORTS, MOCK_SITES } from './mockData';
import type { ConstructionStage, InferenceMode, Report, ReportStatus, Site } from '../types';

// In-memory store — simulates server state for the session
let reports: Report[] = [...MOCK_REPORTS];
let sites: Site[]     = [...MOCK_SITES];

// ── Helpers ───────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

const generateId = () => `rpt-${String(Math.floor(Math.random() * 9000) + 1000)}`;

/** Deterministic mock AI result — confidence varies by stage match */
const simulateAI = (
  reportedStage: ConstructionStage,
  photoUri: string | null,
): { detectedStage: ConstructionStage; confidence: number; match: boolean; mode: InferenceMode } => {
  const hasPhoto = photoUri !== null;
  // Without a photo the model can't run — return low confidence
  if (!hasPhoto) {
    return { detectedStage: reportedStage, confidence: 0, match: true, mode: 'server' };
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
  return { detectedStage, confidence, match: isMatch, mode: 'server' };
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

  const optimistic: Report = {
    id,
    ...payload,
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
