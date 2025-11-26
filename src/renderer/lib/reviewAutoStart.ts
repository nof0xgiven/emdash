import type { Workspace } from '../types/app';
import type { KanbanStatus } from './kanbanStore';
import { startReview } from './reviewRunner';

type StartFn = (args: { workspaceId: string; workspacePath: string }) => Promise<unknown>;

/**
 * Kick off a code review when a workspace enters the "done" state.
 * Idempotent: callers may invoke repeatedly without re-running the review.
 */
export async function autoStartReviewIfDone(
  workspace: Workspace,
  targetStatus: KanbanStatus,
  starter: StartFn = startReview
) {
  if (targetStatus !== 'done') return;
  if (!workspace?.id || !workspace?.path) return;
  try {
    await starter({ workspaceId: workspace.id, workspacePath: workspace.path });
  } catch {
    // best-effort trigger; swallow errors so UI flow is unaffected
  }
}
