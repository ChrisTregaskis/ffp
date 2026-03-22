/**
 * Structured Logging Utility
 *
 * Provides actor-aware logging with structured JSON output optimised for CloudWatch.
 * All logs include tenant context, request tracking, and performance timing.
 *
 * @module lib/logger
 */

import { getActorDisplayName, isSystemActor, type OrganisationContext } from './context';

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
 * Additional context fields for log entries
 */
export type LogContext = Record<string, unknown>;

/**
 * Structured log entry format for CloudWatch
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId: string;
  organisationId: string;
  actor: string;
  duration: number;
  triggeredBy?: string;
  context?: LogContext;
}

/**
 * Structured log entry format for system-level logs (no tenant context)
 */
interface SystemLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  requestId?: string;
  context?: LogContext;
}

/**
 * Logger interface for tenant-scoped logging
 */
export interface TenantLogger {
  log: (level: LogLevel, message: string, context?: LogContext) => void;
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
}

/**
 * Logger interface for system-level logging
 */
export interface SystemLoggerInstance {
  log: (level: LogLevel, message: string, context?: LogContext) => void;
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
}

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
 * Resolve minimum log level from parameter or environment
 *
 * @param minLogLevel - Optional minimum log level override
 * @returns Resolved minimum log level
 */
const resolveMinLogLevel = (minLogLevel?: LogLevel): LogLevel =>
  minLogLevel ?? (process.env.LOG_LEVEL as LogLevel | undefined) ?? LogLevel.DEBUG;

/**
 * Create a structured logger with tenant and actor awareness
 *
 * Provides CloudWatch-optimised JSON logging with automatic request tracking,
 * performance timing, and actor identification.
 *
 * Supports log level filtering via parameter or LOG_LEVEL environment variable.
 *
 * @param context - Tenant context containing actor and request information
 * @param minLogLevel - Minimum log level to output (defaults to LOG_LEVEL env var or DEBUG)
 * @returns Logger instance with tenant context
 *
 * @example
 * ```typescript
 * const logger = createLogger(context);
 * logger.info('User created', { userId: '123' });
 * logger.error('Validation failed', { field: 'email' });
 *
 * // With custom minimum log level
 * const prodLogger = createLogger(context, LogLevel.INFO); // Suppresses DEBUG logs
 * ```
 */
export const createLogger = (
  context: OrganisationContext,
  minLogLevel?: LogLevel
): TenantLogger => {
  const resolvedMinLevel = resolveMinLogLevel(minLogLevel);
  const startTime = context.timestamp;

  /**
   * Calculate duration in milliseconds since context creation
   */
  const getDuration = (): number => Date.now() - startTime.getTime();

  /**
   * Write a structured log entry to stdout
   */
  const log = (level: LogLevel, message: string, additionalContext?: LogContext): void => {
    // Skip logs below minimum level
    if (!shouldLog(level, resolvedMinLevel)) {
      return;
    }

    const contextActor = context.actor;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: context.requestId,
      organisationId: context.organisationId,
      actor: getActorDisplayName(contextActor),
      duration: getDuration(),
    };

    // Include triggeredBy for system actors
    if (isSystemActor(contextActor) && contextActor.triggeredBy) {
      entry.triggeredBy = contextActor.triggeredBy;
    }

    // Include additional context if provided
    if (additionalContext && Object.keys(additionalContext).length > 0) {
      entry.context = additionalContext;
    }

    // Output as JSON for CloudWatch
    console.log(JSON.stringify(entry));
  };

  return {
    log,
    info: (message: string, additionalContext?: LogContext): void => {
      log(LogLevel.INFO, message, additionalContext);
    },
    warn: (message: string, additionalContext?: LogContext): void => {
      log(LogLevel.WARN, message, additionalContext);
    },
    error: (message: string, additionalContext?: LogContext): void => {
      log(LogLevel.ERROR, message, additionalContext);
    },
    debug: (message: string, additionalContext?: LogContext): void => {
      log(LogLevel.DEBUG, message, additionalContext);
    },
  };
};

