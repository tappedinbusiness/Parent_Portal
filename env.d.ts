// Type declarations for Vite environment variables
// Place this file at the project root (or src/) so TypeScript can pick it up.

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
  // add other VITE_ variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Allow importing image assets (png, jpg, svg, etc.) in TypeScript
declare module '*.png' {
  const value: string;
  export default value;
}
declare module '*.jpg' {
  const value: string;
  export default value;
}
declare module '*.jpeg' {
  const value: string;
  export default value;
}
declare module '*.svg' {
  const value: string;
  export default value;
}
