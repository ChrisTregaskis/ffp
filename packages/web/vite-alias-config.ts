import path from "path";

/**
 * Generates alias configuration for Vite based on TypeScript path mappings
 * This utility helps maintain consistency between TypeScript and Vite configurations
 */
export function createAliasConfig(packageRoot: string) {
  const corePackageRoot = path.resolve(packageRoot, "../core");

  return {
    // Workspace imports - point to source during development for HMR
    "@ffp/core": path.resolve(corePackageRoot, "src"),

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
 * Creates aliases for core package internals when processing core source files
 * This mirrors the path mappings defined in the core package's tsconfig.json
 */
export function createCoreInternalAliases(corePackageRoot: string) {
  return {
    "@/lib": path.resolve(corePackageRoot, "src/lib"),
    "@/types": path.resolve(corePackageRoot, "src/types"),
    "@/utils": path.resolve(corePackageRoot, "src/utils"),
    "@/services": path.resolve(corePackageRoot, "src/services"),
    "@/repositories": path.resolve(corePackageRoot, "src/repositories"),
  };
}
