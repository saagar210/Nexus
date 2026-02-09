import { request as undiciRequest } from 'undici'
import type { HttpRequest, HttpResponse, IpcResult } from '@shared/ipc-types'
import { resolveRequestVariables } from '../services/variable-resolver'

const MAX_RESPONSE_SIZE = 10 * 1024 * 1024 // 10MB

let activeController: AbortController | null = null

export async function executeRequest(req: HttpRequest): Promise<IpcResult<HttpResponse>> {
  // Cancel any in-flight request
  activeController?.abort()

  const controller = new AbortController()
  activeController = controller

  const startTime = performance.now()

  try {
    const resolved = req.variables
      ? resolveRequestVariables({ url: req.url, headers: req.headers, body: req.body }, req.variables)
      : { url: req.url, headers: req.headers, body: req.body }

    const response = await undiciRequest(resolved.url, {
      method: req.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS',
      headers: resolved.headers,
      body: resolved.body || undefined,
      signal: controller.signal,
      headersTimeout: req.timeout || 30000,
      bodyTimeout: req.timeout || 30000,
    })

    const bodyText = await response.body.text()
    const totalTime = performance.now() - startTime

    const responseHeaders: Record<string, string> = {}
    for (const [key, value] of Object.entries(response.headers)) {
      responseHeaders[key] = Array.isArray(value) ? value.join(', ') : (value ?? '')
    }

    const bodySize = Buffer.byteLength(bodyText, 'utf8')
    let finalBody = bodyText
    let isTruncated = false

    if (bodySize > MAX_RESPONSE_SIZE) {
      finalBody = bodyText.substring(0, MAX_RESPONSE_SIZE) + '\n\n[Response truncated at 10MB]'
      isTruncated = true
    }

    return {
      success: true,
      data: {
        statusCode: response.statusCode,
        statusText: getStatusText(response.statusCode),
        headers: responseHeaders,
        body: finalBody,
        size: bodySize,
        isTruncated,
        timing: {
          startTime,
          dnsTime: 0,
          connectTime: 0,
          tlsTime: 0,
          firstByteTime: 0,
          totalTime: Math.round(totalTime),
        },
      },
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { success: false, error: 'Request cancelled' }
    }
    return { success: false, error: e instanceof Error ? e.message : 'Request failed' }
  } finally {
    if (activeController === controller) {
      activeController = null
    }
  }
}

export function cancelActiveRequest(): void {
  activeController?.abort()
  activeController = null
}

function getStatusText(code: number): string {
  const texts: Record<number, string> = {
    200: 'OK', 201: 'Created', 202: 'Accepted', 204: 'No Content',
    301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 405: 'Method Not Allowed', 409: 'Conflict',
    422: 'Unprocessable Entity', 429: 'Too Many Requests',
    500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
  }
  return texts[code] || ''
}
