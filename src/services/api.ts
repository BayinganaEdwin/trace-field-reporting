/**
 * api.ts — base HTTP client for the SiteLog backend.
 *
 * Wraps fetch() with:
 *  - Automatic X-User-Id header injection
 *  - JSON error handling (throws with server message when available)
 *  - Multipart form-data helper for photo uploads
 */

import { API_BASE_URL, getCurrentUserId } from './config';

// ── Base auth headers (JSON requests) ─────────────────────────────────────────

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': getCurrentUserId(),
    ...extra,
  };
}

// ── Error helper ──────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.error ?? body.message ?? message;
    } catch {
      // body wasn't JSON — keep the HTTP status message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ── Public client methods ─────────────────────────────────────────────────────

export const api = {
  /** GET /path → parsed JSON */
  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return handleResponse<T>(res);
  },

  /** POST /path with JSON body → parsed JSON */
  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  },

  /** POST /path with multipart FormData (for photo upload) → parsed JSON */
  async upload<T>(path: string, formData: FormData): Promise<T> {
    // Do NOT set Content-Type — fetch sets it automatically with the boundary
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'X-User-Id': getCurrentUserId() },
      body: formData,
    });
    return handleResponse<T>(res);
  },

  /** PATCH /path with JSON body → parsed JSON */
  async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  },

  /** DELETE /path → parsed JSON */
  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse<T>(res);
  },

  /** Absolute URL base (for resolving photo paths returned by the server) */
  baseUrl: API_BASE_URL,
};
