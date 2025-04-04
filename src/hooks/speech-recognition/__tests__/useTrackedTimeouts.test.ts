
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
});
