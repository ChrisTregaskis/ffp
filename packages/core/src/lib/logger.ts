/**
 * Structured Logging Utility
 *
 * Provides actor-aware logging with structured JSON output optimised for CloudWatch.
 * All logs include tenant context, request tracking, and performance timing.
 *
 * @module lib/logger
 */

import { getActorDisplayName, isSystemActor, type TenantContext } from './context';

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
  tenantId: string;
  actor: string;
  duration: number;
  triggeredBy?: string;
  context?: LogContext;
}

/**
 * Structured logger with tenant and actor awareness
 *
 * Provides CloudWatch-optimised JSON logging with automatic request tracking,
 * performance timing, and actor identification.
 *
 * Supports log level filtering via constructor parameter or LOG_LEVEL environment variable.
 *
 * @example
 * ```typescript
 * const logger = new Logger(context);
 * logger.info('User created', { userId: '123' });
 * logger.error('Validation failed', { field: 'email' });
 *
 * // With custom minimum log level
 * const prodLogger = new Logger(context, LogLevel.INFO); // Suppresses DEBUG logs
 * ```
 */
export class Logger {
  /**
   * Priority values for log levels (higher = more severe)
   */
  private static readonly logLevelPriority: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };

  private readonly context: TenantContext;
  private readonly startTime: Date;
  private readonly minLogLevel: LogLevel;

  /**
   * Create a new logger instance
   *
   * @param context - Tenant context containing actor and request information
   * @param minLogLevel - Minimum log level to output (defaults to LOG_LEVEL env var or DEBUG)
   */
  constructor(context: TenantContext, minLogLevel?: LogLevel) {
    this.context = context;
    this.startTime = context.timestamp;
    this.minLogLevel =
      minLogLevel ?? (process.env.LOG_LEVEL as LogLevel | undefined) ?? LogLevel.DEBUG;
  }

  /**
   * Calculate duration in milliseconds since context creation
   *
   * @returns Duration in milliseconds
   */
  private getDuration(): number {
    return Date.now() - this.startTime.getTime();
  }

  /**
   * Write a structured log entry to stdout
   *
   * @param level - Log severity level
   * @param message - Human-readable log message
   * @param additionalContext - Optional additional context fields
   */
  log(level: LogLevel, message: string, additionalContext?: LogContext): void {
    // Skip logs below minimum level
    if (Logger.logLevelPriority[level] < Logger.logLevelPriority[this.minLogLevel]) {
      return;
    }

    const contextActor = this.context.actor;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: this.context.requestId,
      tenantId: this.context.tenantId,
      actor: getActorDisplayName(contextActor),
      duration: this.getDuration(),
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
  }

  /**
   * Log informational message
   *
   * @param message - Log message
   * @param context - Optional additional context
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   *
   * @param message - Log message
   * @param context - Optional additional context
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   *
   * @param message - Log message
   * @param context - Optional additional context
   */
  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Log debug message
   *
   * @param message - Log message
   * @param context - Optional additional context
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }
}

/**
 * Structured log entry format for system-level logs (no tenant context)
 */
interface SystemLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  context?: LogContext;
}

/**
 * System-level logger for cross-tenant or infrastructure operations
 *
 * Use this logger when there is no tenant context available, such as:
 * - Lambda cold starts
 * - Cross-tenant batch operations (job processor polling)
 * - Infrastructure health checks
 * - System-wide metrics
 *
 * For tenant-scoped operations, use the `Logger` class instead.
 *
 * @example
 * ```typescript
 * const sysLogger = new SystemLogger('job-processor');
 * sysLogger.info('Processor triggered', { time: event.time });
 * sysLogger.info('Claimed jobs', { count: 5 });
 * sysLogger.error('Processor failed', { error: err.message });
 * ```
 */
export class SystemLogger {
  private static readonly logLevelPriority: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };

  private readonly service: string;
  private readonly minLogLevel: LogLevel;

  /**
   * Create a new system logger instance
   *
   * @param service - Name of the service/component (e.g., 'job-processor', 'health-check')
   * @param minLogLevel - Minimum log level to output (defaults to LOG_LEVEL env var or DEBUG)
   */
  constructor(service: string, minLogLevel?: LogLevel) {
    this.service = service;
    this.minLogLevel =
      minLogLevel ?? (process.env.LOG_LEVEL as LogLevel | undefined) ?? LogLevel.DEBUG;
  }

  log(level: LogLevel, message: string, additionalContext?: LogContext): void {
    // Skip logs below minimum level
    if (SystemLogger.logLevelPriority[level] < SystemLogger.logLevelPriority[this.minLogLevel]) {
      return;
    }

    const entry: SystemLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
    };

    // Include additional context if provided
    if (additionalContext && Object.keys(additionalContext).length > 0) {
      entry.context = additionalContext;
    }

    // Output as JSON for CloudWatch
    console.log(JSON.stringify(entry));
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }
}

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
  context: TenantContext,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const logger = new Logger(context);
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
