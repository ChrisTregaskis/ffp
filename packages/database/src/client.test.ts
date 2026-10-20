/**
 * Connection Pool Tests
 *
 * Tests for database client singleton behaviour and connection pooling.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import type { PoolConfig } from 'pg';
import { getDb, closeDb, withDb } from './client';

// The Pool is mocked so the tests read the config it receives and never open a connection.
// The logger reads LOG_LEVEL when the client module loads, so it is pinned before the import.
const { Pool } = vi.hoisted(() => {
  process.env.LOG_LEVEL = 'DEBUG';
  return {
    Pool: vi.fn((_config: PoolConfig) => ({ on: vi.fn(), end: vi.fn(async () => undefined) })),
  };
});

vi.mock('pg', () => ({ Pool }));

const DB_USER_SENTINEL = 'sentinel-db-user-5e1c';
const DB_PASSWORD_SENTINEL = 'sentinel-db-password-9a7f';

const lastPoolConfig = (): PoolConfig => {
  const config = Pool.mock.lastCall?.[0];
  if (!config) {
    throw new Error('No Pool was constructed');
  }
  return config;
};

describe('Database Client', () => {
  // Store original environment variables
  const originalEnv = { ...process.env };

  beforeEach(() => {
    Pool.mockClear();
    // Reset environment to valid state before each test
    process.env = {
      ...originalEnv,
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'ffp_dev',
      DB_USER: DB_USER_SENTINEL,
      DB_PASSWORD: DB_PASSWORD_SENTINEL,
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
    it('verifies the server certificate when DB_SSL=true in production', async () => {
      await closeDb();
      process.env.DB_SSL = 'true';
      process.env.NODE_ENV = 'production';

      getDb();

      expect(lastPoolConfig().ssl).toEqual({ rejectUnauthorized: true });
    });

    it('accepts a self-signed certificate when DB_SSL=true outside production', async () => {
      await closeDb();
      process.env.DB_SSL = 'true';
      process.env.NODE_ENV = 'development';

      getDb();

      expect(lastPoolConfig().ssl).toEqual({ rejectUnauthorized: false });
    });

    it('should disable SSL when DB_SSL=false', async () => {
      await closeDb();
      process.env.DB_SSL = 'false';
      process.env.NODE_ENV = 'production';

      getDb();

      expect(lastPoolConfig().ssl).toBe(false);
    });

    it('should disable SSL when DB_SSL is not set', async () => {
      await closeDb();
      delete process.env.DB_SSL;
      process.env.NODE_ENV = 'production';

      getDb();

      expect(lastPoolConfig().ssl).toBe(false);
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
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      getDb();

      // Logger formats output with colours and prefixes, so check for message content
      expect(consoleInfoSpy).toHaveBeenCalled();
      const logCall = consoleInfoSpy.mock.calls.find((call) =>
        call[0]?.includes('Creating database connection pool')
      );
      expect(logCall).toBeDefined();
      // Check that context is included in the formatted output
      expect(logCall?.[0]).toContain('localhost');
      expect(logCall?.[0]).toContain('ffp_dev');

      consoleInfoSpy.mockRestore();
    });

    it('should log pool closure', async () => {
      getDb(); // Create pool first
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      await closeDb();

      // Logger formats output with colours and prefixes
      expect(consoleInfoSpy).toHaveBeenCalled();
      const logCall = consoleInfoSpy.mock.calls.find((call) =>
        call[0]?.includes('Closing database connection pool')
      );
      expect(logCall).toBeDefined();

      consoleInfoSpy.mockRestore();
    });

    it('should not log credentials', async () => {
      await closeDb();
      const consoleSpies = (['debug', 'info', 'log', 'warn', 'error'] as const).map((method) =>
        vi.spyOn(console, method).mockImplementation(() => {})
      );

      let logged: string;
      try {
        getDb();
        await closeDb();
        logged = consoleSpies
          .flatMap((spy) => spy.mock.calls.flat())
          .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
          .join('\n');
      } finally {
        consoleSpies.forEach((spy) => spy.mockRestore());
      }

      // The sentinels reached the Pool and the creation line was captured, so absence means something
      expect(lastPoolConfig()).toMatchObject({
        user: DB_USER_SENTINEL,
        password: DB_PASSWORD_SENTINEL,
      });
      expect(logged).toContain('Creating database connection pool');
      expect(logged).not.toContain(DB_USER_SENTINEL);
      expect(logged).not.toContain(DB_PASSWORD_SENTINEL);
    });
  });
});
