/// <reference types="vite/client" />

// Allow JSON imports for Icomoon assets
declare module '*.json';

// Type definitions for environment variables
interface ImportMetaEnv {
  readonly VITE_COGNITO_USER_POOL_ID: string;
  readonly VITE_COGNITO_CLIENT_ID: string;
  // 'true' only in the showcase build, which keeps the dev-only prototype routes.
  readonly VITE_SHOWCASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
