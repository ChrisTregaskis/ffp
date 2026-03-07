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
 * Logger interface returned by createLogger
 */
export interface BrowserLogger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
}

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
 * Priority values for log levels (higher = more severe)
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * Check if a log level should be output
 *
 * @param level - Log level to check
 * @param minLogLevel - Minimum log level threshold
 * @returns True if the level should be logged
 */
const shouldLog = (level: LogLevel, minLogLevel: LogLevel): boolean =>
  LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLogLevel];

/**
 * Serialise context data, handling Error objects specially to preserve stack traces
 *
 * Protections:
 * - Circular reference detection via WeakSet
 * - Maximum depth limit (10 levels) to prevent stack overflow
 * - Safe Error object serialisation
 *
 * @param data - Data to serialise
 * @param depth - Current recursion depth (internal use)
 * @param seen - Set of already-seen objects for circular reference detection (internal use)
 * @returns Serialised data with Error objects properly formatted
 */
const serialiseContextData = (data: unknown, depth = 0, seen = new WeakSet()): unknown => {
  // Protection 1: Maximum depth limit (prevent stack overflow)
  const MAX_DEPTH = 10;

  if (depth > MAX_DEPTH) {
    return '[Max Depth Exceeded]';
  }

  // Protection 2: Circular reference detection
  if (data && typeof data === 'object') {
    if (seen.has(data)) {
      return '[Circular Reference]';
    }

    seen.add(data);
  }

  // Handle Error objects specially to preserve stack traces
  if (data instanceof Error) {
    // Only extract safe properties, don't spread the entire Error object
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
      // Safely extract additional enumerable properties (e.g., custom error fields)
      ...Object.fromEntries(
        Object.entries(data).filter(([key]) => !['name', 'message', 'stack'].includes(key))
      ),
    };
  }

  // If it's an object, recursively serialise nested values
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const serialised: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      serialised[key] = serialiseContextData(value, depth + 1, seen);
    }

    return serialised;
  }

  // If it's an array, recursively serialise elements
  if (Array.isArray(data)) {
    return data.map((item) => serialiseContextData(item, depth + 1, seen));
  }

  // Primitive values pass through unchanged
  return data;
};

/**
 * Format log message with colours, module prefix, and optional context
 *
 * @param level - Log level for colour coding
 * @param moduleName - Module name for prefix (optional)
 * @param message - Log message
 * @param context - Optional context object
 * @returns Array of arguments for console methods with CSS styling
 */
const formatLog = (
  level: LogLevel,
  moduleName: string | undefined,
  message: string,
  context?: LogContext
): unknown[] => {
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
  if (moduleName) {
    formatString = '%c%s%c %c[%s]%c %c%s%c %s';
    args[0] = formatString;
    args.splice(7, 0, MODULE_STYLE, moduleName, ''); // Insert module styling before message
  }

  // Add context object if provided, with proper Error serialisation
  if (context && Object.keys(context).length > 0) {
    const serialisedContext = serialiseContextData(context);
    args.push(serialisedContext);
  }

  return args;
};

/**
 * Resolve the minimum log level from environment or defaults
 *
 * @returns Resolved minimum log level
 */
const resolveMinLogLevel = (): LogLevel => {
  const envLogLevel = import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined;
  const defaultLevel = import.meta.env.PROD ? LogLevel.INFO : LogLevel.DEBUG;

  return envLogLevel ?? defaultLevel;
};

/**
 * Create a logger instance for a specific module/file
 *
 * Provides consistent, coloured logging throughout the web app with optional context.
 * Supports log level filtering via environment variable (VITE_LOG_LEVEL).
 *
 * @param moduleName - Name of the module/file (e.g., 'AuthContext', 'LoginPage')
 * @returns Logger instance with module prefix
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
 *
 * @example
 * // Output: INFO  [timestamp] [AuthContext] User authenticated
 */
export const createLogger = (moduleName: string): BrowserLogger => {
  const minLogLevel = resolveMinLogLevel();

  return {
    debug: (message: string, context?: LogContext): void => {
      if (!shouldLog(LogLevel.DEBUG, minLogLevel)) {
        return;
      }

      // eslint-disable-next-line no-console
      console.debug(...formatLog(LogLevel.DEBUG, moduleName, message, context));
    },

    info: (message: string, context?: LogContext): void => {
      if (!shouldLog(LogLevel.INFO, minLogLevel)) {
        return;
      }

      // eslint-disable-next-line no-console
      console.info(...formatLog(LogLevel.INFO, moduleName, message, context));
    },

    warn: (message: string, context?: LogContext): void => {
      if (!shouldLog(LogLevel.WARN, minLogLevel)) {
        return;
      }

      console.warn(...formatLog(LogLevel.WARN, moduleName, message, context));
    },

    error: (message: string, context?: LogContext): void => {
      if (!shouldLog(LogLevel.ERROR, minLogLevel)) {
        return;
      }

      console.error(...formatLog(LogLevel.ERROR, moduleName, message, context));
    },
  };
};
