import { useCallback, useEffect, useRef } from 'react';
import type { Project } from '../types/app';
import type { ReviewState } from '../types/chat';
import { useToast } from './use-toast';
import { isReviewPending, clearReviewPending } from '../lib/kanbanStore';
import { openReviewTabForWorkspace } from '../lib/workspaceProviderTabs';

/** Storage key for pending review prompt */
const REVIEW_PROMPT_KEY = (workspaceId: string) => `emdash:reviewPrompt:${workspaceId}`;

/** Get pending review prompt for a workspace */
export function getPendingReviewPrompt(workspaceId: string): string | null {
  try {
    return localStorage.getItem(REVIEW_PROMPT_KEY(workspaceId));
  } catch {
    return null;
  }
}

/** Clear pending review prompt for a workspace */
export function clearPendingReviewPrompt(workspaceId: string): void {
  try {
    localStorage.removeItem(REVIEW_PROMPT_KEY(workspaceId));
  } catch {}
}

/** Set pending review prompt for a workspace */
function setPendingReviewPrompt(workspaceId: string, prompt: string): void {
  try {
    localStorage.setItem(REVIEW_PROMPT_KEY(workspaceId), prompt);
  } catch {}
}

export const REVIEW_PROMPT = `You are a code review agent. Please review the changes in this worktree and provide feedback.

Review Checklist:
1. **Code Quality**: Check for clean code principles, readability, and maintainability
2. **Logic**: Verify the implementation logic is correct and handles edge cases
3. **Types**: Ensure TypeScript types are properly used (no \`any\`, proper interfaces)
4. **Security**: Look for potential security vulnerabilities (injection, XSS, etc.)
5. **Performance**: Identify any performance concerns or inefficiencies
6. **Testing**: Check if changes are properly tested
7. **Documentation**: Verify code is properly documented where needed

Please run \`git diff\` to see the changes, then provide your review with:
- Summary of changes
- Issues found (if any)
- Suggestions for improvement
- Overall assessment (approve/request changes)

Be concise and actionable in your feedback.`;

interface UseReviewAgentOptions {
  project: Project;
  workspaceId: string;
  workspacePath: string;
  onReviewStateChange?: (state: ReviewState) => void;
  /** If true, will auto-start review if pending */
  autoStart?: boolean;
}

interface UseReviewAgentReturn {
  startReview: () => void;
  canStartReview: boolean;
  reviewEnabled: boolean;
}

/**
 * Hook to manage review agent for a workspace.
 * Checks if review is enabled and provides functions to start review.
 */
export function useReviewAgent({
  project,
  workspaceId,
  workspacePath,
  onReviewStateChange,
  autoStart = false,
}: UseReviewAgentOptions): UseReviewAgentReturn {
  const { toast } = useToast();
  const startedRef = useRef<Set<string>>(new Set());
  const autoStartCheckedRef = useRef<boolean>(false);

  const reviewEnabled = project.reviewAgentConfig?.enabled === true;
  const reviewProvider = project.reviewAgentConfig?.provider ?? 'claude';

  // Check if we can start a review (only if single tab is open)
  const canStartReview = useCallback(() => {
    if (!reviewEnabled) return false;

    try {
      const storageKey = `emdash:providerTabs:v1:${workspaceId}`;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return true; // No tabs means single tab

      const parsed = JSON.parse(raw);
      const tabs = Array.isArray(parsed?.tabs) ? parsed.tabs : [];
      // Filter out review tabs when checking
      const nonReviewTabs = tabs.filter((t: { isReview?: boolean }) => !t.isReview);
      return nonReviewTabs.length <= 1;
    } catch {
      return true;
    }
  }, [reviewEnabled, workspaceId]);

  const startReview = useCallback(() => {
    if (!reviewEnabled) {
      return;
    }

    if (!canStartReview()) {
      toast({
        title: 'Cannot start review',
        description: 'Review can only start when there is a single tab open',
        variant: 'destructive' as const,
      });
      return;
    }

    // Prevent duplicate starts
    const startKey = `${workspaceId}:${Date.now()}`;
    if (startedRef.current.has(workspaceId)) {
      return;
    }
    startedRef.current.add(workspaceId);

    // Open review tab using the proper in-memory store
    // This ensures ChatInterface's useSyncExternalStore receives the update
    const reviewTabId = openReviewTabForWorkspace(workspaceId, reviewProvider as any, reviewProvider as any);

    // Update review state to in-review
    const reviewState: ReviewState = {
      status: 'in-review',
      tabId: reviewTabId || `${reviewProvider}-review`,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };

    onReviewStateChange?.(reviewState);

    // Store the review prompt for ChatInterface to inject via useInitialPromptInjection
    // This ensures the prompt is sent only after the PTY is ready
    // We send just the prompt text since Claude CLI is already running in the terminal
    setPendingReviewPrompt(workspaceId, REVIEW_PROMPT);

    toast({
      title: 'Review started',
      description: 'Code review agent is analyzing your changes',
    });
  }, [
    canStartReview,
    onReviewStateChange,
    reviewEnabled,
    reviewProvider,
    toast,
    workspaceId,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      startedRef.current.delete(workspaceId);
    };
  }, [workspaceId]);

  // Auto-start review if pending and autoStart is enabled
  useEffect(() => {
    if (!autoStart || autoStartCheckedRef.current) return;
    autoStartCheckedRef.current = true;

    // Check if review is pending for this workspace
    if (isReviewPending(workspaceId) && reviewEnabled && canStartReview()) {
      // Clear the pending flag first
      clearReviewPending(workspaceId);

      // Start review after a short delay to ensure terminal is ready
      const timer = setTimeout(() => {
        startReview();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [autoStart, canStartReview, reviewEnabled, startReview, workspaceId]);

  return {
    startReview,
    canStartReview: canStartReview(),
    reviewEnabled,
  };
}

export default useReviewAgent;
