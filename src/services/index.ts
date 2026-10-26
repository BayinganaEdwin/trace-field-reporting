/**
 * src/services — real backend integration layer
 *
 * config.ts     → API_BASE_URL, USE_REAL_API flag, currentUserId management
 * api.ts        → base fetch wrapper (auth headers, error handling, upload helper)
 * adapters.ts   → backend snake_case → frontend camelCase type mapping
 * apiService.ts → function-for-function replacement for mockService.ts
 *
 * ── How to switch environments ───────────────────────────────────────────────
 *
 * Development (mock data, no backend):
 *   USE_REAL_API = false  (default)
 *
 * Development (real local backend):
 *   USE_REAL_API = true
 *   API_BASE_URL = 'http://localhost:3000'
 *   Start backend: cd Capstone/Project/backend && npm start
 *   Start ML server: cd Capstone/Project/model_training && python inference_server.py
 *
 * Production:
 *   Set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_USE_REAL_API=true in your CI/CD
 *   environment or app.config.js extra → no source code changes needed.
 */

export { API_BASE_URL, ML_BASE_URL, USE_REAL_API, setCurrentUserId, getCurrentUserId, setCurrentUserRole, getCurrentUserRole, setCurrentUserName, getCurrentUserName, DEMO_USER_MAP } from './config';
export { api } from './api';
export { adaptReport, adaptSite } from './adapters';
export * from './apiService';
