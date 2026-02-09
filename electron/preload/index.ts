import { contextBridge, ipcRenderer } from 'electron'
import type { IpcChannelMap } from '@shared/ipc-channels'

type ChannelName = keyof IpcChannelMap

const api = {
  invoke: <K extends ChannelName>(
    channel: K,
    ...args: IpcChannelMap[K]['args'] extends void ? [] : [IpcChannelMap[K]['args']]
  ): Promise<IpcChannelMap[K]['return']> => {
    return ipcRenderer.invoke(channel, ...args) as Promise<IpcChannelMap[K]['return']>
  },
  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronApi = typeof api
