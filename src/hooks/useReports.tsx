/**
 * useReports — context-based state hook for all report operations.
 *
 * All screens share one in-memory store via ReportsProvider.
 * Swap the mockService import for real fetch() calls to go live —
 * this hook's public interface is unchanged.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  fetchReports,
  fetchSites,
  submitReport,
  approveReport,
  flagReport,
  type SubmitReportPayload,
} from '../data/mockService';
import type { Report, Site } from '../types';

// ── Context shape ─────────────────────────────────────────────────────────────

interface ReportsContextValue {
  reports: Report[];
  sites: Site[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  submit: (payload: SubmitReportPayload) => Promise<void>;
  approve: (reportId: string, reviewerId: string) => Promise<void>;
  flag: (reportId: string, reviewerId: string) => Promise<void>;
  getReport: (id: string) => Report | undefined;
}

const ReportsContext = createContext<ReportsContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

interface ReportsProviderProps {
  children: React.ReactNode;
}

export function ReportsProvider({ children }: ReportsProviderProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [sites, setSites]     = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, s] = await Promise.all([fetchReports(), fetchSites()]);
      setReports(r);
      setSites(s);
    } catch {
      setError('Failed to load data. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(() => load(), [load]);

  const submit = useCallback(async (payload: SubmitReportPayload) => {
    await submitReport(payload, (updated) => {
      setReports((prev) => {
        const exists = prev.some((r) => r.id === updated.id);
        return exists
          ? prev.map((r) => (r.id === updated.id ? updated : r))
          : [updated, ...prev];
      });
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

  const getReport = useCallback(
    (id: string) => reports.find((r) => r.id === id),
    [reports],
  );

  return (
    <ReportsContext.Provider
      value={{ reports, sites, loading, error, refresh, submit, approve, flag, getReport }}
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