/**
 * Create a system-level logger for cross-tenant or infrastructure operations
 *
 * Use this logger when there is no tenant context available, such as:
 * - Lambda cold starts
 * - Cross-tenant batch operations (job processor polling)
 * - Infrastructure health checks
 * - System-wide metrics
 *
 * For tenant-scoped operations, use `createLogger` instead.
 *
 * @param service - Name of the service/component (e.g., 'job-processor', 'health-check')
 * @param minLogLevel - Minimum log level to output (defaults to LOG_LEVEL env var or DEBUG)
 * @param requestId - Optional request ID for distributed tracing (e.g., Lambda context.awsRequestId)
 * @returns System logger instance
 *
 * @example
 * ```typescript
 * const sysLogger = createSystemLogger('job-processor');
 * sysLogger.info('Processor triggered', { time: event.time });
 * sysLogger.info('Claimed jobs', { count: 5 });
 * sysLogger.error('Processor failed', { error: err.message });
 *
 * // With request ID for distributed tracing
 * const sysLogger = createSystemLogger('job-processor', undefined, context.awsRequestId);
 * ```
 */
export const createSystemLogger = (
  service: string,
  minLogLevel?: LogLevel,
  requestId?: string
): SystemLoggerInstance => {
  const resolvedMinLevel = resolveMinLogLevel(minLogLevel);

  const log = (level: LogLevel, message: string, additionalContext?: LogContext): void => {
    // Skip logs below minimum level
    if (!shouldLog(level, resolvedMinLevel)) {
      return;
    }

    const entry: SystemLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service,
    };

    // Include requestId for distributed tracing if available
    if (requestId) {
      entry.requestId = requestId;
    }

    // Include additional context if provided
    if (additionalContext && Object.keys(additionalContext).length > 0) {
      entry.context = additionalContext;
    }

    // Output as JSON for CloudWatch
    console.log(JSON.stringify(entry));
  };

  return {
    log,
    info: (message: string, additionalContext?: LogContext): void => {
      log(LogLevel.INFO, message, additionalContext);
    },
    warn: (message: string, additionalContext?: LogContext): void => {
      log(LogLevel.WARN, message, additionalContext);
    },
    error: (message: string, additionalContext?: LogContext): void => {
      log(LogLevel.ERROR, message, additionalContext);
    },
    debug: (message: string, additionalContext?: LogContext): void => {
      log(LogLevel.DEBUG, message, additionalContext);
    },
  };
};

/**
 * Wrap an async operation with automatic request logging
 *
 * Logs operation start and end with timing information. If the operation throws
 * an error, it will be logged and re-thrown.
 *
 * @param context - Tenant context for logging
 * @param operation - Name of the operation being performed
 * @param fn - Async function to execute
 * @returns Result of the async function
 * @throws Re-throws any error from the wrapped function after logging
 *
 * @example
 * ```typescript
 * const result = await withRequestLogging(context, 'createUser', async () => {
 *   return await userService.create(userData);
 * });
 * ```
 */
export async function withRequestLogging<T>(
  context: OrganisationContext,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const logger = createLogger(context);
  const operationStartTime = Date.now();

  logger.info(`Starting operation: ${operation}`);

  try {
    const result = await fn();

    const operationDuration = Date.now() - operationStartTime;
    logger.info(`Completed operation: ${operation}`, {
      operationDuration,
    });

    return result;
  } catch (error) {
    const operationDuration = Date.now() - operationStartTime;

    // Log error with stack trace if available
    const errorContext: LogContext = {
      operationDuration,
      error: error instanceof Error ? error.message : String(error),
    };

    if (error instanceof Error && error.stack) {
      errorContext.stack = error.stack;
    }

    logger.error(`Failed operation: ${operation}`, errorContext);

    // Re-throw the error for caller to handle
    throw error;
  }
}
