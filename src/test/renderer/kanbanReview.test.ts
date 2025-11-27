import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import useReviewAgent from '../../renderer/hooks/useReviewAgent';
import { setReviewPending, clearReviewPending } from '../../renderer/lib/kanbanStore';
import * as workspaceProviderTabs from '../../renderer/lib/workspaceProviderTabs';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

// Mock workspace provider tabs
const openReviewTabForWorkspaceMock = vi.fn();
vi.mock('../../renderer/lib/workspaceProviderTabs', () => ({
  openReviewTabForWorkspace: openReviewTabForWorkspaceMock,
}));

// Mock toast
const toastMock = vi.fn();
vi.mock('../../renderer/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

// Mock logger
vi.mock('../../renderer/lib/logger', () => ({
  log: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useReviewAgent - Auto-start when Kanban card moves to Done', () => {
  const mockProject = {
    id: 'test-project',
    name: 'Test Project',
    path: '/test/path',
    gitInfo: { isGitRepo: true },
    reviewAgentConfig: {
      enabled: true,
      provider: 'claude',
    },
  };

  const workspaceId = 'test-workspace';
  const workspacePath = '/test/workspace';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    clearReviewPending(workspaceId);
  });

  it('should auto-start review when pending flag exists and multiple tabs are open', async () => {
    // Set up scenario: multiple non-review tabs are open
    const tabsState = {
      tabs: [
        { id: 'tab1', provider: 'codex', createdAt: Date.now(), isReview: false },
        { id: 'tab2', provider: 'claude', createdAt: Date.now(), isReview: false },
      ],
      activeId: 'tab1',
    };
    localStorageMock.setItem(`emdash:providerTabs:v1:${workspaceId}`, JSON.stringify(tabsState));

    // Set review pending flag (simulating card moved to Done)
    setReviewPending(workspaceId, true);

    // Mock successful tab opening
    openReviewTabForWorkspaceMock.mockReturnValue('claude-review');

    const { result } = renderHook(() =>
      useReviewAgent({
        project: mockProject,
        workspaceId,
        workspacePath,
        onReviewStateChange: vi.fn(),
        autoStart: true,
      })
    );

    // Wait for the auto-start effect to run
    await waitFor(() => {
      expect(openReviewTabForWorkspaceMock).toHaveBeenCalledWith(
        workspaceId,
        'claude',
        'claude'
      );
    });

    // Verify the review was started despite multiple tabs being open
    expect(openReviewTabForWorkspaceMock).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith({
      title: 'Review started',
      description: 'Code review agent is analyzing your changes',
    });

    // Verify pending flag was cleared
    expect(JSON.parse(localStorageMock.getItem('emdash:kanban:reviewPending') || '{}')).not.toHaveProperty(workspaceId);
  });

  it('should not auto-start when review is disabled', () => {
    const disabledProject = {
      ...mockProject,
      reviewAgentConfig: { enabled: false },
    };

    setReviewPending(workspaceId, true);

    renderHook(() =>
      useReviewAgent({
        project: disabledProject,
        workspaceId,
        workspacePath,
        onReviewStateChange: vi.fn(),
        autoStart: true,
      })
    );

    expect(openReviewTabForWorkspaceMock).not.toHaveBeenCalled();
  });

  it('should not auto-start when autoStart is false', () => {
    setReviewPending(workspaceId, true);

    renderHook(() =>
      useReviewAgent({
        project: mockProject,
        workspaceId,
        workspacePath,
        onReviewStateChange: vi.fn(),
        autoStart: false,
      })
    );

    expect(openReviewTabForWorkspaceMock).not.toHaveBeenCalled();
  });

  it('should not auto-start when no pending flag exists', () => {
    // Don't set pending flag

    renderHook(() =>
      useReviewAgent({
        project: mockProject,
        workspaceId,
        workspacePath,
        onReviewStateChange: vi.fn(),
        autoStart: true,
      })
    );

    expect(openReviewTabForWorkspaceMock).not.toHaveBeenCalled();
  });
});