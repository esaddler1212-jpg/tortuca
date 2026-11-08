/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VANTAGE_CONSOLE_URL?: string;
  readonly VITE_CITY_NIGHTS_URL?: string;
  readonly VITE_FLIGHT_NEMULATOR_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
