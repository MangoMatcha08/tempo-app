
/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
  readonly VITE_DEBUG_TESTS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Ensure the global vi object is defined properly in TypeScript
declare global {
  var vi: typeof import('vitest')['vi'];
  namespace Vi {
    export interface Assertion extends jest.Matchers<any, any> {}
    export interface AsymmetricMatchersContaining extends jest.Matchers<any, any> {}
  }
}

