import { spawn } from 'node:child_process';
import { log } from '../lib/logger';

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface SetupScriptResult {
  ok: boolean;
  exitCode?: number;
  error?: string;
  output?: string;
}

export interface RunSetupOptions {
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
  onOutput?: (line: string) => void;
}

/**
 * Run a setup script (like npm install) in a blocking manner.
 * Returns when the script completes or times out.
 */
export async function runSetupScript(
  workspacePath: string,
  command: string,
  options: RunSetupOptions = {}
): Promise<SetupScriptResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const env = { ...process.env, ...(options.env ?? {}), BROWSER: 'none' };

  log.info('[setupScript] starting', { workspacePath, command });

  return new Promise((resolve) => {
    const child = spawn(command, [], {
      cwd: workspacePath,
      shell: true,
      env,
    });

    let output = '';
    let killed = false;

    // Timeout handler
    const timer = setTimeout(() => {
      killed = true;
      try {
        child.kill('SIGTERM');
      } catch (e) {
        log.warn('[setupScript] failed to kill process', e);
      }
      log.warn('[setupScript] timed out', { workspacePath, command, timeoutMs });
      resolve({
        ok: false,
        error: `Setup command timed out after ${Math.round(timeoutMs / 1000)}s`,
        output,
      });
    }, timeoutMs);

    const handleData = (data: Buffer) => {
      const text = data.toString();
      output += text;
      if (options.onOutput) {
        // Split by lines and emit each
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          if (line.trim()) {
            options.onOutput(line);
          }
        }
      }
    };

    child.stdout.on('data', handleData);
    child.stderr.on('data', handleData);

    child.on('exit', (code) => {
      clearTimeout(timer);
      if (killed) return;

      const exitCode = code ?? 1;
      if (exitCode === 0) {
        log.info('[setupScript] completed successfully', { workspacePath, command });
        resolve({ ok: true, exitCode, output });
      } else {
        log.warn('[setupScript] failed', { workspacePath, command, exitCode });
        resolve({
          ok: false,
          exitCode,
          error: `Setup command exited with code ${exitCode}`,
          output,
        });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      if (killed) return;
      log.error('[setupScript] spawn error', err);
      resolve({
        ok: false,
        error: err.message,
        output,
      });
    });
  });
}
