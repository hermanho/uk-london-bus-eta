/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OSM_PROVIDER_URL: string
  readonly VITE_OSM_PROVIDER_URL_DARK: string
  readonly VITE_OSM_PROVIDER_HOST: string
  readonly VITE_COMMIT_HASH: string
  readonly VITE_VERSION: string
  readonly VITE_COMMIT_MESSAGE: string
  readonly VITE_REPO_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
