
/**
 * Speech recognition module entry point
 * Exports the main hook and relevant types
 */

import useSpeechRecognition from './useSpeechRecognition';
import type { UseSpeechRecognitionReturn } from './types';

export type { UseSpeechRecognitionReturn };
export { useSpeechRecognition };
export default useSpeechRecognition;

// Export utility functions to support PWA and iOS functionality
export { 
  isPwaMode, 
  isIOSDevice,
  isAndroidDevice,
  isMobileDevice,
  prewarmSpeechRecognition, 
  getPrewarmedSpeechRecognition, 
  forceAudioPermissionCheck 
} from './utils';
