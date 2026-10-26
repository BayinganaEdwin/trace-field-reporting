/**
 * useReports — context-based state hook for all report operations.
 *
 * All screens share one in-memory store via ReportsProvider.
 * Swap the mockService import for real fetch() calls to go live —
 * this hook's public interface is unchanged.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as ApiService from '../services/apiService';
import { getCurrentUserId, getCurrentUserRole } from '../services/config';
import type { Report, Site } from '../types';

const {
  fetchReports,
  fetchSites,
  submitReport,
  approveReport,
  flagReport,
  rejectReport,
  deleteReport,
} = ApiService;

/**
 * Workers must only ever see their own reports.
 * The backend already enforces this server-side, but we apply the same
 * filter client-side as a defence-in-depth guarantee — so no worker ever
 * glimpses another worker's data even if the API response is unexpected.
 */
function scopeReports(reports: Report[]): Report[] {
  if (getCurrentUserRole() === 'worker') {
    const uid = getCurrentUserId();
    return reports.filter((r) => r.submittedById === uid);
  }
  return reports;
}

type SubmitReportPayload = MockService.SubmitReportPayload;

// ── Context shape ─────────────────────────────────────────────────────────────

interface ReportsContextValue {
  reports: Report[];
  sites: Site[];
  /** The site currently selected by the user (worker or manager). Defaults to the first site on load. */
  activeSite: Site | null;
  setActiveSite: (site: Site) => void;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  submit: (payload: SubmitReportPayload) => Promise<void>;
  approve: (reportId: string, reviewerId: string) => Promise<void>;
  flag: (reportId: string, reviewerId: string) => Promise<void>;
  reject: (reportId: string, reviewerId: string, comment: string) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  getReport: (id: string) => Report | undefined;
  addSite: (site: Site) => void;
}

const ReportsContext = createContext<ReportsContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

interface ReportsProviderProps {
  children: React.ReactNode;
}

export function ReportsProvider({ children }: ReportsProviderProps) {
  const [reports, setReports]     = useState<Report[]>([]);
  const [sites, setSites]         = useState<Site[]>([]);
  const [activeSite, setActiveSiteState] = useState<Site | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const setActiveSite = useCallback((site: Site) => {
    setActiveSiteState(site);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Sites load independently — no auth required, so this always succeeds
      const s = await fetchSites();
      setSites(s);
      setActiveSiteState((prev) => prev ?? s[0] ?? null);
    } catch {
      // Sites failing is non-fatal — app can still show empty state
    }
    try {
      const r = await fetchReports();
      setReports(scopeReports(r));
    } catch {
      setError('Failed to load reports. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(() => load(), [load]);

  const submit = useCallback(async (payload: SubmitReportPayload) => {
    // Track the ID of the last onPhaseUpdate so we can replace it when the
    // backend assigns a permanent ID (real API: temp id → backend id transition).
    let trackedId: string | null = null;

    await submitReport(payload, (updated) => {
      setReports((prev) => {
        const existsById = prev.some((r) => r.id === updated.id);
        if (existsById) {
          // Normal update — same ID already in list
          return prev.map((r) => (r.id === updated.id ? updated : r));
        }
        // ID changed (e.g. tmp-* → report-*): replace the old entry
        if (trackedId && trackedId !== updated.id) {
          const hasPrev = prev.some((r) => r.id === trackedId);
          if (hasPrev) {
            return prev.map((r) => (r.id === trackedId ? updated : r));
          }
        }
        // First time we see this report — prepend
        return [updated, ...prev];
      });
      trackedId = updated.id;
    });
  }, []);

  const approve = useCallback(async (reportId: string, reviewerId: string) => {
    // Optimistic — instant UI update
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, status: 'approved', reviewedAt: new Date().toISOString(), reviewedById: reviewerId }
          : r,
      ),
    );
    try {
      const updated = await approveReport(reportId, reviewerId);
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
    } catch {
      // Revert on failure
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: 'verified' } : r)),
      );
    }
  }, []);

  const flag = useCallback(async (reportId: string, reviewerId: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, status: 'flagged', reviewedAt: new Date().toISOString(), reviewedById: reviewerId }
          : r,
      ),
    );
    try {
      const updated = await flagReport(reportId, reviewerId);
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
    } catch {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: 'verified' } : r)),
      );
    }
  }, []);

  const reject = useCallback(async (reportId: string, reviewerId: string, comment: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, status: 'rejected', reviewedAt: new Date().toISOString(), reviewedById: reviewerId }
          : r,
      ),
    );
    try {
      const updated = await rejectReport(reportId, reviewerId, comment);
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
    } catch {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: 'verified' } : r)),
      );
    }
  }, []);

  const removeReport = useCallback(async (reportId: string) => {
    // Optimistic remove
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    try {
      await deleteReport(reportId);
    } catch (err) {
      // Revert on failure by re-fetching
      const rows = await fetchReports();
      setReports(scopeReports(rows));
      throw err;
    }
  }, []);

  const getReport = useCallback(
    (id: string) => reports.find((r) => r.id === id),
    [reports],
  );

  const addSite = useCallback((site: Site) => {
    setSites((prev) => [...prev, site]);
  }, []);

  return (
    <ReportsContext.Provider
      value={{ reports, sites, activeSite, setActiveSite, loading, error, refresh, submit, approve, flag, reject, deleteReport: removeReport, getReport, addSite }}
    >
      {children}
    </ReportsContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useReports(): ReportsContextValue {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used inside <ReportsProvider>');
  return ctx;
}
