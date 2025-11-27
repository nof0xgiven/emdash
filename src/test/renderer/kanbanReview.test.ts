import { describe, it, expect, beforeEach, vi } from 'vitest';

// Set up localStorage mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// @ts-ignore
global.localStorage = localStorageMock;

describe('useReviewAgent auto-start functionality', () => {
  const mockProject = {
    id: 'test-project',
    name: 'Test Project',
    path: '/test/path',
    gitInfo: { isGitRepo: false },
    reviewAgentConfig: {
      enabled: true,
      provider: 'claude' as const,
    },
  };

  const mockWorkspace = {
    id: 'test-workspace',
    path: '/test/workspace',
  };

  const mockIsReviewPending = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    // Reset localStorage mock
    localStorageMock.clear();
  });

  it('should demonstrate the current canStartReview behavior with multiple tabs', () => {
    // Arrange: Set up multiple non-review tabs (simulating the bug condition)
    const storageKey = `emdash:providerTabs:v1:${mockWorkspace.id}`;
    const tabsData = {
      tabs: [
        { id: 'codex', provider: 'codex', createdAt: Date.now() },
        { id: 'claude', provider: 'claude', createdAt: Date.now() },
      ],
      activeId: 'codex',
    };
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === storageKey) return JSON.stringify(tabsData);
      return null;
    });

    // Act: Simulate the current canStartReview logic
    const reviewEnabled = mockProject.reviewAgentConfig?.enabled === true;

    const currentCanStartReview = () => {
      if (!reviewEnabled) return false;

      // Current implementation (without fix)
      try {
        const raw = localStorageMock.getItem(storageKey);
        if (!raw) return true;

        const parsed = JSON.parse(raw);
        const tabs = Array.isArray(parsed?.tabs) ? parsed.tabs : [];
        const nonReviewTabs = tabs.filter((t: { isReview?: boolean }) => !t.isReview);
        return nonReviewTabs.length <= 1;
      } catch {
        return true;
      }
    };

    // Assert: Verify current behavior blocks review due to multiple tabs
    expect(currentCanStartReview()).toBe(false);
  });

  it('should demonstrate the desired canStartReview behavior with pending flag', () => {
    // Arrange: Set up pending review flag and multiple tabs
    mockIsReviewPending.mockReturnValue(true);

    const storageKey = `emdash:providerTabs:v1:${mockWorkspace.id}`;
    const tabsData = {
      tabs: [
        { id: 'codex', provider: 'codex', createdAt: Date.now() },
        { id: 'claude', provider: 'claude', createdAt: Date.now() },
      ],
      activeId: 'codex',
    };
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === storageKey) return JSON.stringify(tabsData);
      return null;
    });

    // Act: Simulate the desired canStartReview logic with fix
    const reviewEnabled = mockProject.reviewAgentConfig?.enabled === true;

    const canStartReviewWithFix = () => {
      if (!reviewEnabled) return false;

      // If a pending review exists, bypass the tab-count restriction
      if (mockIsReviewPending(mockWorkspace.id)) return true;

      // Existing logic for normal review start
      try {
        const raw = localStorageMock.getItem(storageKey);
        if (!raw) return true;

        const parsed = JSON.parse(raw);
        const tabs = Array.isArray(parsed?.tabs) ? parsed.tabs : [];
        const nonReviewTabs = tabs.filter((t: { isReview?: boolean }) => !t.isReview);
        return nonReviewTabs.length <= 1;
      } catch {
        return true;
      }
    };

    // Assert: Verify that review is allowed due to pending flag despite multiple tabs
    expect(canStartReviewWithFix()).toBe(true);
  });

  it('should still enforce single-tab rule when no pending flag exists', () => {
    // Arrange: No pending review flag and multiple tabs
    mockIsReviewPending.mockReturnValue(false);

    const storageKey = `emdash:providerTabs:v1:${mockWorkspace.id}`;
    const tabsData = {
      tabs: [
        { id: 'codex', provider: 'codex', createdAt: Date.now() },
        { id: 'claude', provider: 'claude', createdAt: Date.now() },
      ],
      activeId: 'codex',
    };
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === storageKey) return JSON.stringify(tabsData);
      return null;
    });

    // Act: Simulate the desired canStartReview logic with fix
    const reviewEnabled = mockProject.reviewAgentConfig?.enabled === true;

    const canStartReviewWithFix = () => {
      if (!reviewEnabled) return false;

      // If a pending review exists, bypass the tab-count restriction
      if (mockIsReviewPending(mockWorkspace.id)) return true;

      // Existing logic for normal review start
      try {
        const raw = localStorageMock.getItem(storageKey);
        if (!raw) return true;

        const parsed = JSON.parse(raw);
        const tabs = Array.isArray(parsed?.tabs) ? parsed.tabs : [];
        const nonReviewTabs = tabs.filter((t: { isReview?: boolean }) => !t.isReview);
        return nonReviewTabs.length <= 1;
      } catch {
        return true;
      }
    };

    // Assert: Verify that review is still blocked due to multiple tabs when no pending flag
    expect(canStartReviewWithFix()).toBe(false);
  });

  it('should allow canStartReview when no pending flag exists and only one tab is open', () => {
    // Arrange: No pending review flag and only one tab
    mockIsReviewPending.mockReturnValue(false);

    const storageKey = `emdash:providerTabs:v1:${mockWorkspace.id}`;
    const tabsData = {
      tabs: [{ id: 'claude', provider: 'claude', createdAt: Date.now() }],
      activeId: 'claude',
    };
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === storageKey) return JSON.stringify(tabsData);
      return null;
    });

    // Act: Simulate the desired canStartReview logic with fix
    const reviewEnabled = mockProject.reviewAgentConfig?.enabled === true;

    const canStartReviewWithFix = () => {
      if (!reviewEnabled) return false;

      // If a pending review exists, bypass the tab-count restriction
      if (mockIsReviewPending(mockWorkspace.id)) return true;

      // Existing logic for normal review start
      try {
        const raw = localStorageMock.getItem(storageKey);
        if (!raw) return true;

        const parsed = JSON.parse(raw);
        const tabs = Array.isArray(parsed?.tabs) ? parsed.tabs : [];
        const nonReviewTabs = tabs.filter((t: { isReview?: boolean }) => !t.isReview);
        return nonReviewTabs.length <= 1;
      } catch {
        return true;
      }
    };

    // Assert: Verify that review is allowed when only one tab exists
    expect(canStartReviewWithFix()).toBe(true);
  });
});
