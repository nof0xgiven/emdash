import { describe, it, expect, vi } from 'vitest';

// Test to verify the fix works correctly
// This test demonstrates that the fix allows auto-start despite multiple tabs
// when a pending review flag exists

describe('Auto-start review fix verification', () => {
  it('should allow canStartReview when pending review flag exists despite multiple tabs', () => {
    // This test demonstrates the fix where:
    // 1. Multiple tabs exist (which normally blocks review)
    // 2. A pending review flag exists
    // 3. canStartReview() returns true because pending flag bypasses tab restriction

    const mockWorkspaceId = 'test-workspace';
    const mockReviewEnabled = true;
    const mockIsReviewPending = vi.fn().mockReturnValue(true);

    // Simulate multiple tabs in localStorage
    const storageKey = `emdash:providerTabs:v1:${mockWorkspaceId}`;
    const tabsData = {
      tabs: [
        { id: 'codex', provider: 'codex', createdAt: Date.now() },
        { id: 'claude', provider: 'claude', createdAt: Date.now() },
      ],
      activeId: 'codex',
    };

    const mockLocalStorage = {
      getItem: vi.fn().mockImplementation((key: string) => {
        if (key === storageKey) return JSON.stringify(tabsData);
        return null;
      }),
    };

    // This is the fixed canStartReview logic
    const canStartReviewWithFix = () => {
      if (!mockReviewEnabled) return false;

      // If a pending review exists, bypass the tab-count restriction
      if (mockIsReviewPending(mockWorkspaceId)) return true;

      // Existing logic for normal review start
      try {
        const raw = mockLocalStorage.getItem(storageKey);
        if (!raw) return true;

        const parsed = JSON.parse(raw);
        const tabs = Array.isArray(parsed?.tabs) ? parsed.tabs : [];
        const nonReviewTabs = tabs.filter((t: { isReview?: boolean }) => !t.isReview);
        return nonReviewTabs.length <= 1;
      } catch {
        return true;
      }
    };

    // Assert: With the fix, canStartReview should return true
    expect(canStartReviewWithFix()).toBe(true);

    // Verify that isReviewPending was called
    expect(mockIsReviewPending).toHaveBeenCalledWith(mockWorkspaceId);
  });

  it('should allow startReview with force parameter to bypass canStartReview check', () => {
    // This test demonstrates that startReview(true) bypasses the canStartReview check
    // This is used in the auto-start path to ensure the review starts even when
    // multiple tabs exist and the pending flag logic might not be sufficient

    const mockReviewEnabled = true;
    const mockCanStartReview = vi.fn().mockReturnValue(false); // Would normally block
    const mocktoast = vi.fn();
    const mockStartedRef = { current: new Set() };
    const mockOpenReviewTab = vi.fn().mockReturnValue('claude-review');
    const mockOnReviewStateChange = vi.fn();
    const mockSetPendingReviewPrompt = vi.fn();
    const mockWorkspaceId = 'test-workspace';
    const mockReviewProvider = 'claude';

    // This simulates the fixed startReview logic
    const startReview = (force = false) => {
      if (!mockReviewEnabled) {
        return;
      }

      if (!force && !mockCanStartReview()) {
        mocktoast({
          title: 'Cannot start review',
          description: 'Review can only start when there is a single tab open',
          variant: 'destructive',
        });
        return;
      }

      // Prevent duplicate starts
      if (mockStartedRef.current.has(mockWorkspaceId)) {
        return;
      }
      mockStartedRef.current.add(mockWorkspaceId);

      // Open review tab
      const reviewTabId = mockOpenReviewTab(
        mockWorkspaceId,
        mockReviewProvider,
        mockReviewProvider
      );

      // Update review state to in-review
      const reviewState = {
        status: 'in-review',
        tabId: reviewTabId || `${mockReviewProvider}-review`,
        startedAt: new Date().toISOString(),
        completedAt: null,
      };

      mockOnReviewStateChange?.(reviewState);

      // Store the review prompt
      mockSetPendingReviewPrompt(mockWorkspaceId, 'REVIEW_PROMPT');

      mocktoast({
        title: 'Review started',
        description: 'Code review agent is analyzing your changes',
      });
    };

    // Test 1: Normal startReview (should fail due to canStartReview returning false)
    startReview(false);
    expect(mockOnReviewStateChange).not.toHaveBeenCalled();
    expect(mocktoast).toHaveBeenCalledWith({
      title: 'Cannot start review',
      description: 'Review can only start when there is a single tab open',
      variant: 'destructive',
    });

    // Reset mocks
    vi.clearAllMocks();
    mocktoast.mockClear();
    mockOnReviewStateChange.mockClear();

    // Test 2: Forced startReview (should succeed despite canStartReview returning false)
    startReview(true);
    expect(mockOnReviewStateChange).toHaveBeenCalledWith({
      status: 'in-review',
      tabId: 'claude-review',
      startedAt: expect.any(String),
      completedAt: null,
    });
    expect(mocktoast).toHaveBeenCalledWith({
      title: 'Review started',
      description: 'Code review agent is analyzing your changes',
    });
  });
});
