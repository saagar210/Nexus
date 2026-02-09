import type { IpcChannelMap } from './ipc-channels'

type ChannelName = keyof IpcChannelMap

export interface ElectronApi {
  invoke: <K extends ChannelName>(
    channel: K,
    ...args: IpcChannelMap[K]['args'] extends void ? [] : [IpcChannelMap[K]['args']]
  ) => Promise<IpcChannelMap[K]['return']>
}
