/**
 * apiService.ts — real backend implementations matching mockService's interface exactly.
 *
 * Every function here has the same signature as the equivalent in mockService.ts.
 * useReports.tsx imports from here (or mockService) based on USE_REAL_API in config.ts.
 *
 * Submit flow (3-phase):
 *   Phase 1 → optimistic 'uploading' report, added to local state immediately
 *   Phase 2 → POST to /reports (multipart) → backend returns 'pending' report
 *   Phase 3 → poll GET /reports/:id every 2 s until status leaves 'pending'
 *             (AI inference runs async on the server, updates to 'verified')
 */

import { api } from './api';
import { API_BASE_URL, getCurrentUserId } from './config';
import { adaptReport, adaptSite } from './adapters';
import type { Report, Site, SiteWorker } from '../types';
import type { SubmitReportPayload } from '../data/mockService';

// ── Queries ───────────────────────────────────────────────────────────────────

export async function fetchReports(): Promise<Report[]> {
  const rows = await api.get<any[]>('/reports');
  return rows.map(adaptReport);
}

export async function fetchReport(id: string): Promise<Report> {
  const row = await api.get<any>(`/reports/${id}`);
  return adaptReport(row);
}

export async function fetchSites(): Promise<Site[]> {
  const rows = await api.get<any[]>('/sites');
  console.log('[apiService] fetchSites →', rows.length, 'sites', rows.map(r => r.id));
  return rows.map(adaptSite);
}

// ── Worker assignment ─────────────────────────────────────────────────────────

/** List workers currently assigned to a site. Manager/owner only. */
export async function fetchSiteWorkers(siteId: string): Promise<SiteWorker[]> {
  return api.get<SiteWorker[]>(`/sites/${siteId}/workers`);
}

/** Workers NOT yet assigned to the site — for the "Add Worker" picker. Manager only. */
export async function fetchAvailableWorkers(siteId: string): Promise<SiteWorker[]> {
  return api.get<SiteWorker[]>(`/sites/${siteId}/available-workers`);
}

/** Assign a worker to a site. Manager only. */
export async function assignWorkerToSite(
  siteId: string,
  workerId: string,
): Promise<{ siteId: string; workerId: string; workerName: string }> {
  return api.post(`/sites/${siteId}/workers`, { workerId });
}

/** Unassign a worker from a site. Manager only. */
export async function unassignWorkerFromSite(
  siteId: string,
  workerId: string,
): Promise<{ deleted: boolean }> {
  return api.delete(`/sites/${siteId}/workers/${workerId}`);
}

// ── Submit (3-phase) ──────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2_000;
const POLL_MAX_ATTEMPTS = 10; // 20 s max

/** Poll until the report's status is no longer 'pending', then return it. */
async function pollUntilProcessed(
  reportId: string,
  onUpdate: (report: Report) => void,
): Promise<Report> {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);
    try {
      const row = await api.get<any>(`/reports/${reportId}`);
      const report = adaptReport(row);
      if (report.status !== 'pending') {
        onUpdate(report);
        return report;
      }
    } catch {
      // Network hiccup — keep polling
    }
  }
  // Timed out — fetch final state, emit it so UI stops spinning, then return
  const row = await api.get<any>(`/reports/${reportId}`);
  const timedOut = adaptReport(row);
  onUpdate(timedOut);
  return timedOut;
}

export async function submitReport(
  payload: SubmitReportPayload,
  onPhaseUpdate: (report: Report) => void,
): Promise<Report> {
  const now = new Date().toISOString();

  // ── Phase 1: optimistic 'uploading' placeholder ──────────────────────────
  const tempId = `tmp-${Date.now()}`;
  const optimistic: Report = {
    id: tempId,
    siteId: payload.siteId,
    siteName: payload.siteName,
    submittedById: payload.submittedById,
    submittedByName: payload.submittedByName,
    reportedStage: payload.reportedStage,
    notes: payload.notes,
    photoUri: payload.photoUri,
    status: 'uploading',
    aiResult: null,
    submittedAt: now,
    reviewedAt: null,
    reviewedById: null,
    isOfflineSubmission: payload.isOfflineSubmission,
    geoLocation: payload.geoLocation,
  };
  onPhaseUpdate(optimistic);

  // ── Phase 2: POST to backend ──────────────────────────────────────────────
  const formData = new FormData();
  formData.append('site_id', payload.siteId);
  formData.append('reported_stage', payload.reportedStage);
  formData.append('notes', payload.notes ?? '');

  console.log('[apiService] submitReport →', {
    url: `${API_BASE_URL}/reports`,
    userId: getCurrentUserId(),
    siteId: payload.siteId,
    stage: payload.reportedStage,
    hasPhoto: !!payload.photoUri,
  });

  if (payload.geoLocation) {
    formData.append('latitude', String(payload.geoLocation.lat));
    formData.append('longitude', String(payload.geoLocation.lng));
  }

  if (payload.photoUri) {
    // React Native file URI → multipart blob
    const filename = payload.photoUri.split('/').pop() ?? 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
    formData.append('photo', {
      uri: payload.photoUri,
      name: filename,
      type,
    } as unknown as Blob);
  }

  let submitted: any;
  try {
    submitted = await api.upload<any>('/reports', formData);
  } catch (err) {
    console.error('[apiService] submitReport FAILED:', err);
    throw err;
  }
  console.log('[apiService] submitReport ✓ id:', submitted?.id, 'status:', submitted?.status);
  const pendingReport = adaptReport(submitted);

  // Replace optimistic placeholder with real pending report
  onPhaseUpdate(pendingReport);

  // ── Phase 3: poll for AI result ───────────────────────────────────────────
  if (!payload.photoUri) {
    // No photo → AI won't run → report stays 'pending' for manual review
    // No polling needed, but emit one more time so UI is fully up-to-date
    onPhaseUpdate(pendingReport);
    return pendingReport;
  }

  const finalReport = await pollUntilProcessed(pendingReport.id, onPhaseUpdate);
  return finalReport;
}

// ── Manager actions ───────────────────────────────────────────────────────────

export async function approveReport(
  reportId: string,
  _reviewerId: string, // userId already in X-User-Id header
  comment?: string,
): Promise<Report> {
  const row = await api.post<any>(`/reports/${reportId}/approve`, { comment });
  return adaptReport(row);
}

export async function flagReport(
  reportId: string,
  _reviewerId: string,
  comment?: string,
): Promise<Report> {
  const row = await api.post<any>(`/reports/${reportId}/flag`, { comment });
  return adaptReport(row);
}

export async function rejectReport(
  reportId: string,
  _reviewerId: string,
  comment: string,
): Promise<Report> {
  const row = await api.post<any>(`/reports/${reportId}/reject`, { comment });
  return adaptReport(row);
}

// ── Worker actions ────────────────────────────────────────────────────────────

export async function deleteReport(reportId: string): Promise<{ deleted: boolean; id: string }> {
  return api.delete<{ deleted: boolean; id: string }>(`/reports/${reportId}`);
}

// ── Utility ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Re-export the payload type so consumers can import from a single place
export type { SubmitReportPayload };
