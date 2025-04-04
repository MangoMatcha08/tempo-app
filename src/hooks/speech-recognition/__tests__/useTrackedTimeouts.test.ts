
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTrackedTimeouts } from '@/hooks/use-tracked-timeouts';

describe('useTrackedTimeouts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should create and execute a timeout', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useTrackedTimeouts());
    
    // Create a timeout
    act(() => {
      result.current.createTimeout(callback, 1000);
    });
    
    // Callback should not have been called yet
    expect(callback).not.toHaveBeenCalled();
    
    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // Callback should have been called
    expect(callback).toHaveBeenCalledTimes(1);
  });
  
  it('should clear a specific timeout', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useTrackedTimeouts());
    
    let timeoutId: number;
    
    // Create a timeout and store its ID
    act(() => {
      timeoutId = result.current.createTimeout(callback, 1000);
    });
    
    // Clear the timeout
    act(() => {
      result.current.clearTrackedTimeout(timeoutId);
    });
    
    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    // Callback should not have been called
    expect(callback).not.toHaveBeenCalled();
  });
  
  it('should clear all timeouts', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const { result } = renderHook(() => useTrackedTimeouts());
    
    // Create multiple timeouts
    act(() => {
      result.current.createTimeout(callback1, 1000);
      result.current.createTimeout(callback2, 2000);
    });
    
    // Clear all timeouts
    act(() => {
      result.current.clearAllTimeouts();
    });
    
    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    // No callbacks should have been called
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });
  
  it('should not call callback if component unmounted', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useTrackedTimeouts());
    
    // Create a timeout
    act(() => {
      result.current.createTimeout(callback, 1000);
    });
    
    // Unmount the component
    unmount();
    
    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // Callback should not have been called
    expect(callback).not.toHaveBeenCalled();
  });
  
  it('should track mounted status correctly', () => {
    const { result, unmount } = renderHook(() => useTrackedTimeouts());
    
    // Component should be mounted
    expect(result.current.isMounted()).toBe(true);
    
    // Unmount the component
    unmount();
    
    // Component should be unmounted
    expect(result.current.isMounted()).toBe(false);
  });
  
  it('should create and execute an interval', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useTrackedTimeouts());
    
    // Create an interval
    act(() => {
      result.current.createInterval(callback, 1000);
    });
    
    // Callback should not have been called yet
    expect(callback).not.toHaveBeenCalled();
    
    // Fast-forward time multiple intervals
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    
    // Callback should have been called multiple times (3 times at 1000, 2000, 3000 ms)
    expect(callback).toHaveBeenCalledTimes(3);
  });
  
  it('should not execute interval callback after unmount', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useTrackedTimeouts());
    
    // Create an interval
    act(() => {
      result.current.createInterval(callback, 1000);
    });
    
    // Advance one interval and verify callback executed
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);
    
    // Unmount the component
    unmount();
    
    // Advance more time
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    // Callback should not have been called again
    expect(callback).toHaveBeenCalledTimes(1);
  });
  
  it('should execute runIfMounted only when mounted', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useTrackedTimeouts());
    
    // Run when mounted - should execute
    act(() => {
      result.current.runIfMounted(callback);
    });
    expect(callback).toHaveBeenCalledTimes(1);
    
    // Unmount the component
    unmount();
    
    // Try to run after unmounted - should not execute
    act(() => {
      result.current.runIfMounted(callback);
    });
    
    // Callback should still only have been called once
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
