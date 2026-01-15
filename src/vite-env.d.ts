/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __BUILD_NUMBER__: string;
declare const __BUILD_SHA__: string;
declare const __BUILD_TIME__: string;

interface ImportMetaEnv {
  readonly VITE_HA_URL: string;
  readonly VITE_HA_TOKEN: string;
  readonly VITE_OPENWEATHER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
