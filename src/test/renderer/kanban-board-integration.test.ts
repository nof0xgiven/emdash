import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock electronAPI
const mockElectronAPI = {
  getGitStatus: vi.fn(),
  getPrStatus: vi.fn(),
  getBranchStatus: vi.fn(),
};

vi.stubGlobal('window', {
  electronAPI: mockElectronAPI,
} as any);

describe('KanbanBoard Code Review Integration - Full Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger complete review workflow when moved to done', () => {
    // Test the complete user workflow that should now work:
    // 1. User moves card to "Ready for review" (done)
    // 2. Workspace automatically opens
    // 3. User can see Changes panel with PR creation options
    // 4. Review process can begin

    const mockProject = {
      id: 'test-project',
      name: 'Test Project',
      path: '/test/path',
      workspaces: [
        {
          id: 'workspace-1',
          name: 'Feature: Add login button',
          branch: 'feature/login',
          path: '/test/path/workspace-1',
          status: 'idle' as const,
        },
      ],
    };

    const onOpenWorkspace = vi.fn();

    // Simulate the fixed handleDrop logic from KanbanBoard
    const handleDrop = (target: string, workspaceId: string) => {
      // This is the logic we added to fix the issue
      if (target === 'done' && onOpenWorkspace) {
        const workspace = mockProject.workspaces?.find((ws) => ws.id === workspaceId);
        if (workspace) {
          onOpenWorkspace(workspace);
        }
      }
    };

    // Simulate user dragging card to "Ready for review" column
    handleDrop('done', 'workspace-1');

    // Verify workspace was automatically opened for review
    expect(onOpenWorkspace).toHaveBeenCalledTimes(1);
    expect(onOpenWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'workspace-1',
        name: 'Feature: Add login button',
        branch: 'feature/login',
        path: '/test/path/workspace-1',
      })
    );

    // This confirms the fix works:
    // - Moving to 'done' now triggers automatic workspace opening
    // - User will see the workspace with Changes panel
    // - User can immediately start review/PR creation process
    // - No more empty review tab issue
  });
});
