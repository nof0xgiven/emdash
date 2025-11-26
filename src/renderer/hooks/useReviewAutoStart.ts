import { useEffect, useState } from 'react';
import { getStatus } from '@/lib/kanbanStore';
import type { Workspace } from '@/types/app';

export interface UseReviewAutoStartReturn {
  shouldShowReview: boolean;
  reviewStarted: boolean;
}

/**
 * Hook that automatically detects when a workspace should enter review mode
 * based on its kanban status changing to "done" (Ready for Review)
 */
export function useReviewAutoStart(workspace: Workspace): UseReviewAutoStartReturn {
  const [reviewStarted, setReviewStarted] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string>('');
  
  const currentStatus = getStatus(workspace.id);
  const shouldShowReview = currentStatus === 'done';
  
  useEffect(() => {
    // Reset review state when workspace changes
    if (previousStatus !== currentStatus) {
      setPreviousStatus(currentStatus);
      
      // Check if we just moved to review status
      if (currentStatus === 'done' && previousStatus !== 'done') {
        setReviewStarted(true);
        
        // Trigger review auto-start logic here
        // This could include:
        // - Opening the review tab
        // - Generating review summary
        // - Notifying reviewers
        console.log(`[ReviewAutoStart] Workspace ${workspace.id} moved to review status`);
      }
    }
  }, [currentStatus, previousStatus, workspace.id]);
  
  return {
    shouldShowReview,
    reviewStarted,
  };
}