import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import Badge from './ui/badge';
import { FileText, GitBranch, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { useFileChanges } from '@/hooks/useFileChanges';
import { useFileDiff } from '@/hooks/useFileDiff';
import { usePrStatus } from '@/hooks/usePrStatus';
import { getStatus } from '@/lib/kanbanStore';
import type { Workspace } from '@/types/app';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/hooks/useTheme';

interface ReviewTabProps {
  workspace: Workspace;
}

const ReviewTab: React.FC<ReviewTabProps> = ({ workspace }) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const { effectiveTheme } = useTheme();
  const kanbanStatus = getStatus(workspace.id);

  // Only show review tab when workspace is in "done" (review) status
  if (kanbanStatus !== 'done') {
    return null;
  }

  const {
    totalAdditions,
    totalDeletions,
    isLoading: isLoadingChanges,
    changes,
  } = useFileChanges(workspace.path, workspace.id);
  const { diff, isLoading: isLoadingDiff } = useFileDiff(
    selectedFile || workspace.path,
    selectedFile !== null
  );
  const { pr, isLoading: isLoadingPr } = usePrStatus(workspace.path);

  const handleCreatePR = async () => {
    try {
      const result = await (window as any).electronAPI?.createPR?.({
        workspacePath: workspace.path,
      });
      if (result?.success) {
        // Refresh PR status
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to create PR:', error);
    }
  };

  const handleViewPR = () => {
    if (pr?.url) {
      (window as any).electronAPI?.openExternal?.(pr.url);
    }
  };

  const handleFileClick = (filePath: string) => {
    setSelectedFile(filePath);
  };

  if (isLoadingChanges) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading changes...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-4">
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <h2 className="text-lg font-semibold">Code Review</h2>
          <Badge variant="outline" className="ml-auto">
            Ready for Review
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Review your changes before creating a pull request
        </p>
      </div>

      {/* Summary Section */}
      <Card className="mb-4">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Changes Summary</CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="font-mono text-green-600">+{totalAdditions}</span>
              <span className="text-muted-foreground">additions</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-red-600">-{totalDeletions}</span>
              <span className="text-muted-foreground">deletions</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="font-mono">{changes.length}</span>
              <span className="text-muted-foreground">files changed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Changes List */}
      <Card className="mb-4">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">File Changes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {changes.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No changes found</div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {changes.map((change) => (
                <div
                  key={change.path}
                  className={`flex cursor-pointer items-center justify-between border-b border-border px-3 py-2 text-sm hover:bg-muted/50 ${
                    selectedFile === change.path ? 'bg-muted' : ''
                  }`}
                  onClick={() => handleFileClick(change.path)}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <GitBranch className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate font-mono text-xs">{change.path}</span>
                    <Badge variant="outline" size="sm">
                      {change.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                    {change.additions > 0 && (
                      <span className="text-green-600">+{change.additions}</span>
                    )}
                    {change.deletions > 0 && (
                      <span className="text-red-600">-{change.deletions}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diff Viewer */}
      {selectedFile && (
        <Card className="mb-4 min-h-0 flex-1">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Diff: {selectedFile}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingDiff ? (
              <div className="flex items-center justify-center p-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </div>
            ) : diff ? (
              <div className="max-h-64 overflow-y-auto">
                <SyntaxHighlighter
                  language="typescript"
                  style={effectiveTheme === 'dark' ? oneDark : oneLight}
                  className="text-xs"
                  codeTagProps={{
                    className: 'font-mono text-xs',
                  }}
                  customStyle={{
                    margin: 0,
                    padding: '0.75rem',
                    background: effectiveTheme === 'dark' ? '#09090b' : '#ffffff',
                  }}
                >
                  {diff}
                </SyntaxHighlighter>
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No diff available for this file
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PR Section */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Pull Request</CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          {isLoadingPr ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading PR status...
            </div>
          ) : pr ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-sm font-medium">Pull Request #{pr.number}</div>
                  <div className="text-xs text-muted-foreground">{pr.title}</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleViewPR} className="gap-1">
                <ExternalLink className="h-3 w-3" />
                View PR
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <div className="text-sm">No pull request found</div>
              </div>
              <Button variant="default" size="sm" onClick={handleCreatePR}>
                <GitBranch className="mr-1 h-3 w-3" />
                Create Pull Request
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for variant changes
const VariantChangesIfAny: React.FC<{ path: string; className?: string }> = ({
  path,
  className,
}) => {
  const { changes, isLoading } = useFileChanges(path);

  if (isLoading || changes.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <FileChangesPanel workspaceId={path} />
    </div>
  );
};

export default ReviewTab;
