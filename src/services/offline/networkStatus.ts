
/**
 * Network status monitoring service
 */
export class NetworkStatusMonitor {
  private listeners: Set<(online: boolean) => void> = new Set();
  private isOnline: boolean;

  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.setupListeners();
  }

  /**
   * Set up event listeners for online/offline events
   */
  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * Clean up event listeners
   */
  public cleanup(): void {
    if (typeof window === 'undefined') return;
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners.clear();
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    this.isOnline = true;
    this.notifyListeners();
    
    console.log('Network connection restored');
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    this.isOnline = false;
    this.notifyListeners();
    
    console.log('Network connection lost');
  };

  /**
   * Notify all listeners of the current online status
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.isOnline);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  /**
   * Get the current online status
   */
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Add a listener for network status changes
   */
  public addStatusListener(listener: (online: boolean) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately notify the new listener of the current status
    try {
      listener(this.isOnline);
    } catch (error) {
      console.error('Error in initial network status notification:', error);
    }
    
    // Return a function to remove the listener
    return () => {
      this.listeners.delete(listener);
    };
  }
}

// Create and export a singleton instance
export const networkStatus = new NetworkStatusMonitor();

// Export default instance for convenience
export default networkStatus;
