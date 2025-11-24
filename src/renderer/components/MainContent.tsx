import React, { useState } from 'react';
import { Repo, Run } from '../types';
import RunLauncher from './RunLauncher';
import RunList from './RunList';
import { FolderOpen } from 'lucide-react';

interface MainContentProps {
  selectedRepo: Repo | null;
  runs: Run[];
  selectedRun: Run | null;
  onRunSelect: (run: Run) => void;
  onCreateRun: (config: any) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  selectedRepo,
  runs,
  selectedRun,
  onRunSelect,
  onCreateRun,
}) => {
  const [showRunLauncher, setShowRunLauncher] = useState(false);

  const handleCreateRun = (config: any) => {
    onCreateRun(config);
    setShowRunLauncher(false);
  };

  if (!selectedRepo) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="mb-8">
            <h1
              className="mb-4 text-6xl font-bold text-white"
              style={{
                fontFamily: 'monospace',
                letterSpacing: '0.1em',
                textShadow: '2px 2px 0px #000',
              }}
            >
              emdash
            </h1>
            <h2 className="text-2xl text-gray-400">Codex</h2>
          </div>

          <div className="flex justify-center gap-6">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:bg-zinc-800">
              <div className="mb-3 flex justify-center">
                <FolderOpen className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Open Project</h3>
              <p className="text-sm text-gray-400">Select a repository to get started</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-950">
      <div className="border-b border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {selectedRepo.path.split('/').pop()}
            </h2>
            <p className="text-sm text-gray-400">{selectedRepo.origin}</p>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded bg-white px-4 py-2 text-black transition-colors hover:bg-gray-200"
              onClick={() => setShowRunLauncher(true)}
            >
              Start Run
            </button>
            <button className="rounded bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600">
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {runs.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-6xl">🤖</div>
              <h3 className="mb-2 text-xl font-semibold text-white">No runs yet</h3>
              <p className="mb-4 text-gray-400">Start your first coding agent run</p>
              <button
                className="rounded-lg bg-white px-6 py-3 text-black transition-colors hover:bg-gray-200"
                onClick={() => setShowRunLauncher(true)}
              >
                Create Run
              </button>
            </div>
          </div>
        ) : (
          <RunList runs={runs} selectedRun={selectedRun} onRunSelect={onRunSelect} />
        )}
      </div>

      {showRunLauncher && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <RunLauncher
            repo={selectedRepo}
            onCreateRun={handleCreateRun}
            onCancel={() => setShowRunLauncher(false)}
          />
        </div>
      )}
    </div>
  );
};

export default MainContent;
