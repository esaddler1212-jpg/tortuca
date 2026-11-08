/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BOYS_API_URL?: string;
  readonly VITE_VANTAGE_CONSOLE_URL?: string;
  readonly VITE_BOYS_CONSOLE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
