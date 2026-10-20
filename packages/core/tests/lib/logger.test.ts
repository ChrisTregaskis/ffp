/**
 * Unit tests for structured logging
 *
 * Tests createLogger to ensure:
 * - Correct JSON output format for CloudWatch
 * - Actor-aware logging (user vs system)
 * - Request ID and organisation ID tracking
 * - Performance timing (duration)
 * - Log levels (DEBUG, INFO, WARN, ERROR)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createLogger, LogLevel } from '../../src/lib/logger';

import type { OrganisationContext } from '../../src/lib/context';

/**
 * Helper interface for typed log entry parsing in tests
 */
interface ParsedLogEntry {
  timestamp: string;
  level: string;
  message: string;
  requestId: string;
  organisationId: string;
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
  if (typeof entry.organisationId !== 'string') {
    throw new Error('Log entry missing or invalid organisationId');
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
    organisationId: entry.organisationId,
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
    const mockUserContext: OrganisationContext = {
      actor: {
        type: 'user',
        userId: 'user-123',
        userRole: 'customer_owner',
        email: 'test@example.com',
      },
      organisationId: 'tenant-456',
      locationId: 'customer-789',
      requestId: 'request-abc',
      timestamp: new Date('2025-01-06T10:00:00.000Z'),
    };

    it('should log info message with user actor', () => {
      const logger = createLogger(mockUserContext);
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry).toMatchObject({
        level: 'INFO',
        message: 'Test message',
        requestId: 'request-abc',
        organisationId: 'tenant-456',
        actor: 'test@example.com (customer_owner)',
      });
      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.duration).toBeGreaterThanOrEqual(0);
    });

    it('should include additional context', () => {
      const logger = createLogger(mockUserContext);
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
      const logger = createLogger(mockUserContext);
      logger.info('Test message', {});

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.context).toBeUndefined();
    });

    it('should not include triggeredBy for user actors', () => {
      const logger = createLogger(mockUserContext);
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.triggeredBy).toBeUndefined();
    });
  });

  describe('SystemActor logging', () => {
    const mockSystemContext: OrganisationContext = {
      actor: {
        type: 'system',
        systemId: 'assessment-processor',
        triggeredBy: 'user-123',
        jobId: 'job-xyz',
      },
      organisationId: 'tenant-456',
      locationId: null,
      requestId: 'request-def',
      timestamp: new Date('2025-01-06T10:00:00.000Z'),
    };

    it('should log with system actor display name', () => {
      const logger = createLogger(mockSystemContext);
      logger.info('Processing assessment');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.actor).toBe('System: assessment-processor');
    });

    it('should include triggeredBy when present', () => {
      const logger = createLogger(mockSystemContext);
      logger.info('Processing assessment');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.triggeredBy).toBe('user-123');
    });

    it('should not include triggeredBy when absent', () => {
      const systemContextNoTrigger: OrganisationContext = {
        ...mockSystemContext,
        actor: {
          type: 'system',
          systemId: 'daily-report-job',
        },
      };

      const logger = createLogger(systemContextNoTrigger);
      logger.info('Generating daily report');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.triggeredBy).toBeUndefined();
    });
  });

  describe('log() method', () => {
    const mockContext: OrganisationContext = {
      actor: {
        type: 'user',
        userId: 'user-123',
        userRole: 'super_admin',
        email: 'admin@example.com',
      },
      organisationId: 'tenant-456',
      locationId: null,
      requestId: 'request-ghi',
      timestamp: new Date('2025-01-06T10:00:00.000Z'),
    };

    it('should support all log levels via log() method', () => {
      const logger = createLogger(mockContext);

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
      const mockContext: OrganisationContext = {
        actor: {
          type: 'user',
          userId: 'user-123',
          userRole: 'customer_owner',
          email: 'test@example.com',
        },
        organisationId: 'tenant-456',
        locationId: 'customer-789',
        requestId: 'request-jkl',
        timestamp: new Date(Date.now() - 100), // 100ms ago
      };

      const logger = createLogger(mockContext);

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
    const mockContext: OrganisationContext = {
      actor: {
        type: 'user',
        userId: 'user-123',
        userRole: 'customer_owner',
        email: 'test@example.com',
      },
      organisationId: 'tenant-456',
      locationId: 'customer-789',
      requestId: 'request-mno',
      timestamp: new Date('2025-01-06T10:00:00.000Z'),
    };

    it('should have correct CloudWatch structure', () => {
      const logger = createLogger(mockContext);
      logger.info('Test message', { key: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);

      // Required fields
      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.level).toBeDefined();
      expect(logEntry.message).toBeDefined();
      expect(logEntry.requestId).toBeDefined();
      expect(logEntry.organisationId).toBeDefined();
      expect(logEntry.actor).toBeDefined();
      expect(logEntry.duration).toBeDefined();

      // Timestamp should be ISO format
      expect(new Date(logEntry.timestamp).toISOString()).toBe(logEntry.timestamp);
    });
  });

  describe('Log level filtering', () => {
    const mockContext: OrganisationContext = {
      actor: {
        type: 'user',
        userId: 'user-123',
        userRole: 'customer_owner',
        email: 'test@example.com',
      },
      organisationId: 'tenant-456',
      locationId: 'customer-789',
      requestId: 'request-filter',
      timestamp: new Date('2025-01-06T10:00:00.000Z'),
    };

    it('should output all levels when minLogLevel is DEBUG', () => {
      const logger = createLogger(mockContext, LogLevel.DEBUG);

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(4);
    });

    it('should suppress DEBUG logs when minLogLevel is INFO', () => {
      const logger = createLogger(mockContext, LogLevel.INFO);

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
      const logger = createLogger(mockContext, LogLevel.WARN);

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);

      const levels = consoleLogSpy.mock.calls.map((call) => parseLogEntry(call[0] as string).level);
      expect(levels).toEqual(['WARN', 'ERROR']);
    });

    it('should only output ERROR when minLogLevel is ERROR', () => {
      const logger = createLogger(mockContext, LogLevel.ERROR);

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.level).toBe('ERROR');
    });

    it('should default to DEBUG when no minLogLevel specified', () => {
      const logger = createLogger(mockContext);

      logger.debug('Debug message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logEntry = parseLogEntry(consoleLogSpy.mock.calls[0][0] as string);
      expect(logEntry.level).toBe('DEBUG');
    });

    it('should respect LOG_LEVEL environment variable', () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'WARN';

      try {
        const logger = createLogger(mockContext);

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
        const logger = createLogger(mockContext, LogLevel.DEBUG);

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
