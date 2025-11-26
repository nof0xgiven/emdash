import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useReviewAutoStart } from '@/hooks/useReviewAutoStart';
import * as kanbanStore from '@/lib/kanbanStore';

// Mock the kanban store
vi.mock('@/lib/kanbanStore');

describe('useReviewAutoStart', () => {
  const mockWorkspace = {
    id: 'test-workspace-1',
    name: 'Test Workspace',
    path: '/test/path',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not trigger review when workspace is not in review status', () => {
    let status = 'todo';
    vi.spyOn(kanbanStore, 'getStatus').mockImplementation(() => status);

    const { result } = renderHook(() => useReviewAutoStart(mockWorkspace));

    expect(result.current.shouldShowReview).toBe(false);
    expect(result.current.reviewStarted).toBe(false);
  });

  it('should trigger review when workspace moves to review status', () => {
    let status = 'todo';
    vi.spyOn(kanbanStore, 'getStatus').mockImplementation(() => status);

    const { result, rerender } = renderHook(() => useReviewAutoStart(mockWorkspace));

    expect(result.current.shouldShowReview).toBe(false);
    expect(result.current.reviewStarted).toBe(false);

    // Simulate workspace moving to review status
    status = 'done';
    act(() => {
      rerender();
    });

    expect(result.current.shouldShowReview).toBe(true);
    expect(result.current.reviewStarted).toBe(true);
  });

  it('should not trigger review again if already started', () => {
    let status = 'todo';
    vi.spyOn(kanbanStore, 'getStatus').mockImplementation(() => status);

    const { result, rerender } = renderHook(() => useReviewAutoStart(mockWorkspace));

    // Move to review status
    status = 'done';
    act(() => {
      rerender();
    });

    expect(result.current.reviewStarted).toBe(true);

    // Force re-render to ensure review doesn't start again
    act(() => {
      rerender();
    });

    // Should still be marked as started
    expect(result.current.reviewStarted).toBe(true);
  });

  it('should handle workspace changes', () => {
    const workspace1 = { ...mockWorkspace, id: 'test-1' };
    const workspace2 = { ...mockWorkspace, id: 'test-2' };

    let status1 = 'todo';
    let status2 = 'done';
    vi.spyOn(kanbanStore, 'getStatus').mockImplementation((id) => {
      return id === 'test-1' ? status1 : status2;
    });

    const { result, rerender } = renderHook(({ workspace }) => useReviewAutoStart(workspace), {
      initialProps: { workspace: workspace1 },
    });

    expect(result.current.shouldShowReview).toBe(false);

    // Switch to workspace that is in review status
    rerender({ workspace: workspace2 });

    expect(result.current.shouldShowReview).toBe(true);
    expect(result.current.reviewStarted).toBe(true);
  });

  it('should reset review state when workspace moves back from review', () => {
    let status = 'done';
    vi.spyOn(kanbanStore, 'getStatus').mockImplementation(() => status);

    const { result, rerender } = renderHook(() => useReviewAutoStart(mockWorkspace));

    expect(result.current.shouldShowReview).toBe(true);
    expect(result.current.reviewStarted).toBe(true);

    // Move workspace back to in-progress
    status = 'in-progress';
    act(() => {
      rerender();
    });

    expect(result.current.shouldShowReview).toBe(false);
    // reviewStarted should remain true as it tracks if review was ever started
    expect(result.current.reviewStarted).toBe(true);
  });
});
