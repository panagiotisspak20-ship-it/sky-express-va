interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ADMIN_CODE?: string
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
      onData: (callback: (data: any) => void) => () => void
      onStatus: (callback: (status: boolean) => void) => () => void
      onLanding: (
        callback: (report: { rate: number; location: string; timestamp: string }) => void
      ) => () => void
      onFlightComplete?: (callback: (data: any) => void) => () => void
      getStatus: () => Promise<boolean>
      removeListeners: () => void
    }
    weather: {
      get: (lat: number, lon: number) => Promise<any>
      getMetar: (icao: string) => Promise<string>
    }
    vatsim: {
      getPilot: (vatsimId: string) => Promise<any>
      getAllPilots: () => Promise<any>
    }
    airlabs: {
      getSchedules: (airlineIata: string, apiKey: string) => Promise<any>
    }
    updater: {
      getAppVersion: () => Promise<string>
      checkForUpdates: () => Promise<any>
      downloadUpdate: () => Promise<any>
      quitAndInstall: () => Promise<void>
      onChecking: (callback: () => void) => () => void
      onUpdateAvailable: (callback: (info: any) => void) => () => void
      onUpdateNotAvailable: (callback: (info: any) => void) => () => void
      onError: (callback: (err: string) => void) => () => void
      onDownloadProgress: (callback: (progress: any) => void) => () => void
      onUpdateDownloaded: (callback: (info: any) => void) => () => void
    }
  }
}

declare module '*.png' {
  const value: string
  export default value
}

declare module '*.webp' {
  const value: string
  export default value
}

declare module '*.svg' {
  const value: string
  export default value
}
