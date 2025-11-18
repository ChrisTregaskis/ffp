/**
 * Browser Logger Utility
 *
 * Provides consistent, coloured logging throughout the web application with log level filtering
 * and module/file prefixes for better debugging.
 * Designed for browser environments (no TenantContext required).
 *
 * @module lib/logger
 */

/**
 * Log severity levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Additional context for log entries
 */
export type LogContext = Record<string, unknown>;

/**
 * Colour styles for different log levels
 */
const LOG_COLOURS = {
  [LogLevel.DEBUG]: 'color: #6B7280; font-weight: bold', // Grey
  [LogLevel.INFO]: 'color: #3B82F6; font-weight: bold', // Blue
  [LogLevel.WARN]: 'color: #F59E0B; font-weight: bold', // Amber
  [LogLevel.ERROR]: 'color: #EF4444; font-weight: bold', // Red
} as const;

/**
 * Style for module/file prefix
 */
const MODULE_STYLE =
  'color: #8B5CF6; font-weight: bold; background: #F3F4F6; padding: 2px 6px; border-radius: 3px';

/**
 * Style for timestamp
 */
const TIMESTAMP_STYLE = 'color: #9CA3AF; font-size: 0.9em';

/**
 * Browser-friendly logger with coloured output, log level filtering, and module prefixes
 *
 * Provides consistent logging throughout the web app with optional context.
 * Supports log level filtering via environment variable (VITE_LOG_LEVEL).
 *
 * @example
 * ```typescript
 * import { createLogger } from '@web/lib/logger';
 *
 * const logger = createLogger('AuthContext');
 *
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Authentication failed', { reason: 'Invalid credentials' });
 * logger.debug('Component rendered', { componentName: 'LoginForm' });
 * ```
 */
class BrowserLogger {
  /**
   * Priority values for log levels (higher = more severe)
   */
  private static readonly logLevelPriority: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };

  private readonly minLogLevel: LogLevel;
  private readonly moduleName?: string;

  constructor(moduleName?: string) {
    // Get minimum log level from environment, default to INFO in production, DEBUG in development
    const envLogLevel = import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined;
    const defaultLevel = import.meta.env.PROD ? LogLevel.INFO : LogLevel.DEBUG;
    this.minLogLevel = envLogLevel ?? defaultLevel;
    this.moduleName = moduleName;
  }

  /**
   * Check if a log level should be output
   *
   * @param level - Log level to check
   * @returns True if the level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return (
      BrowserLogger.logLevelPriority[level] >= BrowserLogger.logLevelPriority[this.minLogLevel]
    );
  }

  /**
   * Format log message with colours, module prefix, and optional context
   *
   * @param level - Log level for colour coding
   * @param message - Log message
   * @param context - Optional context object
   * @returns Array of arguments for console methods with CSS styling
   */
  private formatLog(level: LogLevel, message: string, context?: LogContext): unknown[] {
    const timestamp = new Date().toISOString();
    const levelColour = LOG_COLOURS[level];

    // Build format string with placeholders for styled segments
    let formatString = '%c%s%c %c[%s]%c %s';
    const args: unknown[] = [
      formatString,
      levelColour,
      level.padEnd(5), // Pad level to align output
      '', // Reset style after level
      TIMESTAMP_STYLE,
      timestamp,
      '', // Reset style after timestamp
      message,
    ];

    // Add module prefix if provided
    if (this.moduleName) {
      formatString = '%c%s%c %c[%s]%c %c%s%c %s';
      args[0] = formatString;
      args.splice(7, 0, MODULE_STYLE, this.moduleName, ''); // Insert module styling before message
    }

    // Add context object if provided
    if (context && Object.keys(context).length > 0) {
      args.push(context);
    }

    return args;
  }

  /**
   * Log debug message
   *
   * @param message - Log message
   * @param context - Optional additional context
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    // eslint-disable-next-line no-console
    console.debug(...this.formatLog(LogLevel.DEBUG, message, context));
  }

  /**
   * Log informational message
   *
   * @param message - Log message
   * @param context - Optional additional context
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    // eslint-disable-next-line no-console
    console.info(...this.formatLog(LogLevel.INFO, message, context));
  }

  /**
   * Log warning message
   *
   * @param message - Log message
   * @param context - Optional additional context
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(...this.formatLog(LogLevel.WARN, message, context));
  }

  /**
   * Log error message
   *
   * @param message - Log message
   * @param context - Optional additional context
   */
  error(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    console.error(...this.formatLog(LogLevel.ERROR, message, context));
  }
}

/**
 * Create a logger instance for a specific module/file
 *
 * @param moduleName - Name of the module/file (e.g., 'AuthContext', 'LoginPage')
 * @returns Logger instance with module prefix
 *
 * @example
 * ```typescript
 * const logger = createLogger('AuthContext');
 * logger.info('User authenticated');
 * // Output: INFO  [timestamp] [AuthContext] User authenticated
 * ```
 */
export const createLogger = (moduleName: string): BrowserLogger => {
  return new BrowserLogger(moduleName);
};

/**
 * Default logger instance for the application (without module prefix)
 *
 * @deprecated Prefer using `createLogger(moduleName)` for better debugging
 */
export const logger = new BrowserLogger();
