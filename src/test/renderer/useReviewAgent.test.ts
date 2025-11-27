import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { REVIEW_PROMPT, useReviewAgent } from '../../renderer/hooks/useReviewAgent';
import { clearReviewPending, isReviewPending, setReviewPending } from '../../renderer/lib/kanbanStore';

const { toastMock, openReviewTabForWorkspace } = vi.hoisted(() => ({
  toastMock: vi.fn(),
  openReviewTabForWorkspace: vi.fn(() => 'review-tab'),
}));

vi.mock('../../renderer/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('../../renderer/lib/workspaceProviderTabs', () => ({
  openReviewTabForWorkspace,
}));

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  get length() {
    return this.store.size;
  }
}

const localStorageMock = new MemoryStorage();

type UseReviewAgentOptions = Parameters<typeof useReviewAgent>[0];

function renderUseReviewAgent(options: UseReviewAgentOptions) {
  const resultRef: { current: ReturnType<typeof useReviewAgent> | null } = { current: null };
  let renderer: TestRenderer.ReactTestRenderer | null = null;

  const TestComponent = (props: { opts: UseReviewAgentOptions }) => {
    const hookValue = useReviewAgent(props.opts);
    React.useEffect(() => {
      resultRef.current = hookValue;
    }, [hookValue]);
    return null;
  };

  act(() => {
    renderer = TestRenderer.create(React.createElement(TestComponent, { opts: options }));
  });

  return {
    result: resultRef,
    rerender: (next: UseReviewAgentOptions) =>
      act(() => renderer?.update(React.createElement(TestComponent, { opts: next }))),
    unmount: () => act(() => renderer?.unmount()),
  };
}

const baseProject = {
  id: 'p1',
  name: 'Example',
  path: '/tmp/project',
  gitInfo: { isGitRepo: false },
  reviewAgentConfig: { enabled: true, provider: 'claude' },
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  (globalThis as any).localStorage = localStorageMock as any;
  (globalThis as any).window = { localStorage: localStorageMock };
  clearReviewPending('ws-auto');
  clearReviewPending('ws-manual');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useReviewAgent auto-start', () => {
  it('auto-starts review when pending even if multiple non-review tabs are open', async () => {
    vi.useFakeTimers();
    const workspaceId = 'ws-auto';

    // Multiple non-review tabs would normally block manual start
    localStorageMock.setItem(
      `emdash:providerTabs:v1:${workspaceId}`,
      JSON.stringify({
        tabs: [
          { id: 'codex', provider: 'codex' },
          { id: 'openai', provider: 'openai' },
        ],
        activeId: 'codex',
      })
    );

    setReviewPending(workspaceId, true);

    const { result, unmount } = renderUseReviewAgent({
      project: baseProject,
      workspaceId,
      workspacePath: '/tmp/ws-auto',
      autoStart: true,
    });

    expect(result.current?.canStartReview).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(openReviewTabForWorkspace).toHaveBeenCalledWith(workspaceId, 'claude', 'claude');
    expect(localStorageMock.getItem(`emdash:reviewPrompt:${workspaceId}`)).toBe(REVIEW_PROMPT);
    expect(isReviewPending(workspaceId)).toBe(false);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Review started' })
    );

    unmount();
  });

  it('keeps manual start gated when multiple non-review tabs are open', () => {
    const workspaceId = 'ws-manual';
    localStorageMock.setItem(
      `emdash:providerTabs:v1:${workspaceId}`,
      JSON.stringify({
        tabs: [
          { id: 'codex', provider: 'codex' },
          { id: 'openai', provider: 'openai' },
        ],
        activeId: 'codex',
      })
    );

    const { result, unmount } = renderUseReviewAgent({
      project: baseProject,
      workspaceId,
      workspacePath: '/tmp/ws-manual',
      autoStart: false,
    });

    expect(result.current?.canStartReview).toBe(false);

    act(() => {
      result.current?.startReview();
    });

    expect(openReviewTabForWorkspace).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Cannot start review',
      })
    );
    expect(localStorageMock.getItem(`emdash:reviewPrompt:${workspaceId}`)).toBeNull();

    unmount();
  });
});
