// Type declarations for Vite environment variables
// Place this file at the project root (or src/) so TypeScript can pick it up.

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string;
  // add other VITE_ variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
