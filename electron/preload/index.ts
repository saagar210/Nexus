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
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronApi = typeof api
