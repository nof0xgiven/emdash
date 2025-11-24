import React from 'react';
import { Run } from '../types';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
const COST_DECIMALS = 4;

const RUN_STATUS = {
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

const PROVIDER_ID = {
  CLAUDE: 'claude-code',
  OPENAI: 'openai-agents',
} as const;

const PROVIDER_LABEL = {
  [PROVIDER_ID.CLAUDE]: 'Claude',
  [PROVIDER_ID.OPENAI]: 'OpenAI',
} as const;

const STATUS_COLORS = {
  RUNNING: 'text-white',
  COMPLETED: 'text-green-400',
  FAILED: 'text-red-400',
  CANCELLED: 'text-gray-400',
  DEFAULT: 'text-yellow-400',
} as const;

interface RunListProps {
  runs: Run[];
  selectedRun: Run | null;
  onRunSelect: (run: Run) => void;
}

const RunList: React.FC<RunListProps> = ({ runs, selectedRun, onRunSelect }) => {
  const formatDuration = (startedAt: string, finishedAt?: string | null) => {
    const start = new Date(startedAt);
    const end = finishedAt ? new Date(finishedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / MS_PER_MINUTE);
    const diffSecs = Math.floor((diffMs % MS_PER_MINUTE) / MS_PER_SECOND);

    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`;
    }
    return `${diffSecs}s`;
  };

  const getStatusColor = (runStatus: Run['status']) => {
    switch (runStatus) {
      case RUN_STATUS.RUNNING:
        return STATUS_COLORS.RUNNING;
      case RUN_STATUS.COMPLETED:
        return STATUS_COLORS.COMPLETED;
      case RUN_STATUS.FAILED:
        return STATUS_COLORS.FAILED;
      case RUN_STATUS.CANCELLED:
        return STATUS_COLORS.CANCELLED;
      default:
        return STATUS_COLORS.DEFAULT;
    }
  };

  const getStatusIcon = (runStatus: Run['status']) => {
    switch (runStatus) {
      case RUN_STATUS.RUNNING:
        return '🔄';
      case RUN_STATUS.COMPLETED:
        return '✅';
      case RUN_STATUS.FAILED:
        return '❌';
      case RUN_STATUS.CANCELLED:
        return '⏹️';
      default:
        return '⏳';
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <h3 className="mb-4 text-lg font-semibold text-white">Active Runs</h3>

        {runs.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-gray-500">No runs found</div>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <div
                key={run.id}
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                  selectedRun?.id === run.id
                    ? 'border-white bg-gray-700'
                    : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                }`}
                onClick={() => onRunSelect(run)}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getStatusIcon(run.status)}</span>
                    <span className={`font-medium ${getStatusColor(run.status)}`}>
                      {run.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-400">
                      {formatDuration(run.startedAt, run.finishedAt)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {PROVIDER_LABEL[run.provider] || run.provider}
                  </div>
                </div>

                <div className="mb-2 text-sm text-gray-300">
                  <strong>Branch:</strong> {run.branch}
                </div>

                <div className="line-clamp-2 text-sm text-gray-400">{run.prompt}</div>

                {run.tokenUsage > 0 && (
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>Tokens: {run.tokenUsage.toLocaleString()}</span>
                    {run.cost > 0 && <span>Cost: ${run.cost.toFixed(COST_DECIMALS)}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RunList;
