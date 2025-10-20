import path from "path";

/**
 * Creates alias configuration for the web package
 */
export function createWebAliasConfig(packageRoot: string) {
  return {
    // Web package internal aliases
    "@/components": path.resolve(packageRoot, "src/components"),
    "@/hooks": path.resolve(packageRoot, "src/hooks"),
    "@/pages": path.resolve(packageRoot, "src/pages"),
    "@/utils": path.resolve(packageRoot, "src/utils"),
    "@/types": path.resolve(packageRoot, "src/types"),
    "@/services": path.resolve(packageRoot, "src/services"),
  };
}

/**
 * Creates alias configuration for core package internals
 * Uses a different namespace to avoid conflicts with web aliases
 */
export function createCoreAliasConfig(corePackageRoot: string) {
  return {
    // Core package workspace import
    "@ffp/core": path.resolve(corePackageRoot, "src"),

    // Core internal aliases with @core/ namespace to avoid conflicts
    "@core/lib": path.resolve(corePackageRoot, "src/lib"),
    "@core/types": path.resolve(corePackageRoot, "src/types"),
    "@core/utils": path.resolve(corePackageRoot, "src/utils"),
    "@core/services": path.resolve(corePackageRoot, "src/services"),
    "@core/repositories": path.resolve(corePackageRoot, "src/repositories"),

    // Keep original @/ aliases for core package compatibility
    // These will only be used when processing core files and web aliases don't match
    "@/lib": path.resolve(corePackageRoot, "src/lib"),
    "@/repositories": path.resolve(corePackageRoot, "src/repositories"),
  };
}

/**
 * Creates the complete Vite alias configuration
 */
export function createViteAliasConfig(packageRoot: string) {
  const corePackageRoot = path.resolve(packageRoot, "../core");

  return {
    ...createWebAliasConfig(packageRoot),
    ...createCoreAliasConfig(corePackageRoot),
  };
}
