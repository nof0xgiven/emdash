import React, { useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useReviewState, startReview, type ReviewStatus } from '@/lib/reviewRunner';

type Props = {
  workspaceId: string;
  workspacePath: string;
  className?: string;
};

const statusTone: Record<ReviewStatus, { label: string; tone: 'default' | 'secondary' | 'outline' }> = {
  idle: { label: 'Idle', tone: 'secondary' },
  running: { label: 'Running', tone: 'default' },
  success: { label: 'Ready', tone: 'secondary' },
  error: { label: 'Failed', tone: 'outline' },
};

export const ReviewPanel: React.FC<Props> = ({ workspaceId, workspacePath, className }) => {
  const state = useReviewState(workspaceId);
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      await startReview({ workspaceId, workspacePath });
    } finally {
      setStarting(false);
    }
  };

  if (!workspaceId || !workspacePath) return null;

  const tone = statusTone[state.status];
  const badgeClass =
    state.status === 'error'
      ? 'border-destructive/40 text-destructive'
      : state.status === 'running'
        ? 'border-primary/40 text-foreground'
        : undefined;

  return (
    <div className={['flex flex-col border-b border-border bg-background', className].join(' ')}>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Code review</span>
          <Badge variant={tone?.tone ?? 'secondary'} className={['capitalize', badgeClass].filter(Boolean).join(' ')}>
            {tone?.label ?? state.status}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStart}
          disabled={starting || state.status === 'running'}
          className="h-8 px-2 text-xs"
        >
          {starting || state.status === 'running' ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
          )}
          Run review
        </Button>
      </div>

      <div className="space-y-2 px-3 pb-3 text-sm text-muted-foreground">
        {state.status === 'running' ? (
          <div className="inline-flex items-center gap-2 text-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Collecting changes…</span>
          </div>
        ) : state.status === 'error' ? (
          <div className="inline-flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4" />
            <span>{state.error || 'Review failed'}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 text-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>{state.summary}</span>
          </div>
        )}

        {state.files.length ? (
          <div className="space-y-1.5">
            {state.files.slice(0, 5).map((file) => (
              <div
                key={file.path}
                className="flex items-center justify-between rounded-md border border-border/70 bg-muted/40 px-2 py-1"
              >
                <div className="truncate text-foreground" title={file.path}>
                  {file.path}
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">
                  +{file.additions} / -{file.deletions}
                </div>
              </div>
            ))}
            {state.files.length > 5 ? (
              <div className="text-xs text-muted-foreground">
                +{state.files.length - 5} more file
                {state.files.length - 5 === 1 ? '' : 's'}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ReviewPanel;
