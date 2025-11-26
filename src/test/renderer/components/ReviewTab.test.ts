import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ReviewTab from '@/components/ReviewTab';
import * as kanbanStore from '@/lib/kanbanStore';
import * as fileChangesHook from '@/hooks/useFileChanges';
import * as fileDiffHook from '@/hooks/useFileDiff';
import * as prHook from '@/hooks/usePrStatus';

// Mock the hooks and dependencies
vi.mock('../hooks/useFileChanges');
vi.mock('../hooks/useFileDiff');
vi.mock('../hooks/usePrStatus');
vi.mock('../lib/kanbanStore');

describe('ReviewTab', () => {
  const mockWorkspace = {
    id: 'test-workspace-1',
    name: 'Test Workspace',
    path: '/test/path',
    branch: 'feature/test',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock kanban store to return 'done' status
    vi.spyOn(kanbanStore, 'getStatus').mockReturnValue('done');
    
    // Mock file changes hook
    vi.spyOn(fileChangesHook, 'useFileChanges').mockReturnValue({
      totalAdditions: 50,
      totalDeletions: 20,
      isLoading: false,
      changes: [
        {
          path: 'src/test.ts',
          status: 'modified',
          additions: 30,
          deletions: 10,
        },
        {
          path: 'src/new.ts',
          status: 'added',
          additions: 20,
          deletions: 0,
        },
      ],
    });
    
    // Mock file diff hook
    vi.spyOn(fileDiffHook, 'useFileDiff').mockReturnValue({
      diff: 'diff --git a/src/test.ts b/src/test.ts\n+ new line 1\n+ new line 2',
      isLoading: false,
    });
    
    // Mock PR status hook
    vi.spyOn(prHook, 'usePrStatus').mockReturnValue({
      pr: null,
      isLoading: false,
    });
  });

  it('should not render when workspace is not in review status', () => {
    vi.spyOn(kanbanStore, 'getStatus').mockReturnValue('todo');
    
    const { container } = render(
      <ReviewTab workspace={mockWorkspace} />
    );
    
    expect(container).toBeEmptyDOMElement();
  });

  it('should render when workspace is in review status (done)', () => {
    render(<ReviewTab workspace={mockWorkspace} />);
    
    expect(screen.getByText('Code Review')).toBeInTheDocument();
    expect(screen.getByText('Ready for Review')).toBeInTheDocument();
  });

  it('should display file changes summary', () => {
    render(<ReviewTab workspace={mockWorkspace} />);
    
    expect(screen.getByText('50 additions')).toBeInTheDocument();
    expect(screen.getByText('20 deletions')).toBeInTheDocument();
    expect(screen.getByText('2 files changed')).toBeInTheDocument();
  });

  it('should display individual file changes', () => {
    render(<ReviewTab workspace={mockWorkspace} />);
    
    expect(screen.getByText('src/test.ts')).toBeInTheDocument();
    expect(screen.getByText('src/new.ts')).toBeInTheDocument();
  });

  it('should show diff when file is selected', async () => {
    render(<ReviewTab workspace={mockWorkspace} />);
    
    const fileItem = screen.getByText('src/test.ts');
    fileItem.click();
    
    await waitFor(() => {
      expect(screen.getByText('+ new line 1')).toBeInTheDocument();
    });
  });

  it('should show create PR button when no PR exists', () => {
    render(<ReviewTab workspace={mockWorkspace} />);
    
    expect(screen.getByText('Create Pull Request')).toBeInTheDocument();
  });

  it('should show PR status when PR exists', () => {
    vi.spyOn(prHook, 'usePrStatus').mockReturnValue({
      pr: {
        title: 'Test PR',
        url: 'https://github.com/test/repo/pull/1',
        state: 'open',
      },
      isLoading: false,
    });
    
    render(<ReviewTab workspace={mockWorkspace} />);
    
    expect(screen.getByText('Pull Request #1')).toBeInTheDocument();
    expect(screen.getByText('View PR')).toBeInTheDocument();
  });

  it('should handle loading states', () => {
    vi.spyOn(fileChangesHook, 'useFileChanges').mockReturnValue({
      totalAdditions: 0,
      totalDeletions: 0,
      isLoading: true,
      changes: [],
    });
    
    render(<ReviewTab workspace={mockWorkspace} />);
    
    expect(screen.getByText('Loading changes...')).toBeInTheDocument();
  });

  it('should handle no changes found', () => {
    vi.spyOn(fileChangesHook, 'useFileChanges').mockReturnValue({
      totalAdditions: 0,
      totalDeletions: 0,
      isLoading: false,
      changes: [],
    } as any);
    
    render(<ReviewTab workspace={mockWorkspace} />);
    
    expect(screen.getByText('No changes found')).toBeInTheDocument();
  });
});