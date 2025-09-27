/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_MAPBOX_TOKEN: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_OPENWEATHER_API_KEY?: string
  readonly VITE_NASA_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
