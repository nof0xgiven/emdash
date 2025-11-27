import { useMemo, useSyncExternalStore } from 'react';
import { isValidProviderId } from '@shared/providers/registry';
import type { Provider } from '../types';

type ProviderTab = {
  id: string;
  provider: Provider;
  createdAt: number;
  isReview?: boolean;
};

type WorkspaceProviderTabsState = {
  tabs: ProviderTab[];
  activeId: string | null;
};

const STORAGE_PREFIX = 'emdash:providerTabs:v1';

const workspaceStates = new Map<string, WorkspaceProviderTabsState>();
const workspaceListeners = new Map<string, Set<() => void>>();
const workspaceSnapshots = new Map<string, WorkspaceProviderTabsState>();

const EMPTY_STATE: WorkspaceProviderTabsState = {
  tabs: [],
  activeId: null,
};

const storageAvailable = (() => {
  if (typeof window === 'undefined') return false;
  try {
    const key = '__emdash_provider_tabs__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
})();

function storageKey(workspaceId: string) {
  return `${STORAGE_PREFIX}:${workspaceId}`;
}

function normalizeProvider(provider: any, fallback: Provider): Provider {
  if (isValidProviderId(provider)) return provider as Provider;
  if (isValidProviderId(fallback)) return fallback;
  return 'codex';
}

function cloneState(state: WorkspaceProviderTabsState): WorkspaceProviderTabsState {
  return {
    tabs: state.tabs.map((tab) => ({ ...tab })),
    activeId: state.activeId,
  };
}

function ensureSnapshot(workspaceId: string, state: WorkspaceProviderTabsState) {
  const current = workspaceSnapshots.get(workspaceId);
  if (!current || current.tabs !== state.tabs || current.activeId !== state.activeId) {
    workspaceSnapshots.set(workspaceId, state);
  }
  return workspaceSnapshots.get(workspaceId)!;
}

function loadFromStorage(workspaceId: string): WorkspaceProviderTabsState | null {
  if (!storageAvailable) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(workspaceId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const fallback: Provider = 'codex';
    const tabs: ProviderTab[] = Array.isArray(parsed.tabs)
      ? parsed.tabs
          .map((item: any) => {
            const provider = normalizeProvider(item?.provider, fallback);
            const id = typeof item?.id === 'string' && item.id.trim() ? item.id.trim() : provider;
            if (!isValidProviderId(provider)) return null;
            return {
              id,
              provider,
              createdAt:
                typeof item?.createdAt === 'number' && Number.isFinite(item.createdAt)
                  ? item.createdAt
                  : Date.now(),
            } satisfies ProviderTab;
          })
          .filter((tab: ProviderTab | null): tab is ProviderTab => Boolean(tab))
      : [];

    // Deduplicate by provider+isReview composite key, preserving order
    const seen = new Set<string>();
    const unique = tabs.filter((tab) => {
      const key = `${tab.provider}:${tab.isReview ? 'review' : 'normal'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!unique.length) return null;

    const activeId =
      typeof parsed.activeId === 'string' && unique.some((tab) => tab.id === parsed.activeId)
        ? (parsed.activeId as string)
        : unique[0].id;

    return { tabs: unique, activeId };
  } catch {
    return null;
  }
}

function saveToStorage(workspaceId: string, state: WorkspaceProviderTabsState) {
  if (!storageAvailable) return;
  try {
    window.localStorage.setItem(storageKey(workspaceId), JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function createDefaultState(workspaceId: string, fallbackProvider: Provider): WorkspaceProviderTabsState {
  const provider = normalizeProvider(fallbackProvider, 'codex');
  const tab: ProviderTab = {
    id: provider,
    provider,
    createdAt: Date.now(),
  };
  const state: WorkspaceProviderTabsState = {
    tabs: [tab],
    activeId: tab.id,
  };
  workspaceStates.set(workspaceId, state);
  ensureSnapshot(workspaceId, state);
  saveToStorage(workspaceId, state);
  return state;
}

function ensureWorkspaceState(
  workspaceId: string,
  fallbackProvider: Provider
): WorkspaceProviderTabsState {
  let state = workspaceStates.get(workspaceId);
  if (state) {
    ensureSnapshot(workspaceId, state);
    return state;
  }

  state = loadFromStorage(workspaceId) ?? createDefaultState(workspaceId, fallbackProvider);
  workspaceStates.set(workspaceId, state);
  ensureSnapshot(workspaceId, state);
  return state;
}

function emit(workspaceId: string) {
  const listeners = workspaceListeners.get(workspaceId);
  if (!listeners) return;
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // ignore listener errors
    }
  }
}

function updateWorkspaceState(
  workspaceId: string,
  fallbackProvider: Provider,
  mutate: (draft: WorkspaceProviderTabsState) => void
) {
  const current = ensureWorkspaceState(workspaceId, fallbackProvider);
  const draft = cloneState(current);
  mutate(draft);

  // Normalize providers and dedupe by provider+isReview composite key
  const seen = new Set<string>();
  draft.tabs = draft.tabs
    .map((tab) => ({
      ...tab,
      provider: normalizeProvider(tab.provider, fallbackProvider),
    }))
    .filter((tab) => {
      if (!isValidProviderId(tab.provider)) return false;
      const key = `${tab.provider}:${tab.isReview ? 'review' : 'normal'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (!draft.tabs.length) {
    const reset = createDefaultState(workspaceId, fallbackProvider);
    emit(workspaceId);
    return;
  }

  if (!draft.activeId || !draft.tabs.some((tab) => tab.id === draft.activeId)) {
    draft.activeId = draft.tabs[0].id;
  }

  workspaceStates.set(workspaceId, draft);
  ensureSnapshot(workspaceId, draft);
  saveToStorage(workspaceId, draft);
  emit(workspaceId);
}

function addTab(workspaceId: string, provider: Provider, fallbackProvider: Provider) {
  if (!isValidProviderId(provider)) return;
  updateWorkspaceState(workspaceId, fallbackProvider, (draft) => {
    const exists = draft.tabs.some((tab) => tab.provider === provider && !tab.isReview);
    if (exists) {
      const existing = draft.tabs.find((tab) => tab.provider === provider && !tab.isReview);
      if (existing) draft.activeId = existing.id;
      return;
    }
    const tab: ProviderTab = {
      id: provider,
      provider,
      createdAt: Date.now(),
    };
    draft.tabs = [...draft.tabs, tab];
    draft.activeId = tab.id;
  });
}

function addReviewTab(workspaceId: string, provider: Provider, fallbackProvider: Provider): string {
  if (!isValidProviderId(provider)) return '';
  const reviewTabId = `${provider}-review`;
  updateWorkspaceState(workspaceId, fallbackProvider, (draft) => {
    const exists = draft.tabs.some((tab) => tab.isReview && tab.provider === provider);
    if (exists) {
      const existing = draft.tabs.find((tab) => tab.isReview && tab.provider === provider);
      if (existing) draft.activeId = existing.id;
      return;
    }
    const tab: ProviderTab = {
      id: reviewTabId,
      provider,
      createdAt: Date.now(),
      isReview: true,
    };
    draft.tabs = [...draft.tabs, tab];
    draft.activeId = tab.id;
  });
  return reviewTabId;
}

function getReviewTab(workspaceId: string, fallbackProvider: Provider): ProviderTab | null {
  const state = ensureWorkspaceState(workspaceId, fallbackProvider);
  return state.tabs.find((tab) => tab.isReview) ?? null;
}

function closeReviewTab(workspaceId: string, fallbackProvider: Provider) {
  const state = ensureWorkspaceState(workspaceId, fallbackProvider);
  const reviewTab = state.tabs.find((tab) => tab.isReview);
  if (!reviewTab) return;
  closeTab(workspaceId, reviewTab.id, fallbackProvider);
}

function setActive(workspaceId: string, tabId: string, fallbackProvider: Provider) {
  updateWorkspaceState(workspaceId, fallbackProvider, (draft) => {
    if (draft.tabs.some((tab) => tab.id === tabId)) {
      draft.activeId = tabId;
    }
  });
}

function closeTab(workspaceId: string, tabId: string, fallbackProvider: Provider) {
  const state = ensureWorkspaceState(workspaceId, fallbackProvider);
  if (state.tabs.length <= 1) return;
  const idx = state.tabs.findIndex((tab) => tab.id === tabId);
  if (idx === -1) return;

  updateWorkspaceState(workspaceId, fallbackProvider, (draft) => {
    draft.tabs = draft.tabs.filter((tab) => tab.id !== tabId);
    if (draft.activeId === tabId) {
      const fallback = draft.tabs[idx] ?? draft.tabs[idx - 1] ?? draft.tabs[0];
      draft.activeId = fallback?.id ?? null;
    }
  });
}

function subscribe(
  workspaceId: string | null,
  fallbackProvider: Provider,
  listener: () => void
): () => void {
  if (!workspaceId) {
    return () => undefined;
  }
  ensureWorkspaceState(workspaceId, fallbackProvider);
  let set = workspaceListeners.get(workspaceId);
  if (!set) {
    set = new Set();
    workspaceListeners.set(workspaceId, set);
  }
  set.add(listener);
  return () => {
    const listeners = workspaceListeners.get(workspaceId);
    if (!listeners) return;
    listeners.delete(listener);
    if (listeners.size === 0) {
      workspaceListeners.delete(workspaceId);
    }
  };
}

function getSnapshot(
  workspaceId: string | null,
  fallbackProvider: Provider
): WorkspaceProviderTabsState {
  if (!workspaceId) return EMPTY_STATE;
  const state = ensureWorkspaceState(workspaceId, fallbackProvider);
  return ensureSnapshot(workspaceId, state);
}

export function useWorkspaceProviderTabs(
  workspaceId: string,
  preferredProvider: Provider
): {
  tabs: ProviderTab[];
  activeTabId: string | null;
  activeTab: ProviderTab | null;
  reviewTab: ProviderTab | null;
  openProviderTab: (provider: Provider) => void;
  openReviewTab: (provider: Provider) => string;
  setActiveTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  closeReviewTab: () => void;
} {
  const fallback = useMemo(
    () => (isValidProviderId(preferredProvider) ? preferredProvider : 'codex'),
    [preferredProvider]
  );

  const snapshot = useSyncExternalStore(
    (listener) => subscribe(workspaceId, fallback, listener),
    () => getSnapshot(workspaceId, fallback),
    () => getSnapshot(workspaceId, fallback)
  );

  const actions = useMemo(() => {
    if (!workspaceId) {
      return {
        openProviderTab: (_provider: Provider) => undefined,
        openReviewTab: (_provider: Provider) => '',
        setActiveTab: (_tabId: string) => undefined,
        closeTab: (_tabId: string) => undefined,
        closeReviewTab: () => undefined,
      };
    }
    return {
      openProviderTab: (provider: Provider) => addTab(workspaceId, provider, fallback),
      openReviewTab: (provider: Provider) => addReviewTab(workspaceId, provider, fallback),
      setActiveTab: (tabId: string) => setActive(workspaceId, tabId, fallback),
      closeTab: (tabId: string) => closeTab(workspaceId, tabId, fallback),
      closeReviewTab: () => closeReviewTab(workspaceId, fallback),
    };
  }, [workspaceId, fallback]);

  const activeTab =
    snapshot.tabs.find((tab) => tab.id === snapshot.activeId) ?? snapshot.tabs[0] ?? null;

  const reviewTab = snapshot.tabs.find((tab) => tab.isReview) ?? null;

  return {
    tabs: snapshot.tabs,
    activeTabId: snapshot.activeId,
    activeTab,
    reviewTab,
    ...actions,
  };
}

/**
 * Opens a review tab for the given workspace and provider.
 * This is a standalone function that can be called outside of React components.
 * It updates the in-memory store and persists to localStorage.
 */
export function openReviewTabForWorkspace(
  workspaceId: string,
  provider: Provider,
  fallbackProvider: Provider = 'codex'
): string {
  return addReviewTab(workspaceId, provider, fallbackProvider);
}

export type { ProviderTab };
