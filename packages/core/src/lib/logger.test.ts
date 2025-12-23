/**
 * Unit tests for structured logging
 *
 * Tests the Logger class and withRequestLogging wrapper to ensure:
 * - Correct JSON output format for CloudWatch
 * - Actor-aware logging (user vs system)
 * - Request ID and tenant ID tracking
 * - Performance timing (duration)
 * - Log levels (DEBUG, INFO, WARN, ERROR)
 * - Error handling in withRequestLogging
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger, LogLevel, withRequestLogging } from './logger';

import type { TenantContext } from './context';

/**
 * Helper interface for typed log entry parsing in tests
 */
interface ParsedLogEntry {
  timestamp: string;
  level: string;
  message: string;
  requestId: string;
  tenantId: string;
  actor: string;
  duration: number;
  triggeredBy?: string;
  context?: Record<string, unknown>;
}

/**
 * Helper to safely parse and validate log entries
 * Throws if the log entry doesn't match the expected structure
 */
function parseLogEntry(logCall: string): ParsedLogEntry {
  const parsed: unknown = JSON.parse(logCall);

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Log entry is not an object');
  }

  const entry = parsed as Record<string, unknown>;

  // Validate required fields
  if (typeof entry.timestamp !== 'string') {
    throw new Error('Log entry missing or invalid timestamp');
  }
  if (typeof entry.level !== 'string') {
    throw new Error('Log entry missing or invalid level');
  }
  if (typeof entry.message !== 'string') {
    throw new Error('Log entry missing or invalid message');
  }
  if (typeof entry.requestId !== 'string') {
    throw new Error('Log entry missing or invalid requestId');
  }
  if (typeof entry.tenantId !== 'string') {
    throw new Error('Log entry missing or invalid tenantId');
  }
  if (typeof entry.actor !== 'string') {
    throw new Error('Log entry missing or invalid actor');
  }
  if (typeof entry.duration !== 'number') {
    throw new Error('Log entry missing or invalid duration');
  }

  return {
    timestamp: entry.timestamp,
    level: entry.level,
    message: entry.message,
    requestId: entry.requestId,
    tenantId: entry.tenantId,
    actor: entry.actor,
    duration: entry.duration,
    triggeredBy: typeof entry.triggeredBy === 'string' ? entry.triggeredBy : undefined,
    context:
      entry.context && typeof entry.context === 'object'
        ? (entry.context as Record<string, unknown>)
        : undefined,
  };
}

