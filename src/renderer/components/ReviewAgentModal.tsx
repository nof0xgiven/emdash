import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Bug, X } from 'lucide-react';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { useToast } from '../hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface ReviewAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  initialConfig?: {
    enabled: boolean;
    provider: string;
  };
  /** Called after config is successfully saved to database */
  onConfigSaved?: () => void;
}

const REVIEW_PROVIDERS = [
  { value: 'claude', label: 'Claude Code' },
] as const;

const ReviewAgentModal: React.FC<ReviewAgentModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  initialConfig,
  onConfigSaved,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(initialConfig?.enabled ?? false);
  const [provider, setProvider] = useState(initialConfig?.provider ?? 'claude');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Reset state when modal opens with new initial config
  useEffect(() => {
    if (isOpen) {
      setEnabled(initialConfig?.enabled ?? false);
      setProvider(initialConfig?.provider ?? 'claude');
    }
  }, [isOpen, initialConfig?.enabled, initialConfig?.provider]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSaving(false);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSave = useCallback(async () => {
    if (saving) return;

    setSaving(true);
    try {
      const config = enabled ? { enabled: true, provider } : null;

      const result = await window.electronAPI.updateReviewAgentConfig({
        projectId,
        config,
      });

      if (result.success) {
        toast({
          title: enabled ? 'Review agent enabled' : 'Review agent disabled',
          description: enabled
            ? `${projectName} will automatically review completed tasks`
            : `Review agent disabled for ${projectName}`,
        });
        onConfigSaved?.();
        onClose();
      } else {
        toast({
          title: 'Failed to save',
          description: result.error ?? 'Unknown error',
          variant: 'destructive' as const,
        });
      }
    } catch (error) {
      console.error('Failed to update review agent config:', error);
      toast({
        title: 'Failed to save',
        description: 'An unexpected error occurred',
        variant: 'destructive' as const,
      });
    } finally {
      setSaving(false);
    }
  }, [enabled, onClose, onConfigSaved, projectId, projectName, provider, saving, toast]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Review Agent"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.12, ease: 'easeOut' }}
          onClick={onClose}
        >
          <motion.div
            onClick={(event) => event.stopPropagation()}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              shouldReduceMotion
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 6, scale: 0.995 }
            }
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
            }
            className="w-full max-w-lg transform-gpu rounded-xl border border-gray-200 bg-white shadow-2xl outline-none will-change-transform dark:border-gray-700 dark:bg-gray-900"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 pb-2 pt-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Bug className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Review Agent
                  </h2>
                </div>
                <p className="max-w-md text-xs text-muted-foreground">
                  Choose which tool to review your code automatically on task completion
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                aria-label="Close"
                onClick={onClose}
                size="icon"
                className="text-muted-foreground hover:bg-background/80"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-4 px-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="enable-review"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Enable automatic code review
                  </label>
                  <button
                    id="enable-review"
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    onClick={() => setEnabled(!enabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {enabled && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="review-provider"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Review Tool
                    </label>
                    <Select value={provider} onValueChange={setProvider}>
                      <SelectTrigger id="review-provider" className="w-full">
                        <SelectValue placeholder="Select a review tool" />
                      </SelectTrigger>
                      <SelectContent>
                        {REVIEW_PROVIDERS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Note */}
              <p className="text-xs text-muted-foreground">
                Note: Review will not start if worktree contains multiple tabs
              </p>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ReviewAgentModal;
