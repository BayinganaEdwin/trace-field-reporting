/**
 * config.ts — single source of truth for all API configuration.
 *
 * To switch environments, change API_BASE_URL here (or via env var).
 * To toggle between real backend and mock data, flip USE_REAL_API.
 *
 * In production:
 *   API_BASE_URL  = 'https://api.sitelog.rw'
 *   ML_BASE_URL   = 'https://ml.sitelog.rw'  (or omit if Node proxies to Flask)
 *   USE_REAL_API  = true
 */

// ── API URLs ──────────────────────────────────────────────────────────────────

/** Node.js/Express REST backend */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://sitelog-backend-fkqs.onrender.com';

/** Python Flask inference server (port 5001 locally).
 *  Only needed if you call the ML server directly from the app.
 *  Normally the Node backend proxies ML — leave this as-is. */
export const ML_BASE_URL =
  process.env.EXPO_PUBLIC_ML_URL ?? 'http://localhost:5001';

// ── Feature flag ──────────────────────────────────────────────────────────────

/**
 * Set to `true` to use the real Express backend.
 * Set to `false` to keep using local mock data (no backend required).
 *
 * Reads EXPO_PUBLIC_USE_REAL_API env var so you can flip it without
 * touching source code:
 *   EXPO_PUBLIC_USE_REAL_API=true npx expo start
 */
export const USE_REAL_API = true;
// export const USE_REAL_API: boolean =
//   process.env.EXPO_PUBLIC_USE_REAL_API === 'true';

// ── Auth context ──────────────────────────────────────────────────────────────

/**
 * The currently authenticated user's backend ID.
 * Call setCurrentUserId() at login / role selection.
 * Every real API call reads this via getApiHeaders().
 */
let _currentUserId: string = '';
let _currentUserRole: 'worker' | 'manager' | 'owner' | '' = '';

export function setCurrentUserId(id: string): void {
  _currentUserId = id;
}

export function getCurrentUserId(): string {
  return _currentUserId;
}

export function setCurrentUserRole(role: 'worker' | 'manager' | 'owner'): void {
  _currentUserRole = role;
}

export function getCurrentUserRole(): 'worker' | 'manager' | 'owner' | '' {
  return _currentUserRole;
}

/** Standard headers injected on every authenticated request. */
export function getApiHeaders(
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': _currentUserId,
    ...extra,
  };
}

// ── Demo account mapping ──────────────────────────────────────────────────────

/**
 * Maps demo email prefixes → seeded backend user IDs.
 * Matches the IDs in backend/src/db/seed.js.
 */
export const DEMO_USER_MAP: Record<string, string> = {
  worker: 'user-worker-1',
  manager: 'user-manager-1',
  owner: 'user-owner-1',
};

/** Display name for each demo user (matches backend seed.js) */
export const DEMO_USER_NAMES: Record<string, string> = {
  'user-worker-1':  'Amara Diallo',
  'user-worker-2':  'Jean Mugisha',
  'user-manager-1': 'Fatima Nkusi',
  'user-owner-1':   'Patrick Habimana',
};

export function getCurrentUserName(): string {
  return DEMO_USER_NAMES[_currentUserId] ?? _currentUserId;
}

/** Update the in-memory display name after a successful profile save. */
export function setCurrentUserName(name: string): void {
  if (_currentUserId) {
    DEMO_USER_NAMES[_currentUserId] = name;
  }
}