describe('Logger', () => {
  // Mock console.log to capture output
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.clearAllMocks();
  });

  describe('UserActor logging', () => {
    const mockUserContext: TenantContext = {
      actor: {
        type: 'user',
        userId: 'user-123',
        userRole: 'customer_owner',
        email: 'test@example.com',
      },
      tenantId: 'tenant-456',
      customerId: 'customer-789',
      requestId: 'request-abc',
      timestamp: new Date('2025-01-06T10:00:00.000Z'),
    };

    it('should log info message with user actor', () => {
      const logger = new Logger(mockUserContext);
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry).toMatchObject({
        level: 'INFO',
        message: 'Test message',
        requestId: 'request-abc',
        tenantId: 'tenant-456',
        actor: 'test@example.com (customer_owner)',
      });
      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.duration).toBeGreaterThanOrEqual(0);
    });

    it('should log warn message', () => {
      const logger = new Logger(mockUserContext);
      logger.warn('Warning message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.level).toBe('WARN');
      expect(logEntry.message).toBe('Warning message');
    });

    it('should log error message', () => {
      const logger = new Logger(mockUserContext);
      logger.error('Error message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.level).toBe('ERROR');
      expect(logEntry.message).toBe('Error message');
    });

    it('should log debug message', () => {
      const logger = new Logger(mockUserContext);
      logger.debug('Debug message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.level).toBe('DEBUG');
      expect(logEntry.message).toBe('Debug message');
    });

    it('should include additional context', () => {
      const logger = new Logger(mockUserContext);
      logger.info('User created', {
        userId: 'new-user-123',
        role: 'customer_user',
      });

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.context).toEqual({
        userId: 'new-user-123',
        role: 'customer_user',
      });
    });

    it('should not include context field when empty', () => {
      const logger = new Logger(mockUserContext);
      logger.info('Test message', {});

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.context).toBeUndefined();
    });

    it('should not include triggeredBy for user actors', () => {
      const logger = new Logger(mockUserContext);
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.triggeredBy).toBeUndefined();
    });
  });

  describe('SystemActor logging', () => {
    const mockSystemContext: TenantContext = {
      actor: {
        type: 'system',
        systemId: 'assessment-processor',
        triggeredBy: 'user-123',
        jobId: 'job-xyz',
      },
      tenantId: 'tenant-456',
      customerId: null,
      requestId: 'request-def',
      timestamp: new Date('2025-01-06T10:00:00.000Z'),
    };

    it('should log with system actor display name', () => {
      const logger = new Logger(mockSystemContext);
      logger.info('Processing assessment');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.actor).toBe('System: assessment-processor');
    });

    it('should include triggeredBy when present', () => {
      const logger = new Logger(mockSystemContext);
      logger.info('Processing assessment');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.triggeredBy).toBe('user-123');
    });

    it('should not include triggeredBy when absent', () => {
      const systemContextNoTrigger: TenantContext = {
        ...mockSystemContext,
        actor: {
          type: 'system',
          systemId: 'daily-report-job',
        },
      };

      const logger = new Logger(systemContextNoTrigger);
      logger.info('Generating daily report');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.triggeredBy).toBeUndefined();
    });
  });

  describe('log() method', () => {
    const mockContext: TenantContext = {
      actor: {
        type: 'user',
        userId: 'user-123',
        userRole: 'super_admin',
        email: 'admin@example.com',
      },
      tenantId: 'tenant-456',
      customerId: null,
      requestId: 'request-ghi',
      timestamp: new Date('2025-01-06T10:00:00.000Z'),
    };

    it('should support all log levels via log() method', () => {
      const logger = new Logger(mockContext);

      logger.log(LogLevel.DEBUG, 'Debug via log()');
      logger.log(LogLevel.INFO, 'Info via log()');
      logger.log(LogLevel.WARN, 'Warn via log()');
      logger.log(LogLevel.ERROR, 'Error via log()');

      expect(consoleLogSpy).toHaveBeenCalledTimes(4);

      const levels = consoleLogSpy.mock.calls.map((call) => parseLogEntry(call[0] as string).level);
      expect(levels).toEqual(['DEBUG', 'INFO', 'WARN', 'ERROR']);
    });
  });

  describe('Performance timing', () => {
    it('should track duration from context timestamp', async () => {
      const mockContext: TenantContext = {
        actor: {
          type: 'user',
          userId: 'user-123',
          userRole: 'customer_owner',
          email: 'test@example.com',
        },
        tenantId: 'tenant-456',
        customerId: 'customer-789',
        requestId: 'request-jkl',
        timestamp: new Date(Date.now() - 100), // 100ms ago
      };

      const logger = new Logger(mockContext);

      // Wait a bit to ensure measurable duration
      await new Promise((resolve) => setTimeout(resolve, 50));

      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.duration).toBeGreaterThanOrEqual(50);
      expect(logEntry.duration).toBeLessThan(500); // Reasonable upper bound (allows for CI/system load variability)
    });
  });

  describe('JSON output format', () => {
    const mockContext: TenantContext = {
      actor: {
        type: 'user',
        userId: 'user-123',
        userRole: 'customer_owner',
        email: 'test@example.com',
      },
      tenantId: 'tenant-456',
      customerId: 'customer-789',
      requestId: 'request-mno',
      timestamp: new Date('2025-01-06T10:00:00.000Z'),
    };

    it('should output valid JSON', () => {
      const logger = new Logger(mockContext);
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logOutput = consoleLogSpy.mock.calls[0][0] as string;
      expect(() => {
        JSON.parse(logOutput);
      }).not.toThrow();
    });

    it('should have correct CloudWatch structure', () => {
      const logger = new Logger(mockContext);
      logger.info('Test message', { key: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);

      // Required fields
      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.level).toBeDefined();
      expect(logEntry.message).toBeDefined();
      expect(logEntry.requestId).toBeDefined();
      expect(logEntry.tenantId).toBeDefined();
      expect(logEntry.actor).toBeDefined();
      expect(logEntry.duration).toBeDefined();

      // Timestamp should be ISO format
      expect(new Date(logEntry.timestamp).toISOString()).toBe(logEntry.timestamp);
    });
  });

  describe('Log level filtering', () => {
    const mockContext: TenantContext = {
      actor: {
        type: 'user',
        userId: 'user-123',
        userRole: 'customer_owner',
        email: 'test@example.com',
      },
      tenantId: 'tenant-456',
      customerId: 'customer-789',
      requestId: 'request-filter',
      timestamp: new Date('2025-01-06T10:00:00.000Z'),
    };

    it('should output all levels when minLogLevel is DEBUG', () => {
      const logger = new Logger(mockContext, LogLevel.DEBUG);

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(4);
    });

    it('should suppress DEBUG logs when minLogLevel is INFO', () => {
      const logger = new Logger(mockContext, LogLevel.INFO);

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      // DEBUG should be suppressed, only 3 logs
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);

      const levels = consoleLogSpy.mock.calls.map((call) => parseLogEntry(call[0] as string).level);
      expect(levels).toEqual(['INFO', 'WARN', 'ERROR']);
    });

    it('should suppress DEBUG and INFO when minLogLevel is WARN', () => {
      const logger = new Logger(mockContext, LogLevel.WARN);

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);

      const levels = consoleLogSpy.mock.calls.map((call) => parseLogEntry(call[0] as string).level);
      expect(levels).toEqual(['WARN', 'ERROR']);
    });

    it('should only output ERROR when minLogLevel is ERROR', () => {
      const logger = new Logger(mockContext, LogLevel.ERROR);

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.level).toBe('ERROR');
    });

    it('should default to DEBUG when no minLogLevel specified', () => {
      const logger = new Logger(mockContext);

      logger.debug('Debug message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.level).toBe('DEBUG');
    });

    it('should respect LOG_LEVEL environment variable', () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'WARN';

      try {
        const logger = new Logger(mockContext);

        logger.debug('Debug message');
        logger.info('Info message');
        logger.warn('Warn message');

        expect(consoleLogSpy).toHaveBeenCalledOnce();
        const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
        expect(logEntry.level).toBe('WARN');
      } finally {
        // Restore original value
        if (originalLogLevel === undefined) {
          delete process.env.LOG_LEVEL;
        } else {
          process.env.LOG_LEVEL = originalLogLevel;
        }
      }
    });

    it('should allow constructor parameter to override LOG_LEVEL env var', () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'ERROR';

      try {
        const logger = new Logger(mockContext, LogLevel.DEBUG);

        logger.debug('Debug message');

        expect(consoleLogSpy).toHaveBeenCalledOnce();
        const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
        expect(logEntry.level).toBe('DEBUG');
      } finally {
        if (originalLogLevel === undefined) {
          delete process.env.LOG_LEVEL;
        } else {
          process.env.LOG_LEVEL = originalLogLevel;
        }
      }
    });
  });
});

