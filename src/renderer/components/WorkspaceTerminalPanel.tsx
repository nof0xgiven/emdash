import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { TerminalPane } from './TerminalPane';
import { Bot, Terminal, Plus, X, Play, ExternalLink } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useWorkspaceTerminals } from '@/lib/workspaceTerminalsStore';
import { cn } from '@/lib/utils';
import {
  COLORS,
  THEME_DARK,
  THEME_LIGHT,
  WORKSPACE_STATUS,
  BUTTON_TYPE_BUTTON,
  ARIA_LABEL_NEW_TERMINAL,
} from '../lib/constants';
import type { ResolvedContainerConfig } from '@shared/container';

interface Workspace {
  id: string;
  name: string;
  branch: string;
  path: string;
  status: (typeof WORKSPACE_STATUS)[keyof typeof WORKSPACE_STATUS];
}

interface Props {
  workspace: Workspace | null;
  className?: string;
}

const WorkspaceTerminalPanelComponent: React.FC<Props> = ({ workspace, className }) => {
  const { effectiveTheme } = useTheme();
  const {
    terminals,
    activeTerminalId,
    activeTerminal,
    createTerminal,
    setActiveTerminal,
    closeTerminal,
  } = useWorkspaceTerminals(workspace?.id ?? null, workspace?.path);

  const [containerConfig, setContainerConfig] = useState<ResolvedContainerConfig | null>(null);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const pendingStartCommandRef = useRef<string | null>(null);
  const startTerminalIdRef = useRef<string | null>(null);

  // Load container config when workspace changes
  useEffect(() => {
    if (!workspace?.path) {
      setContainerConfig(null);
      setDetectedUrl(null);
      return;
    }

    const loadConfig = async () => {
      try {
        const result = await window.electronAPI.loadContainerConfig(workspace.path);
        if (result.ok) {
          setContainerConfig(result.config);
        } else {
          setContainerConfig(null);
        }
      } catch {
        setContainerConfig(null);
      }
    };
    loadConfig();
  }, [workspace?.path]);

  // Reset detected URL when workspace changes
  useEffect(() => {
    setDetectedUrl(null);
    pendingStartCommandRef.current = null;
    startTerminalIdRef.current = null;
    setIsStarting(false);
  }, [workspace?.id]);

  // Send pending start command when active terminal changes
  useEffect(() => {
    if (pendingStartCommandRef.current && activeTerminalId) {
      const command = pendingStartCommandRef.current;
      pendingStartCommandRef.current = null;
      startTerminalIdRef.current = activeTerminalId;
      // Give terminal time to initialize before sending command
      setTimeout(() => {
        window.electronAPI.ptyInput({ id: activeTerminalId, data: `${command}\r` });
      }, 300);
    }
  }, [activeTerminalId]);

  // Listen for URLs in terminal output when starting a service
  useEffect(() => {
    const terminalId = startTerminalIdRef.current;
    if (!isStarting || !terminalId || detectedUrl) return;

    // Patterns to detect URLs and ports in terminal output
    const urlPatterns = [
      // Direct URLs
      /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?/gi,
      // "ready on", "listening on", "started at" patterns
      /(?:ready|listening|running|started|available|server|app)\s+(?:on|at)\s+(?:port\s+)?(\d{4,5})/gi,
      // "port XXXX" pattern
      /(?:on\s+)?port\s*[:=]?\s*(\d{4,5})/gi,
    ];

    const handlePtyData = (data: string) => {
      // Clean ANSI codes for better pattern matching
      const cleanData = data.replace(/\x1b\[[0-9;]*m/g, '');

      for (const pattern of urlPatterns) {
        pattern.lastIndex = 0; // Reset regex state
        const match = pattern.exec(cleanData);
        if (match) {
          let url: string;
          if (match[0].startsWith('http')) {
            url = match[0];
          } else if (match[1]) {
            // Port number captured
            url = `http://localhost:${match[1]}`;
          } else {
            continue;
          }
          setDetectedUrl(url);
          setIsStarting(false);
          return;
        }
      }
    };

    const cleanup = window.electronAPI.onPtyData(terminalId, handlePtyData);
    return cleanup;
  }, [isStarting, detectedUrl]);

  const handleRunStart = useCallback(() => {
    if (!containerConfig?.start || !workspace?.path || isStarting) return;

    setIsStarting(true);
    setDetectedUrl(null);

    // Store the command to be sent when new terminal becomes active
    pendingStartCommandRef.current = containerConfig.start;
    // Create a new terminal - this will trigger the useEffect above
    createTerminal();
  }, [containerConfig, workspace?.path, isStarting, createTerminal]);

  const handleOpenInBrowser = useCallback(() => {
    if (!detectedUrl) return;
    // Use BrowserPane context or emit event to open URL
    window.dispatchEvent(new CustomEvent('browser:navigate', { detail: { url: detectedUrl } }));
  }, [detectedUrl]);

  const themeOverride = useMemo(
    () =>
      effectiveTheme === THEME_DARK
        ? {
            background: COLORS.ZINC_950,
            foreground: COLORS.WHITE,
            cursor: COLORS.WHITE,
            selectionBackground: `${COLORS.WHITE}33`,
            black: COLORS.ZINC_950,
            red: COLORS.WHITE,
            green: COLORS.WHITE,
            yellow: COLORS.WHITE,
            blue: COLORS.WHITE,
            magenta: COLORS.WHITE,
            cyan: COLORS.WHITE,
            white: COLORS.WHITE,
            brightBlack: COLORS.WHITE,
            brightRed: COLORS.WHITE,
            brightGreen: COLORS.WHITE,
            brightYellow: COLORS.WHITE,
            brightBlue: COLORS.WHITE,
            brightMagenta: COLORS.WHITE,
            brightCyan: COLORS.WHITE,
            brightWhite: COLORS.WHITE,
          }
        : {
            background: COLORS.WHITE,
            foreground: '#000000',
            cursor: '#000000',
            selectionBackground: '#00000033',
            black: COLORS.WHITE,
            red: '#000000',
            green: '#000000',
            yellow: '#000000',
            blue: '#000000',
            magenta: '#000000',
            cyan: '#000000',
            white: '#000000',
            brightBlack: '#000000',
            brightRed: '#000000',
            brightGreen: '#000000',
            brightYellow: '#000000',
            brightBlue: '#000000',
            brightMagenta: '#000000',
            brightCyan: '#000000',
            brightWhite: '#000000',
          },
    [effectiveTheme]
  );

  if (!workspace) {
    return (
      <div
        className={`flex h-full flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 ${className}`}
      >
        <Bot className="mb-2 h-8 w-8 text-gray-400" />
        <h3 className="mb-1 text-sm text-gray-600 dark:text-gray-400">No Workspace Selected</h3>
        <p className="text-center text-xs text-gray-500 dark:text-gray-500">
          Select a workspace to view its terminal
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="flex items-center border-b border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="flex min-w-0 flex-1 items-center space-x-1 overflow-x-auto">
          {terminals.map((terminal) => {
            const isActive = terminal.id === activeTerminalId;
            return (
              <button
                key={terminal.id}
                type={BUTTON_TYPE_BUTTON}
                onClick={() => setActiveTerminal(terminal.id)}
                className={cn(
                  'group flex items-center space-x-1 rounded px-2 py-1 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-background text-foreground shadow-sm dark:bg-zinc-800 dark:text-gray-50'
                    : 'text-muted-foreground hover:bg-background/70 dark:hover:bg-zinc-800'
                )}
                title={terminal.title}
              >
                <Terminal className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[130px] truncate">{terminal.title}</span>
                {terminals.length > 1 ? (
                  <span
                    role={BUTTON_TYPE_BUTTON}
                    tabIndex={-1}
                    onClick={(event) => {
                      event.stopPropagation();
                      closeTerminal(terminal.id);
                    }}
                    className="flex h-4 w-4 items-center justify-center rounded opacity-60 transition-opacity hover:bg-muted hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {containerConfig?.start && (
          <button
            type={BUTTON_TYPE_BUTTON}
            onClick={detectedUrl ? handleOpenInBrowser : handleRunStart}
            disabled={isStarting && !detectedUrl}
            className={cn(
              'ml-2 flex h-6 w-6 items-center justify-center rounded border border-transparent transition',
              detectedUrl
                ? 'text-green-600 hover:border-green-600/50 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/50'
                : isStarting
                  ? 'cursor-wait text-muted-foreground/50'
                  : 'text-muted-foreground hover:border-border hover:bg-background dark:hover:bg-zinc-800'
            )}
            title={detectedUrl ? `Open ${detectedUrl} in browser` : `Run: ${containerConfig.start}`}
          >
            {detectedUrl ? <ExternalLink className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        )}
        <button
          type={BUTTON_TYPE_BUTTON}
          onClick={() => createTerminal()}
          className="ml-2 flex h-6 w-6 items-center justify-center rounded border border-transparent text-muted-foreground transition hover:border-border hover:bg-background dark:hover:bg-zinc-800"
          title={ARIA_LABEL_NEW_TERMINAL}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div
        className={cn(
          'bw-terminal relative flex-1 overflow-hidden',
          effectiveTheme === THEME_DARK ? 'bg-zinc-950' : 'bg-white'
        )}
      >
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            className={cn(
              'absolute inset-0 h-full w-full transition-opacity',
              terminal.id === activeTerminalId ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
          >
            <TerminalPane
              id={terminal.id}
              cwd={terminal.cwd || workspace.path}
              variant={effectiveTheme === THEME_DARK ? THEME_DARK : THEME_LIGHT}
              themeOverride={themeOverride}
              className="h-full w-full"
              keepAlive
            />
          </div>
        ))}
        {!terminals.length || !activeTerminal ? (
          <div className="flex h-full flex-col items-center justify-center text-xs text-muted-foreground">
            <p>No terminal found.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
export const WorkspaceTerminalPanel = React.memo(WorkspaceTerminalPanelComponent);

export default WorkspaceTerminalPanel;
