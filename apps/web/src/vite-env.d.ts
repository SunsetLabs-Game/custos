/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional pre-funded Nile testnet key so a fresh browser can send immediately. */
  readonly VITE_TRON_DEMO_PRIVATE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
