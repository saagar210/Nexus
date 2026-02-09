import type {
  IpcResult, HttpRequest, HttpResponse,
  SavedRequest, Workspace, HistoryEntry
} from './ipc-types'

export interface IpcChannelMap {
  // System
  'app:ping': { args: void; return: IpcResult<{ timestamp: number }> }

  // HTTP
  'http:execute': { args: HttpRequest; return: IpcResult<HttpResponse> }
  'http:cancel': { args: void; return: IpcResult<void> }

  // Workspaces
  'db:workspace:list': { args: void; return: IpcResult<Workspace[]> }
  'db:workspace:get': { args: { id: string }; return: IpcResult<Workspace | null> }
  'db:workspace:getDefault': { args: void; return: IpcResult<Workspace> }

  // Requests
  'db:request:save': { args: Omit<SavedRequest, 'createdAt' | 'updatedAt'>; return: IpcResult<SavedRequest> }
  'db:request:get': { args: { id: string }; return: IpcResult<SavedRequest | null> }
  'db:request:list': { args: { workspaceId: string }; return: IpcResult<SavedRequest[]> }
  'db:request:delete': { args: { id: string }; return: IpcResult<void> }

  // History
  'db:history:save': { args: Omit<HistoryEntry, 'id' | 'executedAt'>; return: IpcResult<HistoryEntry> }
  'db:history:list': { args: { workspaceId: string; limit?: number }; return: IpcResult<HistoryEntry[]> }
}
