import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Rocket, X } from 'lucide-react';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { useToast } from '../hooks/use-toast';

interface ProjectScriptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectPath: string;
  projectName: string;
}

const ProjectScriptsModal: React.FC<ProjectScriptsModalProps> = ({
  isOpen,
  onClose,
  projectPath,
  projectName,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [setupScript, setSetupScript] = useState('');
  const [startScript, setStartScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load existing config when modal opens
  useEffect(() => {
    if (!isOpen || !projectPath) {
      return;
    }

    const loadConfig = async () => {
      setLoading(true);
      try {
        const result = await window.electronAPI.loadContainerConfig(projectPath);
        if (result.ok && result.config) {
          setSetupScript(result.config.setup ?? '');
          setStartScript(result.config.start ?? '');
        }
      } catch (error) {
        console.error('Failed to load container config:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadConfig();
  }, [isOpen, projectPath]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSetupScript('');
      setStartScript('');
      setLoading(false);
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
      const config: { setup?: string; start?: string } = {};

      // Only include non-empty values
      if (setupScript.trim()) {
        config.setup = setupScript.trim();
      }
      if (startScript.trim()) {
        config.start = startScript.trim();
      }

      const result = await window.electronAPI.saveContainerConfig({
        workspacePath: projectPath,
        config,
      });

      if (result.ok) {
        toast({
          title: 'Scripts saved',
          description: `Configuration saved for ${projectName}`,
        });
        onClose();
      } else {
        toast({
          title: 'Failed to save',
          description: result.error?.message ?? 'Unknown error',
          variant: 'destructive' as const,
        });
      }
    } catch (error) {
      console.error('Failed to save container config:', error);
      toast({
        title: 'Failed to save',
        description: 'An unexpected error occurred',
        variant: 'destructive' as const,
      });
    } finally {
      setSaving(false);
    }
  }, [onClose, projectName, projectPath, saving, setupScript, startScript, toast]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Install & Launch Scripts"
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
                  <Rocket className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Install & Launch Scripts
                  </h2>
                </div>
                <p className="max-w-md text-xs text-muted-foreground">
                  Add your install dependencies and start script
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="setup-script"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Setup Script
                    </label>
                    <input
                      id="setup-script"
                      type="text"
                      placeholder="npm install"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:ring-gray-700"
                      value={setupScript}
                      onChange={(e) => setSetupScript(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Runs automatically when creating a new task
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="start-script"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Start Script
                    </label>
                    <input
                      id="start-script"
                      type="text"
                      placeholder="npm run dev"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:ring-gray-700"
                      value={startScript}
                      onChange={(e) => setStartScript(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Runs when you click Play in the terminal
                    </p>
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || loading}
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

export default ProjectScriptsModal;
