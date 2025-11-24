import type { ProviderId } from '@shared/providers/registry';

export interface Repo {
  id: string;
  path: string;
  origin: string;
  defaultBranch: string;
  lastActivity?: string;
  changes?: {
    added: number;
    removed: number;
  };
}

export const RUN_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type RunStatus = (typeof RUN_STATUS)[keyof typeof RUN_STATUS];

export const PROVIDER_TYPE = {
  CLAUDE: 'claude-code',
  OPENAI: 'openai-agents',
} as const;

export type ProviderType = (typeof PROVIDER_TYPE)[keyof typeof PROVIDER_TYPE];

export interface Run {
  id: string;
  repoId: string;
  branch: string;
  worktreePath: string;
  provider: ProviderType;
  prompt: string;
  status: RunStatus;
  startedAt: string;
  finishedAt: string | null;
  tokenUsage: number;
  cost: number;
}

export const RUN_EVENT_KIND = {
  LLM: 'llm',
  TOOL: 'tool',
  BASH: 'bash',
  GIT: 'git',
  DIFF: 'diff',
  ERROR: 'error',
} as const;

export type RunEventKind = (typeof RUN_EVENT_KIND)[keyof typeof RUN_EVENT_KIND];

export interface RunEvent {
  runId: string;
  timestamp: string;
  kind: RunEventKind;
  payload: any;
}

export interface Settings {
  claudeApiKey?: string;
  openaiApiKey?: string;
  githubToken?: string;
  defaultProvider: ProviderType;
  maxConcurrentRuns: number;
}

export interface Workspace {
  id: string;
  name: string;
  repos: Repo[];
}

export type Provider = ProviderId;

import {
  ShortcutConfig,
  ShortcutModifier,
  KeyboardShortcut,
  ShortcutMapping,
  GlobalShortcutHandlers,
} from './shortcuts';

// Keyboard shortcuts types
export type {
  ShortcutConfig,
  ShortcutModifier,
  KeyboardShortcut,
  ShortcutMapping,
  GlobalShortcutHandlers,
};
