export type ReviewStatus = 'idle' | 'running' | 'success' | 'error';

export type ReviewFile = {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  diff?: {
    lines: Array<{
      left?: string;
      right?: string;
      type: 'context' | 'add' | 'del';
    }>;
  };
};

export type ReviewState = {
  status: ReviewStatus;
  summary: string;
  files: ReviewFile[];
  startedAt: number;
  finishedAt?: number;
  error?: string;
};

type StartArgs = {
  workspaceId: string;
  workspacePath: string;
};

const states = new Map<string, ReviewState>();
const listeners = new Map<string, Set<(state: ReviewState) => void>>();
const inflight = new Map<string, Promise<ReviewState>>();

const INITIAL_STATE: ReviewState = {
  status: 'idle',
  summary: 'No review started yet.',
  files: [],
  startedAt: 0,
};

function emit(workspaceId: string) {
  const state = states.get(workspaceId) ?? INITIAL_STATE;
  const set = listeners.get(workspaceId);
  if (!set) return;
  set.forEach((cb) => {
    try {
      cb(state);
    } catch {
      // ignore listener errors
    }
  });
}

export function getReviewState(workspaceId: string): ReviewState {
  return states.get(workspaceId) ?? INITIAL_STATE;
}

export function subscribeToReviewState(
  workspaceId: string,
  listener: (state: ReviewState) => void
): () => void {
  const set = listeners.get(workspaceId) ?? new Set();
  set.add(listener);
  listeners.set(workspaceId, set);
  return () => {
    const bucket = listeners.get(workspaceId);
    if (!bucket) return;
    bucket.delete(listener);
    if (bucket.size === 0) {
      listeners.delete(workspaceId);
    }
  };
}

async function collectFileDiff(
  workspacePath: string,
  filePath: string
): Promise<ReviewFile['diff'] | undefined> {
  try {
    const res = await (window as any).electronAPI?.getFileDiff?.({
      workspacePath,
      filePath,
    });
    if (res?.success && res?.diff) return res.diff as ReviewFile['diff'];
  } catch {
    // ignore individual diff failures
  }
  return undefined;
}

export async function startReview(args: StartArgs): Promise<ReviewState> {
  const { workspaceId, workspacePath } = args;
  const pending = inflight.get(workspaceId);
  if (pending) return pending;
  const existing = states.get(workspaceId);
  if (existing?.status === 'success') {
    return existing;
  }
  if (existing?.status === 'running') {
    const inFlightExisting = inflight.get(workspaceId);
    return inFlightExisting ?? existing;
  }

  const startedAt = Date.now();
  const running: ReviewState = {
    status: 'running',
    summary: 'Starting code review…',
    files: [],
    startedAt,
  };
  states.set(workspaceId, running);
  emit(workspaceId);

  const work = (async (): Promise<ReviewState> => {
    try {
      const res = await (window as any).electronAPI?.getGitStatus?.(workspacePath);
      if (!res?.success) {
        throw new Error(res?.error || 'Unable to collect git status for review');
      }
      const changes: Array<any> = Array.isArray(res?.changes) ? res.changes : [];
      const filtered = changes.filter(
        (c) =>
          !String(c?.path || '').startsWith('.emdash/') && String(c?.path || '') !== 'PLANNING.md'
      );

      const files: ReviewFile[] = [];
      for (const change of filtered) {
        const path = String(change?.path || '');
        const status = String(change?.status || '');
        const additions = Number(change?.additions || 0);
        const deletions = Number(change?.deletions || 0);
        const diff = await collectFileDiff(workspacePath, path);
        files.push({ path, status, additions, deletions, diff });
      }

      const totalAdds = files.reduce((sum, f) => sum + f.additions, 0);
      const totalDels = files.reduce((sum, f) => sum + f.deletions, 0);
      const summary =
        files.length > 0
          ? `${files.length} file${files.length === 1 ? '' : 's'} changed (+${totalAdds} / -${totalDels})`
          : 'No local changes to review.';

      const next: ReviewState = {
        status: 'success',
        summary,
        files,
        startedAt,
        finishedAt: Date.now(),
      };
      states.set(workspaceId, next);
      emit(workspaceId);
      return next;
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      const failure: ReviewState = {
        status: 'error',
        summary: '',
        files: [],
        startedAt,
        finishedAt: Date.now(),
        error: errorMsg,
      };
      states.set(workspaceId, failure);
      emit(workspaceId);
      return failure;
    } finally {
      inflight.delete(workspaceId);
    }
  })();

  inflight.set(workspaceId, work);
  return work;
}

export function resetReviewState() {
  states.clear();
  inflight.clear();
  listeners.clear();
}

export function useReviewState(workspaceId: string): ReviewState {
  return useSyncExternalStore(
    (listener) => subscribeToReviewState(workspaceId, listener),
    () => getReviewState(workspaceId),
    () => getReviewState(workspaceId)
  );
}
import { useSyncExternalStore } from 'react';
