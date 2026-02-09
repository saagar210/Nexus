import { ref } from 'vue'
import type { IpcChannelMap } from '@shared/ipc-channels'

type ChannelName = keyof IpcChannelMap

export function useIpc() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function invoke<K extends ChannelName>(
    channel: K,
    ...args: IpcChannelMap[K]['args'] extends void ? [] : [IpcChannelMap[K]['args']]
  ): Promise<IpcChannelMap[K]['return']> {
    isLoading.value = true
    error.value = null
    try {
      const result = await window.api.invoke(channel, ...args)
      if (!result.success) {
        error.value = result.error
      }
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown IPC error'
      error.value = msg
      return { success: false, error: msg } as IpcChannelMap[K]['return']
    } finally {
      isLoading.value = false
    }
  }

  return { invoke, isLoading, error }
}
