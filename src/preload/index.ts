import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  store: {
    get: (key: string) => ipcRenderer.invoke('store-get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store-set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store-delete', key)
  },
  msfs: {
    onData: (callback: (data: any) => void) => {
      const listener = (_: any, data: any) => callback(data)
      ipcRenderer.on('msfs-data', listener)
      return () => ipcRenderer.removeListener('msfs-data', listener)
    },
    onStatus: (callback: (status: boolean) => void) => {
      const listener = (_: any, status: boolean) => callback(status)
      ipcRenderer.on('msfs-status', listener)
      return () => ipcRenderer.removeListener('msfs-status', listener)
    },
    onLanding: (callback: (report: any) => void) => {
      const listener = (_: any, report: any) => callback(report)
      ipcRenderer.on('landing-report', listener)
      return () => ipcRenderer.removeListener('landing-report', listener)
    },
    onFlightComplete: (callback: (data: any) => void) => {
      const listener = (_: any, data: any) => callback(data)
      ipcRenderer.on('flight-complete', listener)
      return () => ipcRenderer.removeListener('flight-complete', listener)
    },
    onFlightPenalty: (callback: (data: any) => void) => {
      const listener = (_: any, data: any) => callback(data)
      ipcRenderer.on('flight-penalty', listener)
      return () => ipcRenderer.removeListener('flight-penalty', listener)
    },
    onFlightStarted: (callback: (data: any) => void) => {
      const listener = (_: any, data: any) => callback(data)
      ipcRenderer.on('flight-started', listener)
      return () => ipcRenderer.removeListener('flight-started', listener)
    },
    onError: (callback: (error: string | null) => void) => {
      const listener = (_: any, error: any) => callback(error)
      ipcRenderer.on('msfs-error', listener)
      return () => ipcRenderer.removeListener('msfs-error', listener)
    },
    onDebug: (callback: (msg: string) => void) => {
      const listener = (_: any, msg: any) => callback(msg)
      ipcRenderer.on('msfs-debug', listener)
      return () => ipcRenderer.removeListener('msfs-debug', listener)
    },
    getStatus: () => ipcRenderer.invoke('msfs-get-status'),
    reconnect: () => ipcRenderer.invoke('msfs-reconnect'),
    removeListeners: () => {
      ipcRenderer.removeAllListeners('msfs-data')
      ipcRenderer.removeAllListeners('msfs-status')
      ipcRenderer.removeAllListeners('landing-report')
      ipcRenderer.removeAllListeners('flight-complete')
      ipcRenderer.removeAllListeners('flight-penalty')
      ipcRenderer.removeAllListeners('flight-started')
      ipcRenderer.removeAllListeners('msfs-error')
    }
  },
  weather: {
    get: (lat: number, lon: number) => ipcRenderer.invoke('get-weather', lat, lon),
    getMetar: (icao: string) => ipcRenderer.invoke('get-metar', icao)
  },
  vatsim: {
    getPilot: (vatsimId: string) => ipcRenderer.invoke('vatsim-get-pilot', vatsimId),
    getAllPilots: () => ipcRenderer.invoke('vatsim-get-all')
  },
  airlabs: {
    getSchedules: (airlineIata: string, apiKey: string) =>
      ipcRenderer.invoke('fetch-airlabs-schedules', airlineIata, apiKey)
  },
  updater: {
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    checkForUpdates: () => ipcRenderer.invoke('check-for-update'),
    downloadUpdate: () => ipcRenderer.invoke('start-download'),
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
    onChecking: (callback: () => void) => {
      const listener = (_: any) => callback()
      ipcRenderer.on('checking-for-update', listener)
      return () => ipcRenderer.removeListener('checking-for-update', listener)
    },
    onUpdateAvailable: (callback: (info: any) => void) => {
      const listener = (_: any, info: any) => callback(info)
      ipcRenderer.on('update-available', listener)
      return () => ipcRenderer.removeListener('update-available', listener)
    },
    onUpdateNotAvailable: (callback: (info: any) => void) => {
      const listener = (_: any, info: any) => callback(info)
      ipcRenderer.on('update-not-available', listener)
      return () => ipcRenderer.removeListener('update-not-available', listener)
    },
    onError: (callback: (err: string) => void) => {
      const listener = (_: any, err: any) => callback(err)
      ipcRenderer.on('update-error', listener)
      return () => ipcRenderer.removeListener('update-error', listener)
    },
    onDownloadProgress: (callback: (progress: any) => void) => {
      const listener = (_: any, progress: any) => callback(progress)
      ipcRenderer.on('download-progress', listener)
      return () => ipcRenderer.removeListener('download-progress', listener)
    },
    onUpdateDownloaded: (callback: (info: any) => void) => {
      const listener = (_: any, info: any) => callback(info)
      ipcRenderer.on('update-downloaded', listener)
      return () => ipcRenderer.removeListener('update-downloaded', listener)
    }
  }
}

// Expose minimal safe ipcRenderer alongside api to maintain compatibility if anything expects electron.ipcRenderer
const exposedElectron = {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', exposedElectron)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = exposedElectron
  // @ts-ignore (define in dts)
  window.api = api
}
