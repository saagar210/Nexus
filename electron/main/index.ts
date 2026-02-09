import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import started from 'electron-squirrel-startup'
import { initDatabase, closeDatabase } from './database/connection'
import { getOrCreateDefaultWorkspace, listWorkspaces, getWorkspace } from './database/queries/workspaces'
import { saveRequest, getRequest, listRequests, deleteRequest, reorderRequests } from './database/queries/requests'
import { saveHistoryEntry, listHistory } from './database/queries/history'
import { listCollections, createCollection, updateCollection, deleteCollection, reorderCollections } from './database/queries/collections'
import { listEnvironments, createEnvironment, updateEnvironment, deleteEnvironment, setActiveEnvironment, getActiveEnvironment, listVariables, setVariable, deleteVariable, getResolvedVariables } from './database/queries/environments'
import { listDiscoveredEndpoints, clearDiscoveredEndpoints } from './database/queries/discovery'
import { executeRequest, cancelActiveRequest } from './ipc/http-client'
import { importPostmanCollection } from './services/postman-importer'
import { startDiscovery, cancelDiscovery } from './services/discovery-engine'

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

  // Collections
  ipcMain.handle('db:collection:list', wrapHandler((args: { workspaceId: string }) => listCollections(args.workspaceId)))
  ipcMain.handle('db:collection:create', wrapHandler((args: { workspaceId: string; parentId?: string | null; name: string; description?: string | null }) => createCollection(args)))
  ipcMain.handle('db:collection:update', wrapHandler((args: { id: string; name?: string; parentId?: string | null; sortOrder?: number; description?: string | null }) => updateCollection(args.id, args)))
  ipcMain.handle('db:collection:delete', wrapHandler((args: { id: string }) => deleteCollection(args.id)))
  ipcMain.handle('db:collection:reorder', wrapHandler((args: { items: Array<{ id: string; sortOrder: number; parentId?: string | null }> }) => reorderCollections(args.items)))

  // Requests
  ipcMain.handle('db:request:save', wrapHandler((args: Omit<import('@shared/ipc-types').SavedRequest, 'createdAt' | 'updatedAt'>) => saveRequest(args)))
  ipcMain.handle('db:request:get', wrapHandler((args: { id: string }) => getRequest(args.id)))
  ipcMain.handle('db:request:list', wrapHandler((args: { workspaceId: string; collectionId?: string | null }) => listRequests(args.workspaceId, args.collectionId)))
  ipcMain.handle('db:request:delete', wrapHandler((args: { id: string }) => deleteRequest(args.id)))
  ipcMain.handle('db:request:reorder', wrapHandler((args: { items: Array<{ id: string; sortOrder: number; collectionId?: string | null }> }) => reorderRequests(args.items)))

  // Environments
  ipcMain.handle('db:env:list', wrapHandler((args: { workspaceId: string }) => listEnvironments(args.workspaceId)))
  ipcMain.handle('db:env:create', wrapHandler((args: { workspaceId: string; name: string }) => createEnvironment(args)))
  ipcMain.handle('db:env:update', wrapHandler((args: { id: string; name: string }) => updateEnvironment(args.id, { name: args.name })))
  ipcMain.handle('db:env:delete', wrapHandler((args: { id: string }) => deleteEnvironment(args.id)))
  ipcMain.handle('db:env:setActive', wrapHandler((args: { workspaceId: string; environmentId: string | null }) => setActiveEnvironment(args.workspaceId, args.environmentId)))
  ipcMain.handle('db:env:getActive', wrapHandler((args: { workspaceId: string }) => getActiveEnvironment(args.workspaceId)))
  ipcMain.handle('db:env:variables:list', wrapHandler((args: { environmentId: string }) => listVariables(args.environmentId)))
  ipcMain.handle('db:env:variables:set', wrapHandler((args: { environmentId: string; key: string; value: string; isSecret?: boolean }) => setVariable(args.environmentId, args.key, args.value, args.isSecret)))
  ipcMain.handle('db:env:variables:delete', wrapHandler((args: { id: string }) => deleteVariable(args.id)))
  ipcMain.handle('db:env:resolvedVariables', wrapHandler((args: { workspaceId: string }) => getResolvedVariables(args.workspaceId)))

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

  // Discovery
  ipcMain.handle('discovery:start', async (_event, args: { workspaceId: string; baseUrl: string }) => {
    return startDiscovery(args.workspaceId, args.baseUrl, mainWindow!)
  })
  ipcMain.handle('discovery:cancel', async () => {
    try {
      cancelDiscovery()
      return { success: true as const, data: undefined }
    } catch (e) {
      return { success: false as const, error: e instanceof Error ? e.message : 'Unknown error' }
    }
  })
  ipcMain.handle('db:discovery:list', wrapHandler((args: { workspaceId: string }) => listDiscoveredEndpoints(args.workspaceId)))
  ipcMain.handle('db:discovery:clear', wrapHandler((args: { workspaceId: string }) => clearDiscoveredEndpoints(args.workspaceId)))

  // Import
  ipcMain.handle('import:postman', wrapHandler((args: { filePath: string; workspaceId: string }) => importPostmanCollection(args.filePath, args.workspaceId)))
  ipcMain.handle('dialog:openFile', async (_event, args: { filters?: Array<{ name: string; extensions: string[] }> }) => {
    try {
      const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ['openFile'],
        filters: args.filters || [{ name: 'All Files', extensions: ['*'] }],
      })
      return { success: true as const, data: result.canceled ? null : result.filePaths[0] ?? null }
    } catch (e) {
      return { success: false as const, error: e instanceof Error ? e.message : 'Unknown error' }
    }
  })
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
