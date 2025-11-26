import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
  startReview,
  getReviewState,
  resetReviewState,
  type ReviewState,
} from '@/lib/reviewRunner';

function stubElectronApi(overrides: Partial<typeof window.electronAPI>) {
  const w = globalThis as any;
  w.window = w.window || {};
  w.window.electronAPI = {
    getGitStatus: vi.fn(),
    getFileDiff: vi.fn(),
    ...overrides,
  };
}

describe('reviewRunner.startReview', () => {
  beforeEach(() => {
    resetReviewState();
  });

  it('collects git status and diffs then marks review as success', async () => {
    const getGitStatus = vi.fn().mockResolvedValue({
      success: true,
      changes: [
        { path: 'src/index.ts', status: 'M', additions: 5, deletions: 2 },
        { path: 'README.md', status: 'A', additions: 10, deletions: 0 },
      ],
    });
    const getFileDiff = vi
      .fn()
      .mockResolvedValue({ success: true, diff: { lines: [{ left: '', right: '', type: 'add' }] } });

    stubElectronApi({ getGitStatus, getFileDiff });

    const state = await startReview({ workspaceId: 'ws-1', workspacePath: '/tmp/ws-1' });

    expect(getGitStatus).toHaveBeenCalledWith('/tmp/ws-1');
    expect(getFileDiff).toHaveBeenCalledTimes(2);
    expect(state.status).toBe('success');
    expect(state.files).toHaveLength(2);
    expect(state.summary).toContain('2 files');
    expect(state.summary).toContain('+15');
    expect(state.summary).toContain('-2');
  });

  it('is idempotent while a review is running or already finished', async () => {
    const getGitStatus = vi.fn().mockResolvedValue({
      success: true,
      changes: [{ path: 'a.ts', status: 'M', additions: 1, deletions: 0 }],
    });
    const getFileDiff = vi.fn().mockResolvedValue({ success: true, diff: { lines: [] } });
    stubElectronApi({ getGitStatus, getFileDiff });

    const first = startReview({ workspaceId: 'ws-idempotent', workspacePath: '/tmp/ws-idem' });
    const second = startReview({ workspaceId: 'ws-idempotent', workspacePath: '/tmp/ws-idem' });

    const [result1, result2] = await Promise.all([first, second]);

    expect(result1).toBe(result2);
    expect(getGitStatus).toHaveBeenCalledTimes(1);
  });

  it('marks success with a friendly message when there are no local changes', async () => {
    const getGitStatus = vi.fn().mockResolvedValue({ success: true, changes: [] });
    stubElectronApi({ getGitStatus, getFileDiff: vi.fn() });

    const state = (await startReview({
      workspaceId: 'ws-empty',
      workspacePath: '/tmp/ws-empty',
    })) as ReviewState;

    expect(state.status).toBe('success');
    expect(state.files).toHaveLength(0);
    expect(state.summary.toLowerCase()).toContain('no local changes');
  });

  it('surfaces git errors as a failed review state', async () => {
    const getGitStatus = vi.fn().mockResolvedValue({ success: false, error: 'boom' });
    stubElectronApi({ getGitStatus, getFileDiff: vi.fn() });

    const state = await startReview({ workspaceId: 'ws-fail', workspacePath: '/tmp/ws-fail' });

    expect(state.status).toBe('error');
    expect(state.error).toContain('boom');
  });
});
