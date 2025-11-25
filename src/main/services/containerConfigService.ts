import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import path from 'node:path';

import {
  ContainerConfigError,
  ContainerConfigFile,
  PackageManager,
  ResolvedContainerConfig,
  resolveContainerConfig,
} from '@shared/container';

const CONFIG_RELATIVE_PATH = path.join('.emdash', 'config.json');

const PACKAGE_MANAGER_LOCKFILES: Array<{ file: string; manager: PackageManager }> = [
  { file: 'pnpm-lock.yaml', manager: 'pnpm' },
  { file: 'yarn.lock', manager: 'yarn' },
  { file: 'package-lock.json', manager: 'npm' },
  { file: 'npm-shrinkwrap.json', manager: 'npm' },
];

export type ContainerConfigLoadErrorCode = 'INVALID_JSON' | 'VALIDATION_FAILED' | 'IO_ERROR';

export class ContainerConfigLoadError extends Error {
  readonly code: ContainerConfigLoadErrorCode;
  readonly configPath?: string;
  readonly configKey?: string;
  readonly cause?: unknown;

  constructor(
    code: ContainerConfigLoadErrorCode,
    message: string,
    options: { configPath?: string; configKey?: string; cause?: unknown } = {}
  ) {
    super(message);
    this.name = 'ContainerConfigLoadError';
    this.code = code;
    this.configPath = options.configPath;
    this.configKey = options.configKey;
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

export interface ContainerConfigLoadSuccess {
  ok: true;
  config: ResolvedContainerConfig;
  sourcePath: string | null;
}

export interface ContainerConfigLoadFailure {
  ok: false;
  error: ContainerConfigLoadError;
}

export type ContainerConfigLoadResult = ContainerConfigLoadSuccess | ContainerConfigLoadFailure;

export async function loadWorkspaceContainerConfig(
  workspacePath: string
): Promise<ContainerConfigLoadResult> {
  const configPath = path.join(workspacePath, CONFIG_RELATIVE_PATH);
  const inferredPackageManager = inferPackageManager(workspacePath);

  const readResult = await readConfigFile(configPath);
  if (readResult.error) {
    return { ok: false, error: readResult.error };
  }

  let parsedConfig: unknown = {};
  let sourcePath: string | null = null;
  if (readResult.content != null) {
    const parseResult = parseConfigJson(readResult.content, configPath);
    if (parseResult.error) {
      return { ok: false, error: parseResult.error };
    }
    parsedConfig = parseResult.value;
    sourcePath = configPath;
  }

  try {
    const resolved = resolveContainerConfig(parsedConfig, {
      inferredPackageManager,
    });
    return { ok: true, config: resolved, sourcePath };
  } catch (error) {
    if (error instanceof ContainerConfigError) {
      return {
        ok: false,
        error: new ContainerConfigLoadError('VALIDATION_FAILED', error.message, {
          configPath: sourcePath ?? configPath,
          configKey: error.path,
          cause: error,
        }),
      };
    }
    throw error;
  }
}

function inferPackageManager(workspacePath: string): PackageManager | undefined {
  for (const { file, manager } of PACKAGE_MANAGER_LOCKFILES) {
    const candidate = path.join(workspacePath, file);
    if (fs.existsSync(candidate)) {
      return manager;
    }
  }
  return undefined;
}

async function readConfigFile(
  configPath: string
): Promise<{ content: string | null; error: ContainerConfigLoadError | null }> {
  try {
    const content = await fsp.readFile(configPath, 'utf8');
    return { content, error: null };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return { content: null, error: null };
    }
    return {
      content: null,
      error: new ContainerConfigLoadError(
        'IO_ERROR',
        `Failed to read ${configPath}: ${err.message}`,
        {
          configPath,
          cause: error,
        }
      ),
    };
  }
}

function parseConfigJson(
  content: string,
  configPath: string
): { value: unknown; error: ContainerConfigLoadError | null } {
  try {
    const parsed = JSON.parse(content);
    return { value: parsed, error: null };
  } catch (error) {
    return {
      value: null,
      error: new ContainerConfigLoadError('INVALID_JSON', `Invalid JSON in ${configPath}`, {
        configPath,
        cause: error,
      }),
    };
  }
}

export function inferPackageManagerForWorkspace(workspacePath: string): PackageManager | undefined {
  return inferPackageManager(workspacePath);
}

export interface ContainerConfigSaveSuccess {
  ok: true;
}

export interface ContainerConfigSaveFailure {
  ok: false;
  error: ContainerConfigLoadError;
}

export type ContainerConfigSaveResult = ContainerConfigSaveSuccess | ContainerConfigSaveFailure;

export async function saveWorkspaceContainerConfig(
  workspacePath: string,
  config: ContainerConfigFile
): Promise<ContainerConfigSaveResult> {
  const configPath = path.join(workspacePath, CONFIG_RELATIVE_PATH);
  const configDir = path.dirname(configPath);

  try {
    // Ensure .emdash directory exists
    await fsp.mkdir(configDir, { recursive: true });

    // Read existing config to preserve any fields we don't manage
    let existingConfig: Record<string, unknown> = {};
    try {
      const content = await fsp.readFile(configPath, 'utf8');
      existingConfig = JSON.parse(content);
    } catch {
      // File doesn't exist or invalid JSON - start fresh
    }

    // Merge new config with existing, preserving unknown fields
    const mergedConfig = {
      ...existingConfig,
      ...config,
    };

    // Remove undefined values for cleaner output
    const cleanConfig = Object.fromEntries(
      Object.entries(mergedConfig).filter(([_, v]) => v !== undefined)
    );

    // Write config with pretty formatting
    const content = JSON.stringify(cleanConfig, null, 2) + '\n';
    await fsp.writeFile(configPath, content, 'utf8');

    return { ok: true };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return {
      ok: false,
      error: new ContainerConfigLoadError(
        'IO_ERROR',
        `Failed to save ${configPath}: ${err.message}`,
        { configPath, cause: error }
      ),
    };
  }
}
