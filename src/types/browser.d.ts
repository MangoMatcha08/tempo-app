
// Type definitions for browser APIs that might not be in the standard TypeScript types

// Extending the PermissionDescriptor interface to include microphone
interface PermissionDescriptor {
  name: PermissionName;
}

// Adding 'microphone' to valid permission names
type PermissionName = 'geolocation' | 'notifications' | 'push' | 'midi' | 'camera' | 'microphone' | 'speaker' | 
  'device-info' | 'background-sync' | 'bluetooth' | 'persistent-storage' | 'ambient-light-sensor' | 
  'accelerometer' | 'gyroscope' | 'magnetometer' | 'clipboard-read' | 'clipboard-write' | 'display-capture' | 
  'screen-wake-lock' | 'nfc';

// Permission state values
type PermissionState = 'granted' | 'denied' | 'prompt';

// Permission status interface
interface PermissionStatus extends EventTarget {
  state: PermissionState;
  onchange: ((this: PermissionStatus, ev: Event) => any) | null;
}

// Extending the Permissions interface
interface Permissions {
  query(permissionDesc: PermissionDescriptor): Promise<PermissionStatus>;
}

// Extending Navigator interface to include permissions
interface Navigator {
  permissions?: Permissions;
  // Add standalone property for iOS PWA detection
  standalone?: boolean;
}

// Extending Window interface for browser detection
interface Window {
  // Add MSStream property for IE detection
  MSStream?: any;
}
