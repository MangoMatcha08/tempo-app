
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTrackedTimeouts } from '@/hooks/use-tracked-timeouts';
import { useVoiceRecorderStateMachine } from '../useVoiceRecorderStateMachine';

describe('Resource Management', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should clean up timeouts when unmounted', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useTrackedTimeouts());
    
    // Create a timeout
    act(() => {
      result.current.createTimeout(callback, 5000);
    });
    
    // Unmount before timeout fires
    unmount();
    
    // Advance time past when the timeout would have fired
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    
    // Callback should not have been called
    expect(callback).not.toHaveBeenCalled();
  });
  
  it('state machine should handle errors with auto-reset', () => {
    const { result } = renderHook(() => useVoiceRecorderStateMachine());
    
    // Trigger an error
    act(() => {
      result.current.actions.startRecording();
      result.current.actions.permissionGranted();
      result.current.actions.recognitionError("Test error");
    });
    
    // Verify we're in error state
    expect(result.current.state.status).toBe('error');
    expect(result.current.state).toHaveProperty('message', 'Test error');
    
    // Processing error should auto-reset after 5 seconds
    act(() => {
      result.current.actions.processingError("Processing error");
    });
    
    expect(result.current.state.status).toBe('error');
    
    // Advance time to trigger auto-reset
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    // Should have reset to idle
    expect(result.current.state.status).toBe('idle');
  });
});
