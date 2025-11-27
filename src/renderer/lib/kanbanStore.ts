export type KanbanStatus = 'todo' | 'in-progress' | 'done';

const STORAGE_KEY = 'emdash:kanban:statusByWorkspace';
const REVIEW_PENDING_KEY = 'emdash:kanban:reviewPending';

type MapShape = Record<string, KanbanStatus>;
type ReviewPendingShape = Record<string, boolean>;

let cache: MapShape | null = null;
let reviewPendingCache: ReviewPendingShape | null = null;

function read(): MapShape {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        cache = parsed as MapShape;
        return cache;
      }
    }
  } catch {}
  cache = {};
  return cache;
}

function write(next: MapShape) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function getStatus(workspaceId: string): KanbanStatus {
  const map = read();
  return (map[workspaceId] as KanbanStatus) || 'todo';
}

export function setStatus(workspaceId: string, status: KanbanStatus): void {
  const map = { ...read(), [workspaceId]: status };
  write(map);
}

export function getAll(): MapShape {
  return { ...read() };
}

export function clearAll(): void {
  write({});
}

function readReviewPending(): ReviewPendingShape {
  if (reviewPendingCache) return reviewPendingCache;
  try {
    const raw = localStorage.getItem(REVIEW_PENDING_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        reviewPendingCache = parsed as ReviewPendingShape;
        return reviewPendingCache;
      }
    }
  } catch {}
  reviewPendingCache = {};
  return reviewPendingCache;
}

function writeReviewPending(next: ReviewPendingShape) {
  reviewPendingCache = next;
  try {
    localStorage.setItem(REVIEW_PENDING_KEY, JSON.stringify(next));
  } catch {}
}

export function setReviewPending(workspaceId: string, pending: boolean): void {
  const map = { ...readReviewPending(), [workspaceId]: pending };
  if (!pending) {
    delete map[workspaceId];
  }
  writeReviewPending(map);
}

export function isReviewPending(workspaceId: string): boolean {
  return readReviewPending()[workspaceId] === true;
}

export function clearReviewPending(workspaceId: string): void {
  setReviewPending(workspaceId, false);
}
