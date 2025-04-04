
import { renderHook, act } from '@testing-library/react';
import { useVoiceRecorderStateMachine } from '../useVoiceRecorderStateMachine';
import { vi, describe, it, expect } from 'vitest';

describe('Voice Recorder State Machine', () => {
  it('should start in idle state', () => {
    const { result } = renderHook(() => useVoiceRecorderStateMachine());
    expect(result.current.state.status).toBe('idle');
  });

  it('should transition through the recording flow', () => {
    const { result } = renderHook(() => useVoiceRecorderStateMachine());
    
    // Start recording
    act(() => {
      result.current.actions.startRecording();
    });
    expect(result.current.state.status).toBe('requesting-permission');
    
    // Permission granted
    act(() => {
      result.current.actions.permissionGranted();
    });
    expect(result.current.state.status).toBe('recording');
    
    // Stop recording
    act(() => {
      result.current.actions.stopRecording('Test transcript');
    });
    expect(result.current.state.status).toBe('processing');
    expect(result.current.state).toHaveProperty('transcript', 'Test transcript');
    
    // Processing complete
    act(() => {
      result.current.actions.processingComplete({
        reminder: {
          title: 'Test reminder',
          description: 'Test transcript',
          priority: 'MEDIUM',
          category: 'TASK',
          periodId: undefined,
          dueDate: new Date(),
        },
        confidence: 0.9,
        detectedEntities: {}
      });
    });
    expect(result.current.state.status).toBe('confirming');
    
    // Reset
    act(() => {
      result.current.actions.reset();
    });
    expect(result.current.state.status).toBe('idle');
  });

  it('should handle permission denied', () => {
    const { result } = renderHook(() => useVoiceRecorderStateMachine());
    
    act(() => {
      result.current.actions.startRecording();
    });
    
    act(() => {
      result.current.actions.permissionDenied();
    });
    
    expect(result.current.state.status).toBe('error');
    expect(result.current.state).toHaveProperty('message', 'Microphone access was denied');
    
    // Reset from error state
    act(() => {
      result.current.actions.reset();
    });
    expect(result.current.state.status).toBe('idle');
  });

  it('should handle recognition error', () => {
    const { result } = renderHook(() => useVoiceRecorderStateMachine());
    
    act(() => {
      result.current.actions.startRecording();
      result.current.actions.permissionGranted();
    });
    
    act(() => {
      result.current.actions.recognitionError('Speech recognition failed');
    });
    
    expect(result.current.state.status).toBe('error');
    expect(result.current.state).toHaveProperty('message', 'Speech recognition failed');
  });

  it('should handle processing error', () => {
    const { result } = renderHook(() => useVoiceRecorderStateMachine());
    
    act(() => {
      result.current.actions.startRecording();
      result.current.actions.permissionGranted();
      result.current.actions.stopRecording('Test transcript');
    });
    
    act(() => {
      result.current.actions.processingError('Failed to process transcript');
    });
    
    expect(result.current.state.status).toBe('error');
    expect(result.current.state).toHaveProperty('message', 'Failed to process transcript');
  });
});