describe('withRequestLogging', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.clearAllMocks();
  });

  const mockContext: TenantContext = {
    actor: {
      type: 'user',
      userId: 'user-123',
      userRole: 'customer_owner',
      email: 'test@example.com',
    },
    tenantId: 'tenant-456',
    customerId: 'customer-789',
    requestId: 'request-pqr',
    timestamp: new Date('2025-01-06T10:00:00.000Z'),
  };

  describe('Success cases', () => {
    it('should log start and completion', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      await withRequestLogging(mockContext, 'testOperation', mockFn);

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);

      const startLog = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      const endLog = parseLogEntry(consoleLogSpy.mock.calls[1][0] as string);

      expect(startLog.level).toBe('INFO');
      expect(startLog.message).toBe('Starting operation: testOperation');

      expect(endLog.level).toBe('INFO');
      expect(endLog.message).toBe('Completed operation: testOperation');
      expect(endLog.context?.operationDuration).toBeGreaterThanOrEqual(0);
    });

    it('should return function result', async () => {
      const mockFn = vi.fn().mockResolvedValue({ id: '123', name: 'Test' });

      const result = await withRequestLogging(mockContext, 'createUser', mockFn);

      expect(result).toEqual({ id: '123', name: 'Test' });
      expect(mockFn).toHaveBeenCalledOnce();
    });

    it('should track operation duration', async () => {
      const mockFn = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'done';
      });

      await withRequestLogging(mockContext, 'slowOperation', mockFn);

      const endLog = parseLogEntry(consoleLogSpy.mock.calls[1][0] as string);
      // Use >= 45 to account for timing precision issues (target was 50ms)
      expect(endLog.context?.operationDuration).toBeGreaterThanOrEqual(45);
      expect(endLog.context?.operationDuration).toBeLessThan(200);
    });
  });

  describe('Error cases', () => {
    it('should log error and re-throw', async () => {
      const mockError = new Error('Operation failed');
      const mockFn = vi.fn().mockRejectedValue(mockError);

      await expect(withRequestLogging(mockContext, 'failingOperation', mockFn)).rejects.toThrow(
        'Operation failed'
      );

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);

      const startLog = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      const errorLog = parseLogEntry(consoleLogSpy.mock.calls[1][0] as string);

      expect(startLog.message).toBe('Starting operation: failingOperation');

      expect(errorLog.level).toBe('ERROR');
      expect(errorLog.message).toBe('Failed operation: failingOperation');
      expect(errorLog.context).toBeDefined();
      expect(errorLog.context?.error).toBe('Operation failed');
      expect(errorLog.context?.stack).toBeDefined();
      expect(errorLog.context?.operationDuration).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-Error exceptions', async () => {
      const mockFn = vi.fn().mockRejectedValue('String error');

      await expect(withRequestLogging(mockContext, 'stringErrorOp', mockFn)).rejects.toBe(
        'String error'
      );

      const errorLog = parseLogEntry(consoleLogSpy.mock.calls[1][0] as string);
      expect(errorLog.context?.error).toBe('String error');
      expect(errorLog.context?.stack).toBeUndefined();
    });

    it('should preserve original error for caller', async () => {
      class CustomError extends Error {
        code = 'CUSTOM_ERROR';
      }
      const customError = new CustomError('Custom failure');
      const mockFn = vi.fn().mockRejectedValue(customError);

      try {
        await withRequestLogging(mockContext, 'customErrorOp', mockFn);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBe(customError);
        expect((error as CustomError).code).toBe('CUSTOM_ERROR');
      }
    });
  });
});
