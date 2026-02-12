import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

// Configure logging
log.transports.file.level = 'info'
autoUpdater.logger = log
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// Explicitly set the provider to GitHub just to be safe
// (Optional if package.json repository is set correct, but good practice)
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'panagiotisspak20-ship-it',
  repo: 'sky-express-va'
})

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: 'Sky Express VA',
    backgroundColor: '#f3f4f6',
    autoHideMenuBar: true,
    icon, // Set icon for all platforms (Windows/Linux)
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
    // Aggressive focus strategy for Windows
    mainWindow.webContents.focus()
    setTimeout(() => {
      mainWindow.focus()
      mainWindow.webContents.focus()
    }, 100)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // --- UPDATER EVENTS (Must be inside createWindow to access mainWindow) ---
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('checking-for-update')
  })

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info)
  })

  autoUpdater.on('update-not-available', (info) => {
    mainWindow.webContents.send('update-not-available', info)
  })

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-error', err.message)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow.webContents.send('download-progress', progressObj)
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update-downloaded', info)
  })

  // Initialize MSFS Service
  import('./msfs')
    .then(({ MsfsService }) => {
      const msfsService = new MsfsService(mainWindow)

      // Handle get-status requests from renderer
      ipcMain.handle('msfs-get-status', () => {
        return msfsService.isConnected()
      })

      // Handle reconnect requests from renderer
      ipcMain.handle('msfs-reconnect', () => {
        console.log('[Main] MSFS reconnect requested')
        msfsService.connect()
      })
    })
    .catch((err) => {
      console.log('[Main] Failed to load MSFS module:', err)
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Data Persistence IPC
  let store
  import('electron-store').then(({ default: Store }) => {
    store = new Store()

    ipcMain.handle('store-get', (_, key) => {
      return store.get(key)
    })

    ipcMain.handle('store-set', (_, key, value) => {
      store.set(key, value)
    })

    ipcMain.handle('store-delete', (_, key) => {
      store.delete(key)
    })
  })

  // Weather IPC
  ipcMain.handle('get-weather', async (_, lat, lon) => {
    try {
      // Use native fetch (Node 18+)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code`
      )
      if (!response.ok) throw new Error('Weather API Error')
      return await response.json()
    } catch (error) {
      console.error('Main Process Weather Fetch Error:', error)
      throw error
    }
  })

  // AirLabs Flight Schedule Fetcher (Added to bypass CORS/Deployment issues)
  ipcMain.handle('fetch-airlabs-schedules', async (_, airlineIata, apiKey) => {
    try {
      if (!airlineIata || !apiKey) throw new Error('Missing arguments')
      console.log(`[Main] Fetching AirLabs schedules for ${airlineIata}`)

      const response = await fetch(
        `https://airlabs.co/api/v9/schedules?airline_iata=${airlineIata}&api_key=${apiKey}`
      )

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`AirLabs API Error: ${response.status} - ${text}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Main Process AirLabs Fetch Error:', error)
      throw error
    }
  })

  // VATSIM METAR Fetcher (Raw Text)
  ipcMain.handle('get-metar', async (_, icao) => {
    try {
      console.log(`[Main] Fetching METAR for ${icao}`)
      const response = await fetch(`https://metar.vatsim.net/${icao}`)
      if (!response.ok) throw new Error('Failed to fetch METAR')
      return await response.text()
    } catch (error) {
      console.error('Main Process METAR Error:', error)
      return 'METAR UNAVAILABLE'
    }
  })

  // --- UPDATER IPC ---
  ipcMain.handle('check-for-update', async (event) => {
    // In dev mode, we can force a check but it might not work as expected without build
    if (is.dev) {
      console.log('[Main] Check for update triggered (Dev Mode)')
      try {
        const result = await autoUpdater.checkForUpdates()
        // If result is null (which happens if dev-app-update.yml is missing or check fails), mock it
        if (!result) {
          console.log('[Main] Dev update check returned null, sending mock signal')
          event.sender.send('update-not-available', { version: '1.0.0' })
        }
        return result
      } catch (error) {
        console.error('[Main] Dev update check failed:', error)
        event.sender.send('update-error', 'Dev Mode: Check failed (likely no latest.yml)')
        return null
      }
    }

    try {
      return await autoUpdater.checkForUpdates()
    } catch (error) {
      console.error('[Main] Update check failed:', error)
      event.sender.send('update-error', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  })

  ipcMain.handle('start-download', () => {
    return autoUpdater.downloadUpdate()
  })

  ipcMain.handle('quit-and-install', () => {
    autoUpdater.quitAndInstall()
  })

  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
