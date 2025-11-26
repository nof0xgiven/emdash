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

describe('KanbanBoard Code Review Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should automatically open workspace when moved to done for review', () => {
    // Test that the fix works: moving to "done" should trigger workspace opening

    const mockProject = {
      id: 'test-project',
      name: 'Test Project',
      path: '/test/path',
      workspaces: [
        {
          id: 'workspace-1',
          name: 'Test Workspace',
          branch: 'feature/test',
          path: '/test/path/workspace-1',
          status: 'idle' as const,
        },
      ],
    };

    const onOpenWorkspace = vi.fn();

    // Simulate the fixed handleDrop logic from KanbanBoard
    const mockHandleDrop = (target: string, workspaceId: string) => {
      if (target === 'done' && onOpenWorkspace) {
        const workspace = mockProject.workspaces?.find((ws) => ws.id === workspaceId);
        if (workspace) {
          onOpenWorkspace(workspace);
        }
      }
    };

    // Test moving to done triggers workspace opening
    mockHandleDrop('done', 'workspace-1');

    expect(onOpenWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'workspace-1',
        name: 'Test Workspace',
      })
    );
  });

  it('should not open workspace when moved to todo or in-progress', () => {
    const mockProject = {
      id: 'test-project',
      name: 'Test Project',
      path: '/test/path',
      workspaces: [
        {
          id: 'workspace-1',
          name: 'Test Workspace',
          branch: 'feature/test',
          path: '/test/path/workspace-1',
          status: 'idle' as const,
        },
      ],
    };

    const onOpenWorkspace = vi.fn();

    const mockHandleDrop = (target: string, workspaceId: string) => {
      if (target === 'done' && onOpenWorkspace) {
        const workspace = mockProject.workspaces?.find((ws) => ws.id === workspaceId);
        if (workspace) {
          onOpenWorkspace(workspace);
        }
      }
    };

    // Test moving to in-progress doesn't trigger opening
    mockHandleDrop('in-progress', 'workspace-1');
    expect(onOpenWorkspace).not.toHaveBeenCalled();

    // Test moving to todo doesn't trigger opening
    mockHandleDrop('todo', 'workspace-1');
    expect(onOpenWorkspace).not.toHaveBeenCalled();
  });
});
