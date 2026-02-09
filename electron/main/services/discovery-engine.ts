import { request as undiciRequest } from 'undici'
import type { BrowserWindow } from 'electron'
import type { DiscoveredEndpoint, DiscoveryProgress, DiscoveryResult, IpcResult } from '@shared/ipc-types'
import { saveDiscoveredEndpoints } from '../database/queries/discovery'

let activeController: AbortController | null = null

const COMMON_SPEC_PATHS = [
  '/openapi.json', '/openapi.yaml',
  '/swagger.json', '/swagger.yaml',
  '/api-docs', '/api-docs.json',
  '/v3/api-docs', '/v2/api-docs',
  '/docs/openapi.json',
  '/.well-known/openapi.json',
]

function sendProgress(win: BrowserWindow, progress: DiscoveryProgress): void {
  if (!win.isDestroyed()) {
    win.webContents.send('discovery:progress', progress)
  }
}

async function probeForSpec(baseUrl: string, signal: AbortSignal): Promise<{ url: string; content: string } | null> {
  const base = baseUrl.replace(/\/$/, '')

  for (const specPath of COMMON_SPEC_PATHS) {
    try {
      const response = await undiciRequest(`${base}${specPath}`, {
        method: 'GET',
        signal,
        headersTimeout: 5000,
        bodyTimeout: 5000,
        headers: { Accept: 'application/json, application/yaml, */*' },
      })

      const body = await response.body.text()

      if (response.statusCode === 200 && body.length > 50) {
        // Check if it looks like an OpenAPI/Swagger spec
        if (body.includes('"openapi"') || body.includes('"swagger"') ||
            body.includes('openapi:') || body.includes('swagger:')) {
          return { url: `${base}${specPath}`, content: body }
        }
      }
    } catch {
      // continue probing
    }
  }

  return null
}

function extractEndpointsFromSpec(spec: Record<string, unknown>, source: string): Array<Omit<DiscoveredEndpoint, 'id' | 'workspaceId' | 'discoveredAt'>> {
  const endpoints: Array<Omit<DiscoveredEndpoint, 'id' | 'workspaceId' | 'discoveredAt'>> = []
  const paths = spec.paths as Record<string, Record<string, unknown>> | undefined

  if (!paths) return endpoints

  for (const [path, methods] of Object.entries(paths)) {
    if (typeof methods !== 'object' || methods === null) continue

    for (const [method, operation] of Object.entries(methods)) {
      if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].indexOf(method) === -1) continue

      const op = operation as Record<string, unknown>
      const tags = (op.tags as string[]) || []
      const security = op.security as Array<Record<string, string[]>> | undefined

      endpoints.push({
        path,
        method: method.toUpperCase(),
        summary: (op.summary as string) || null,
        description: (op.description as string) || null,
        parameters: op.parameters ? JSON.stringify(op.parameters) : null,
        requestSchema: op.requestBody ? JSON.stringify(op.requestBody) : null,
        responseSchema: op.responses ? JSON.stringify(op.responses) : null,
        tags,
        authRequired: security !== undefined && security.length > 0,
        deprecated: Boolean(op.deprecated),
        source,
      })
    }
  }

  return endpoints
}

export async function startDiscovery(
  workspaceId: string,
  baseUrl: string,
  win: BrowserWindow
): Promise<IpcResult<DiscoveryResult>> {
  activeController?.abort()
  const controller = new AbortController()
  activeController = controller

  try {
    // Step 1: Probe for spec
    sendProgress(win, { step: 'probing', message: 'Probing for API specification...', progress: 10, endpointsFound: 0 })

    const specResult = await probeForSpec(baseUrl, controller.signal)

    if (!specResult) {
      sendProgress(win, { step: 'complete', message: 'No API specification found', progress: 100, endpointsFound: 0 })
      return {
        success: true,
        data: { endpoints: [], specUrl: null, specVersion: null, title: null },
      }
    }

    // Step 2: Parse spec
    sendProgress(win, { step: 'parsing', message: 'Parsing specification...', progress: 30, endpointsFound: 0 })

    let spec: Record<string, unknown>
    try {
      spec = JSON.parse(specResult.content)
    } catch {
      return { success: false, error: 'Failed to parse API specification as JSON' }
    }

    const specVersion = (spec.openapi as string) || (spec.swagger as string) || null
    const info = spec.info as Record<string, unknown> | undefined
    const title = (info?.title as string) || null

    // Step 3: Extract endpoints
    sendProgress(win, { step: 'extracting', message: 'Extracting endpoints...', progress: 60, endpointsFound: 0 })

    const rawEndpoints = extractEndpointsFromSpec(spec, specResult.url)

    sendProgress(win, {
      step: 'saving',
      message: `Found ${rawEndpoints.length} endpoints, saving...`,
      progress: 80,
      endpointsFound: rawEndpoints.length,
    })

    // Step 4: Save to database
    const saved = saveDiscoveredEndpoints(workspaceId, rawEndpoints)

    sendProgress(win, {
      step: 'complete',
      message: `Discovery complete! Found ${saved.length} endpoints.`,
      progress: 100,
      endpointsFound: saved.length,
    })

    return {
      success: true,
      data: {
        endpoints: saved,
        specUrl: specResult.url,
        specVersion,
        title,
      },
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { success: false, error: 'Discovery cancelled' }
    }
    return { success: false, error: e instanceof Error ? e.message : 'Discovery failed' }
  } finally {
    if (activeController === controller) {
      activeController = null
    }
  }
}

export function cancelDiscovery(): void {
  activeController?.abort()
  activeController = null
}
