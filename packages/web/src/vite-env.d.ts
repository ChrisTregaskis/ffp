/// <reference types="vite/client" />

// Allow JSON imports for Icomoon assets
declare module '*.json';

// Type definitions for environment variables
interface ImportMetaEnv {
  readonly VITE_COGNITO_USER_POOL_ID: string;
  readonly VITE_COGNITO_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
