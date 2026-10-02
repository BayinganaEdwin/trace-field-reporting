// ── Domain types — mirrors the backend data model ────────────────────────────

export type UserRole = 'worker' | 'manager';

export type ConstructionStage =
  | 'formwork_erected'
  | 'reinforcement_placed'
  | 'concrete_poured'
  | 'structure_complete';

export type ReportStatus =
  | 'uploading'    // optimistic — client-only
  | 'pending'      // submitted, awaiting AI
  | 'ai_processing'// AI running (client animation state)
  | 'verified'     // AI confidence >= 80%, stages match
  | 'flagged'      // AI detected stage mismatch or low confidence
  | 'approved'     // manually approved by manager
  | 'rejected';    // manually rejected

export type InferenceMode = 'server' | 'on_device';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  siteId: string;
}

export interface Site {
  id: string;
  name: string;
  location: string;
  currentStage: ConstructionStage;
  progressPercent: number;
  workerCount: number;
  lastReportAt: string | null;
}

export interface AIResult {
  detectedStage: ConstructionStage;
  reportedStage: ConstructionStage;
  confidenceScore: number;      // 0–100
  isMatch: boolean;
  inferenceMode: InferenceMode;
  modelVersion: string;
  processedAt: string;
}

export interface Report {
  id: string;
  siteId: string;
  siteName: string;
  submittedById: string;
  submittedByName: string;
  reportedStage: ConstructionStage;
  notes: string;
  photoUri: string | null;
  status: ReportStatus;
  aiResult: AIResult | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedById: string | null;
  isOfflineSubmission: boolean;
}

// ── Navigation param types ────────────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  WorkerApp: undefined;
  ManagerApp: undefined;
};

export type WorkerTabParamList = {
  WorkerHome: undefined;
  WorkerHistory: undefined;
  WorkerProfile: undefined;
};

export type WorkerStackParamList = {
  WorkerTabs: undefined;
  SubmitReport: undefined;
  WorkerReportDetail: { reportId: string };
};

export type ManagerTabParamList = {
  ManagerHome: undefined;
  ReportsFeed: undefined;
  ManagerNotifications: undefined;
  ManagerProfile: undefined;
};

export type ManagerStackParamList = {
  ManagerTabs: undefined;
  ReportDetail: { reportId: string };
};

// ── UI / state helpers ────────────────────────────────────────────────────────

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface StageOption {
  value: ConstructionStage;
  label: string;
  description: string;
  order: number;
}

export const STAGE_OPTIONS: StageOption[] = [
  {
    value: 'formwork_erected',
    label: 'Formwork Erected',
    description: 'Wooden or steel formwork set in place and secured',
    order: 1,
  },
  {
    value: 'reinforcement_placed',
    label: 'Reinforcement Placed',
    description: 'Steel rebar positioned, tied, and inspected',
    order: 2,
  },
  {
    value: 'concrete_poured',
    label: 'Concrete Poured',
    description: 'Concrete cast, levelled, and vibration-compacted',
    order: 3,
  },
  {
    value: 'structure_complete',
    label: 'Structure Complete',
    description: 'Section fully cured and structural inspection passed',
    order: 4,
  },
];

export const STAGE_LABELS: Record<ConstructionStage, string> = {
  formwork_erected:     'Formwork Erected',
  reinforcement_placed: 'Reinforcement Placed',
  concrete_poured:      'Concrete Poured',
  structure_complete:   'Structure Complete',
};
