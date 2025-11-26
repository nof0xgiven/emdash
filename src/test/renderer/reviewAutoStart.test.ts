import { describe, expect, it, vi } from 'vitest';

import { autoStartReviewIfDone } from '@/lib/reviewAutoStart';

const workspace = {
  id: 'ws-123',
  name: 'demo',
  branch: 'main',
  path: '/tmp/ws-123',
  status: 'idle',
};

describe('autoStartReviewIfDone', () => {
  it('invokes review starter when status transitions to done', async () => {
    const start = vi.fn().mockResolvedValue(undefined);

    await autoStartReviewIfDone(workspace as any, 'done', start);

    expect(start).toHaveBeenCalledWith({ workspaceId: workspace.id, workspacePath: workspace.path });
  });

  it('does nothing for non-done targets', async () => {
    const start = vi.fn();

    await autoStartReviewIfDone(workspace as any, 'in-progress', start);

    expect(start).not.toHaveBeenCalled();
  });
});
