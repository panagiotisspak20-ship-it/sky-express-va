import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  store: {
    get: (key: string) => electronAPI.ipcRenderer.invoke('store-get', key),
    set: (key: string, value: any) => electronAPI.ipcRenderer.invoke('store-set', key, value),
    delete: (key: string) => electronAPI.ipcRenderer.invoke('store-delete', key)
  },
  msfs: {
    onData: (callback: (data: any) => void) => {
      const listener = (_: any, data: any) => callback(data)
      electronAPI.ipcRenderer.on('msfs-data', listener)
      return () => electronAPI.ipcRenderer.removeListener('msfs-data', listener)
    },
    onStatus: (callback: (status: boolean) => void) => {
      const listener = (_: any, status: boolean) => callback(status)
      electronAPI.ipcRenderer.on('msfs-status', listener)
      return () => electronAPI.ipcRenderer.removeListener('msfs-status', listener)
    },
    onLanding: (callback: (report: any) => void) => {
      const listener = (_: any, report: any) => callback(report)
      electronAPI.ipcRenderer.on('landing-report', listener)
      return () => electronAPI.ipcRenderer.removeListener('landing-report', listener)
    },
    onFlightComplete: (callback: (data: any) => void) => {
      const listener = (_: any, data: any) => callback(data)
      electronAPI.ipcRenderer.on('flight-complete', listener)
      return () => electronAPI.ipcRenderer.removeListener('flight-complete', listener)
    },
    onError: (callback: (error: string | null) => void) => {
      const listener = (_: any, error: any) => callback(error)
      electronAPI.ipcRenderer.on('msfs-error', listener)
      return () => electronAPI.ipcRenderer.removeListener('msfs-error', listener)
    },
    getStatus: () => electronAPI.ipcRenderer.invoke('msfs-get-status'),
    reconnect: () => electronAPI.ipcRenderer.invoke('msfs-reconnect'),
    removeListeners: () => {
      electronAPI.ipcRenderer.removeAllListeners('msfs-data')
      electronAPI.ipcRenderer.removeAllListeners('msfs-status')
      electronAPI.ipcRenderer.removeAllListeners('landing-report')
      electronAPI.ipcRenderer.removeAllListeners('flight-complete')
      electronAPI.ipcRenderer.removeAllListeners('msfs-error')
    }
  },
  weather: {
    get: (lat: number, lon: number) => electronAPI.ipcRenderer.invoke('get-weather', lat, lon),
    getMetar: (icao: string) => electronAPI.ipcRenderer.invoke('get-metar', icao)
  },
  airlabs: {
    getSchedules: (airlineIata: string, apiKey: string) => electronAPI.ipcRenderer.invoke('fetch-airlabs-schedules', airlineIata, apiKey) 
  },
  updater: {
    checkForUpdates: () => electronAPI.ipcRenderer.invoke('check-for-update'),
    downloadUpdate: () => electronAPI.ipcRenderer.invoke('start-download'),
    quitAndInstall: () => electronAPI.ipcRenderer.invoke('quit-and-install'),
    onChecking: (callback: () => void) => {
      const listener = (_: any) => callback()
      electronAPI.ipcRenderer.on('checking-for-update', listener)
      return () => electronAPI.ipcRenderer.removeListener('checking-for-update', listener)
    },
    onUpdateAvailable: (callback: (info: any) => void) => {
      const listener = (_: any, info: any) => callback(info)
      electronAPI.ipcRenderer.on('update-available', listener)
      return () => electronAPI.ipcRenderer.removeListener('update-available', listener)
    },
    onUpdateNotAvailable: (callback: (info: any) => void) => {
      const listener = (_: any, info: any) => callback(info)
      electronAPI.ipcRenderer.on('update-not-available', listener)
      return () => electronAPI.ipcRenderer.removeListener('update-not-available', listener)
    },
    onError: (callback: (err: string) => void) => {
      const listener = (_: any, err: any) => callback(err)
      electronAPI.ipcRenderer.on('update-error', listener)
      return () => electronAPI.ipcRenderer.removeListener('update-error', listener)
    },
    onDownloadProgress: (callback: (progress: any) => void) => {
      const listener = (_: any, progress: any) => callback(progress)
      electronAPI.ipcRenderer.on('download-progress', listener)
      return () => electronAPI.ipcRenderer.removeListener('download-progress', listener)
    },
    onUpdateDownloaded: (callback: (info: any) => void) => {
      const listener = (_: any, info: any) => callback(info)
      electronAPI.ipcRenderer.on('update-downloaded', listener)
      return () => electronAPI.ipcRenderer.removeListener('update-downloaded', listener)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
