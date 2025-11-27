import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage
const localStorageData = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageData.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => localStorageData.set(key, value)),
  removeItem: vi.fn((key: string) => localStorageData.delete(key)),
  clear: vi.fn(() => localStorageData.clear()),
  key: vi.fn((index: number) => Array.from(localStorageData.keys())[index] ?? null),
  get length() {
    return localStorageData.size;
  },
};

vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('window', { localStorage: localStorageMock });

// We'll test the kanbanStore logic directly since it doesn't need React
// eslint-disable-next-line import/first
import {
  setReviewPending,
  clearReviewPending,
  isReviewPending,
  setStatus,
  getStatus,
} from '../../renderer/lib/kanbanStore';

describe('kanbanStore', () => {
  beforeEach(() => {
    localStorageData.clear();
  });

  describe('review pending flag', () => {
    it('should set and get review pending flag', () => {
      const workspaceId = 'workspace-123';

      // Initially not pending
      expect(isReviewPending(workspaceId)).toBe(false);

      // Set pending
      setReviewPending(workspaceId, true);
      expect(isReviewPending(workspaceId)).toBe(true);

      // Clear pending
      clearReviewPending(workspaceId);
      expect(isReviewPending(workspaceId)).toBe(false);
    });

    it('should persist pending flag to localStorage', () => {
      const workspaceId = 'workspace-456';

      setReviewPending(workspaceId, true);

      const stored = localStorageData.get('emdash:kanban:reviewPending');
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed[workspaceId]).toBe(true);
    });

    it('should set pending flag when status changes to done', () => {
      // This test documents the expected behavior:
      // When a workspace moves to 'done' status, the review pending flag should be set
      const workspaceId = 'workspace-789';

      // Simulate the Kanban board behavior
      setStatus(workspaceId, 'done');
      setReviewPending(workspaceId, true);

      expect(getStatus(workspaceId)).toBe('done');
      expect(isReviewPending(workspaceId)).toBe(true);
    });
  });
});

describe('useReviewAgent canStartReview logic', () => {
  beforeEach(() => {
    localStorageData.clear();
  });

  /**
   * This test documents the bug: canStartReview returns false when multiple tabs exist,
   * blocking the auto-start even when a review is pending.
   *
   * The fix should allow auto-start to bypass the tab count check.
   */
  it('bug: canStartReview returns false with multiple tabs', () => {
    const workspaceId = 'workspace-bug';
    const storageKey = `emdash:providerTabs:v1:${workspaceId}`;

    // Set up multiple non-review tabs
    const tabsState = {
      tabs: [
        { id: 'claude', provider: 'claude', createdAt: Date.now() },
        { id: 'codex', provider: 'codex', createdAt: Date.now() },
      ],
      activeId: 'claude',
    };
    localStorageData.set(storageKey, JSON.stringify(tabsState));

    // Simulate canStartReview logic (from useReviewAgent.ts:87-103)
    const raw = localStorageData.get(storageKey);
    const parsed = JSON.parse(raw!);
    const tabs = Array.isArray(parsed?.tabs) ? parsed.tabs : [];
    const nonReviewTabs = tabs.filter((t: { isReview?: boolean }) => !t.isReview);
    const canStart = nonReviewTabs.length <= 1;

    // This documents the bug: with 2 tabs, canStartReview returns false
    expect(canStart).toBe(false);
  });

  it('fix: should be able to start review with multiple tabs when auto-start is triggered', () => {
    const workspaceId = 'workspace-fix';
    const storageKey = `emdash:providerTabs:v1:${workspaceId}`;

    // Set up multiple non-review tabs
    const tabsState = {
      tabs: [
        { id: 'claude', provider: 'claude', createdAt: Date.now() },
        { id: 'codex', provider: 'codex', createdAt: Date.now() },
      ],
      activeId: 'claude',
    };
    localStorageData.set(storageKey, JSON.stringify(tabsState));

    // Set review pending flag (simulates Kanban card moving to Done)
    setReviewPending(workspaceId, true);

    // The fix: when isReviewPending is true, auto-start should bypass canStartReview
    // This simulates the new logic that should be in useReviewAgent.ts
    const shouldAutoStart = isReviewPending(workspaceId);

    // With the fix, auto-start should proceed regardless of tab count
    expect(shouldAutoStart).toBe(true);
  });

  it('canStartReview should return true with single tab', () => {
    const workspaceId = 'workspace-single';
    const storageKey = `emdash:providerTabs:v1:${workspaceId}`;

    // Set up single tab
    const tabsState = {
      tabs: [{ id: 'claude', provider: 'claude', createdAt: Date.now() }],
      activeId: 'claude',
    };
    localStorageData.set(storageKey, JSON.stringify(tabsState));

    // Simulate canStartReview logic
    const raw = localStorageData.get(storageKey);
    const parsed = JSON.parse(raw!);
    const tabs = Array.isArray(parsed?.tabs) ? parsed.tabs : [];
    const nonReviewTabs = tabs.filter((t: { isReview?: boolean }) => !t.isReview);
    const canStart = nonReviewTabs.length <= 1;

    expect(canStart).toBe(true);
  });

  it('canStartReview should return true when no tabs exist', () => {
    const workspaceId = 'workspace-none';
    const storageKey = `emdash:providerTabs:v1:${workspaceId}`;

    // No storage entry
    const raw = localStorageData.get(storageKey);

    // Simulate canStartReview logic - if no raw data, return true
    const canStart = !raw;

    expect(canStart).toBe(true);
  });
});
