import path from 'path';

/**
 * Creates alias configuration for the web package internal paths
 * Uses @web/ namespace to avoid any future conflicts with core package
 */
export function createWebAliasConfig(packageRoot: string): Record<string, string> {
  return {
    // Web package internal aliases with explicit namespace
    '@web/components': path.resolve(packageRoot, 'src/components'),
    '@web/hooks': path.resolve(packageRoot, 'src/hooks'),
    '@web/pages': path.resolve(packageRoot, 'src/pages'),
    '@web/assets': path.resolve(packageRoot, 'src/assets'),

    // Future-ready aliases for common directories
    '@web/utils': path.resolve(packageRoot, 'src/utils'),
    '@web/types': path.resolve(packageRoot, 'src/types'),
    '@web/services': path.resolve(packageRoot, 'src/services'),
    '@web/lib': path.resolve(packageRoot, 'src/lib'),
  };
}

/**
 * Creates alias configuration for core package paths
 * Uses @core/ namespace to avoid conflicts and provide clear separation
 */
export function createCoreAliasConfig(corePackageRoot: string): Record<string, string> {
  return {
    // Core package workspace import
    '@ffp/core': path.resolve(corePackageRoot, 'src'),

    // Core package internal aliases with explicit namespace
    '@core/lib': path.resolve(corePackageRoot, 'src/lib'),
    '@core/types': path.resolve(corePackageRoot, 'src/types'),
    '@core/utils': path.resolve(corePackageRoot, 'src/utils'),
    '@core/services': path.resolve(corePackageRoot, 'src/services'),
    '@core/repositories': path.resolve(corePackageRoot, 'src/repositories'),
  };
}

/**
 * Creates the complete Vite alias configuration
 * Uses explicit namespaces (@web/ and @core/) to prevent any conflicts
 * This approach is future-proof and scalable as packages grow
 */
export function createViteAliasConfig(packageRoot: string): Record<string, string> {
  const corePackageRoot = path.resolve(packageRoot, '../core');

  return {
    ...createWebAliasConfig(packageRoot),
    ...createCoreAliasConfig(corePackageRoot),
  };
}
