
/**
 * Log levels for service worker logging
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Interface for a log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: any;
  source: 'service-worker' | 'app';
}

/**
 * Service worker logger for detailed logging and debugging
 */
export class ServiceWorkerLogger {
  private static MAX_LOGS = 1000;
  private logs: LogEntry[] = [];
  private logLevel: LogLevel = LogLevel.INFO;
  private persistLogs: boolean = false;
  
  /**
   * Create a new logger instance
   */
  constructor(options?: {
    level?: LogLevel;
    persistLogs?: boolean;
  }) {
    this.logLevel = options?.level || LogLevel.INFO;
    this.persistLogs = options?.persistLogs || false;
    
    // Load persisted logs if needed
    if (this.persistLogs) {
      this.loadLogs();
    }
  }
  
  /**
   * Set the log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
  
  /**
   * Enable or disable log persistence
   */
  setPersistLogs(persist: boolean): void {
    this.persistLogs = persist;
    
    if (persist) {
      this.saveLogs();
    }
  }
  
  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    
    if (this.persistLogs && typeof localStorage !== 'undefined') {
      localStorage.removeItem('sw-logs');
    }
  }
  
  /**
   * Save logs to localStorage
   */
  private saveLogs(): void {
    if (typeof localStorage !== 'undefined') {
      // Only save the last MAX_LOGS logs to avoid excessive storage use
      const logsToSave = this.logs.slice(-ServiceWorkerLogger.MAX_LOGS);
      
      try {
        localStorage.setItem('sw-logs', JSON.stringify(logsToSave));
      } catch (error) {
        console.error('Failed to save logs to localStorage:', error);
      }
    }
  }
  
  /**
   * Load logs from localStorage
   */
  private loadLogs(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const savedLogs = localStorage.getItem('sw-logs');
        
        if (savedLogs) {
          const parsedLogs = JSON.parse(savedLogs) as LogEntry[];
          this.logs = parsedLogs;
        }
      } catch (error) {
        console.error('Failed to load logs from localStorage:', error);
      }
    }
  }
  
  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }
  
  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }
  
  /**
   * Get the most recent logs
   */
  getRecentLogs(count: number = 10): LogEntry[] {
    return this.logs.slice(-count);
  }
  
  /**
   * Add a log entry
   */
  private addLog(level: LogLevel, message: string, data?: any): void {
    // Check if we should log this level
    const levelPriority: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3
    };
    
    if (levelPriority[level] < levelPriority[this.logLevel]) {
      return;
    }
    
    // Create the log entry
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      data,
      source: 'app'
    };
    
    // Add to logs array
    this.logs.push(logEntry);
    
    // Trim logs if needed
    if (this.logs.length > ServiceWorkerLogger.MAX_LOGS) {
      this.logs = this.logs.slice(-ServiceWorkerLogger.MAX_LOGS);
    }
    
    // Console output
    const consoleMethod = {
      [LogLevel.DEBUG]: console.debug,
      [LogLevel.INFO]: console.log,
      [LogLevel.WARN]: console.warn,
      [LogLevel.ERROR]: console.error
    }[level];
    
    consoleMethod(`[${new Date(logEntry.timestamp).toISOString()}] [${level.toUpperCase()}] ${message}`, data || '');
    
    // Save logs if persistence is enabled
    if (this.persistLogs) {
      this.saveLogs();
    }
  }
  
  /**
   * Log a debug message
   */
  debug(message: string, data?: any): void {
    this.addLog(LogLevel.DEBUG, message, data);
  }
  
  /**
   * Log an info message
   */
  info(message: string, data?: any): void {
    this.addLog(LogLevel.INFO, message, data);
  }
  
  /**
   * Log a warning message
   */
  warn(message: string, data?: any): void {
    this.addLog(LogLevel.WARN, message, data);
  }
  
  /**
   * Log an error message
   */
  error(message: string, data?: any): void {
    this.addLog(LogLevel.ERROR, message, data);
  }
}

// Create and export a singleton instance
export const logger = new ServiceWorkerLogger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  persistLogs: true
});

// Export default instance for convenience
export default logger;
