import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    weather: {
      get: (lat: number, lon: number) => Promise<any>
      getMetar: (icao: string) => Promise<string>
    }
    updater: {
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
