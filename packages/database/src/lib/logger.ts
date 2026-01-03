/**
 * Database Package Logger Utility
 *
 * Provides consistent, coloured logging throughout the database package with log level filtering
 * and module/file prefixes for better debugging.
 * Designed for Node.js environments (scripts, migrations, seeds).
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
export interface DatabaseLogger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
}

/**
 * ANSI colour codes for terminal output
 */
const colours = {
  reset: '\x1b[0m',
  grey: '\x1b[90m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
} as const;

/**
 * Colour mappings for log levels
 */
const LOG_LEVEL_COLOURS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: colours.grey,
  [LogLevel.INFO]: colours.blue,
  [LogLevel.WARN]: colours.yellow,
  [LogLevel.ERROR]: colours.red,
};

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
 * Serialise context data, handling Error objects specially to preserve stack traces
 *
 * @param data - Data to serialise
 * @param depth - Current recursion depth (internal use)
 * @param seen - Set of already-seen objects for circular reference detection (internal use)
 * @returns Serialised data with Error objects properly formatted
 */
const serialiseContextData = (data: unknown, depth = 0, seen = new WeakSet()): unknown => {
  // Protection: Maximum depth limit (prevent stack overflow)
  const MAX_DEPTH = 10;
  if (depth > MAX_DEPTH) {
    return '[Max Depth Exceeded]';
  }

  // Protection: Circular reference detection
  if (data && typeof data === 'object') {
    if (seen.has(data)) {
      return '[Circular Reference]';
    }
    seen.add(data);
  }

  // Handle Error objects specially to preserve stack traces
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
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
 * Format the log message with colours and prefixes
 *
 * @param level - Log level for colour coding
 * @param moduleName - Module name for prefix
 * @param message - Log message
 * @param context - Optional context object
 * @returns Formatted log string
 */
const formatLog = (
  level: LogLevel,
  moduleName: string,
  message: string,
  context?: LogContext
): string => {
  const levelColour = LOG_LEVEL_COLOURS[level];
  const timestamp = new Date().toISOString();

  // Build the log line: [LEVEL] [timestamp] [module] message
  let output = `${levelColour}${colours.bold}${level.padEnd(5)}${colours.reset} `;
  output += `${colours.grey}[${timestamp}]${colours.reset} `;
  output += `${colours.magenta}[${moduleName}]${colours.reset} `;
  output += message;

  // Append context if provided
  if (context && Object.keys(context).length > 0) {
    const serialised = serialiseContextData(context);
    output += ` ${colours.cyan}${JSON.stringify(serialised)}${colours.reset}`;
  }

  return output;
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
 * Create a logger instance for a specific module/file
 *
 * Provides consistent logging throughout the database package with optional context.
 * Supports log level filtering via LOG_LEVEL environment variable.
 *
 * @param moduleName - Name of the module/file (e.g., 'migrate', 'rls', 'seed')
 * @param minLogLevel - Optional minimum log level override
 * @returns Logger instance with module prefix
 *
 * @example
 * ```typescript
 * import { createLogger } from '@ffp/database';
 *
 * const logger = createLogger('migrate');
 *
 * logger.info('Starting migration');
 * logger.debug('Processing table', { table: 'users', rows: 100 });
 * logger.error('Migration failed', { error: err.message });
 * ```
 *
 * @example
 * // Output format:
 * // INFO  [2024-01-15T10:30:00.000Z] [migrate] Starting migration
 * // DEBUG [2024-01-15T10:30:00.000Z] [migrate] Processing table {"table":"users","rows":100}
 */
export const createLogger = (moduleName: string, minLogLevel?: LogLevel): DatabaseLogger => {
  const resolvedMinLevel =
    minLogLevel ?? (process.env.LOG_LEVEL as LogLevel | undefined) ?? LogLevel.DEBUG;

  return {
    debug: (message: string, context?: LogContext): void => {
      if (!shouldLog(LogLevel.DEBUG, resolvedMinLevel)) return;
      // eslint-disable-next-line no-console
      console.debug(formatLog(LogLevel.DEBUG, moduleName, message, context));
    },

    info: (message: string, context?: LogContext): void => {
      if (!shouldLog(LogLevel.INFO, resolvedMinLevel)) return;
      // eslint-disable-next-line no-console
      console.info(formatLog(LogLevel.INFO, moduleName, message, context));
    },

    warn: (message: string, context?: LogContext): void => {
      if (!shouldLog(LogLevel.WARN, resolvedMinLevel)) return;
      // eslint-disable-next-line no-console
      console.warn(formatLog(LogLevel.WARN, moduleName, message, context));
    },

    error: (message: string, context?: LogContext): void => {
      if (!shouldLog(LogLevel.ERROR, resolvedMinLevel)) return;
      // eslint-disable-next-line no-console
      console.error(formatLog(LogLevel.ERROR, moduleName, message, context));
    },
  };
};

// Re-export LogLevel for convenience
export { LogLevel as DatabaseLogLevel };
