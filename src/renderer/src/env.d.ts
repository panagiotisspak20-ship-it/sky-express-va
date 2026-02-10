interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  electron: any
  api: {
    store: {
      get: (key: string) => Promise<any>
      set: (key: string, value: any) => Promise<void>
      delete: (key: string) => Promise<void>
    }
    msfs: {
      onData: (callback: (data: any) => void) => void
      onStatus: (callback: (status: boolean) => void) => void
      onLanding: (
        callback: (report: { rate: number; location: string; timestamp: string }) => void
      ) => void
      removeListeners: () => void
    }
    weather: {
      get: (lat: number, lon: number) => Promise<any>
    }
  }
}

declare module '*.png' {
  const value: string
  export default value
}
