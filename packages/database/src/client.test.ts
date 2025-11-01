/**
 * Connection Pool Tests
 *
 * Tests for database client singleton behaviour and connection pooling.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { getDb, closeDb, withDb } from './client';

describe('Database Client', () => {
  // Store original environment variables
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment to valid state before each test
    process.env = {
      ...originalEnv,
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'ffp_dev',
      DB_USER: 'root_user',
      DB_PASSWORD: 'password',
      DB_SSL: 'false',
      NODE_ENV: 'development',
    };
  });

  afterEach(async () => {
    // Clean up pool after each test
    await closeDb();
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Singleton Behaviour', () => {
    it('should return singleton instance', () => {
      const db1 = getDb();
      const db2 = getDb();

      expect(db1).toBe(db2);
    });

    it('should have correct type', () => {
      const db = getDb();

      // Verify it has the expected Drizzle methods
      expect(db).toHaveProperty('select');
      expect(db).toHaveProperty('insert');
      expect(db).toHaveProperty('update');
      expect(db).toHaveProperty('delete');
    });

    it('should reset instance after closeDb', async () => {
      const db1 = getDb();
      await closeDb();
      const db2 = getDb();

      // After closing, we should get a new instance
      expect(db1).not.toBe(db2);
    });
  });

  describe('Environment Variable Validation', () => {
    it('should throw error for missing DB_HOST', async () => {
      await closeDb(); // Clear any existing instance
      delete process.env.DB_HOST;

      expect(() => getDb()).toThrow('Missing required database environment variables: DB_HOST');
    });

    it('should throw error for missing DB_NAME', async () => {
      await closeDb();
      delete process.env.DB_NAME;

      expect(() => getDb()).toThrow('Missing required database environment variables: DB_NAME');
    });

    it('should throw error for missing DB_USER', async () => {
      await closeDb();
      delete process.env.DB_USER;

      expect(() => getDb()).toThrow('Missing required database environment variables: DB_USER');
    });

    it('should throw error for missing DB_PASSWORD', async () => {
      await closeDb();
      delete process.env.DB_PASSWORD;

      expect(() => getDb()).toThrow('Missing required database environment variables: DB_PASSWORD');
    });

    it('should throw error for multiple missing variables', async () => {
      await closeDb();
      delete process.env.DB_HOST;
      delete process.env.DB_NAME;

      expect(() => getDb()).toThrow(
        'Missing required database environment variables: DB_HOST, DB_NAME'
      );
    });

    it('should throw error for invalid DB_PORT', async () => {
      await closeDb();
      process.env.DB_PORT = 'invalid';

      expect(() => getDb()).toThrow(
        'Invalid DB_PORT: invalid. Must be a number between 1 and 65535.'
      );
    });

    it('should throw error for DB_PORT out of range (too low)', async () => {
      await closeDb();
      process.env.DB_PORT = '0';

      expect(() => getDb()).toThrow('Invalid DB_PORT: 0. Must be a number between 1 and 65535.');
    });

    it('should throw error for DB_PORT out of range (too high)', async () => {
      await closeDb();
      process.env.DB_PORT = '65536';

      expect(() => getDb()).toThrow(
        'Invalid DB_PORT: 65536. Must be a number between 1 and 65535.'
      );
    });

    it('should use default port 5432 when DB_PORT not set', async () => {
      await closeDb();
      delete process.env.DB_PORT;

      // Should not throw - uses default port
      expect(() => getDb()).not.toThrow();
    });
  });

  describe('SSL Configuration', () => {
    it('should enable SSL when DB_SSL=true in production', async () => {
      await closeDb();
      process.env.DB_SSL = 'true';
      process.env.NODE_ENV = 'production';

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      getDb();

      // Verify logging shows SSL enabled with certificate verification
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Creating database connection pool',
        expect.objectContaining({
          ssl: true,
          sslRejectUnauthorized: true,
        })
      );

      consoleLogSpy.mockRestore();
    });

    it('should enable SSL without certificate verification in development', async () => {
      await closeDb();
      process.env.DB_SSL = 'true';
      process.env.NODE_ENV = 'development';

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      getDb();

      // Verify logging shows SSL enabled but without certificate verification
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Creating database connection pool',
        expect.objectContaining({
          ssl: true,
          sslRejectUnauthorized: false,
        })
      );

      consoleLogSpy.mockRestore();
    });

    it('should disable SSL when DB_SSL=false', async () => {
      await closeDb();
      process.env.DB_SSL = 'false';

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      getDb();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Creating database connection pool',
        expect.objectContaining({
          ssl: false,
        })
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('withDb Helper', () => {
    it('should execute callback with database instance', async () => {
      const result = await withDb(async (db) => {
        expect(db).toHaveProperty('select');
        return 'success';
      });

      expect(result).toBe('success');
    });

    it('should propagate errors from callback', async () => {
      await expect(
        withDb(async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });

    it('should return callback result', async () => {
      const result = await withDb(async () => {
        return { data: 'test' };
      });

      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('Logging', () => {
    it('should log pool creation', async () => {
      await closeDb();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      getDb();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Creating database connection pool',
        expect.objectContaining({
          host: 'localhost',
          port: 5432,
          database: 'ffp_dev',
          max: 10,
        })
      );

      consoleLogSpy.mockRestore();
    });

    it('should log pool closure', async () => {
      getDb(); // Create pool first
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await closeDb();

      expect(consoleLogSpy).toHaveBeenCalledWith('Closing database connection pool');

      consoleLogSpy.mockRestore();
    });

    it('should not log credentials', async () => {
      await closeDb();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      getDb();

      // Verify that credentials are NOT in the log output
      const logCalls = consoleLogSpy.mock.calls;
      const poolCreationLog = logCalls.find(
        (call) => call[0] === 'Creating database connection pool'
      );

      expect(poolCreationLog).toBeDefined();
      expect(poolCreationLog?.[1]).not.toHaveProperty('user');
      expect(poolCreationLog?.[1]).not.toHaveProperty('password');

      consoleLogSpy.mockRestore();
    });
  });
});
