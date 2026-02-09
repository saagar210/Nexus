import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import started from 'electron-squirrel-startup'
import { initDatabase, closeDatabase } from './database/connection'
import { getOrCreateDefaultWorkspace, listWorkspaces, getWorkspace } from './database/queries/workspaces'
import { saveRequest, getRequest, listRequests, deleteRequest } from './database/queries/requests'
import { saveHistoryEntry, listHistory } from './database/queries/history'
import { executeRequest, cancelActiveRequest } from './ipc/http-client'

if (started) app.quit()

let mainWindow: BrowserWindow | null = null

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Nexus',
    backgroundColor: '#09090b',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    )
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }
}

function wrapHandler<T>(fn: () => T): (_event: Electron.IpcMainInvokeEvent) => Promise<{ success: true; data: T } | { success: false; error: string }>
function wrapHandler<A, T>(fn: (args: A) => T): (_event: Electron.IpcMainInvokeEvent, args: A) => Promise<{ success: true; data: T } | { success: false; error: string }>
function wrapHandler<A, T>(fn: (args?: A) => T) {
  return async (_event: Electron.IpcMainInvokeEvent, args?: A) => {
    try {
      const data = fn(args)
      return { success: true, data }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
    }
  }
}

function registerIpcHandlers(): void {
  // System
  ipcMain.handle('app:ping', async () => {
    return { success: true, data: { timestamp: Date.now() } }
  })

  // Workspaces
  ipcMain.handle('db:workspace:list', wrapHandler(listWorkspaces))
  ipcMain.handle('db:workspace:get', wrapHandler((args: { id: string }) => getWorkspace(args.id)))
  ipcMain.handle('db:workspace:getDefault', wrapHandler(getOrCreateDefaultWorkspace))

  // Requests
  ipcMain.handle('db:request:save', wrapHandler((args: Omit<import('@shared/ipc-types').SavedRequest, 'createdAt' | 'updatedAt'>) => saveRequest(args)))
  ipcMain.handle('db:request:get', wrapHandler((args: { id: string }) => getRequest(args.id)))
  ipcMain.handle('db:request:list', wrapHandler((args: { workspaceId: string }) => listRequests(args.workspaceId)))
  ipcMain.handle('db:request:delete', wrapHandler((args: { id: string }) => deleteRequest(args.id)))

  // HTTP
  ipcMain.handle('http:execute', async (_event, args: import('@shared/ipc-types').HttpRequest) => {
    return executeRequest(args)
  })
  ipcMain.handle('http:cancel', async () => {
    try {
      cancelActiveRequest()
      return { success: true, data: undefined }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
    }
  })

  // History
  ipcMain.handle('db:history:save', wrapHandler((args: Omit<import('@shared/ipc-types').HistoryEntry, 'id' | 'executedAt'>) => saveHistoryEntry(args)))
  ipcMain.handle('db:history:list', wrapHandler((args: { workspaceId: string; limit?: number }) => listHistory(args.workspaceId, args.limit)))
}

app.whenReady().then(() => {
  initDatabase()
  registerIpcHandlers()
  createWindow()
})

app.on('before-quit', () => {
  closeDatabase()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
