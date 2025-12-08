import type { Platform } from '../api/types'

export type ExtensionError =
  | { type: 'NETWORK_ERROR'; message: string }
  | { type: 'API_ERROR'; platform: Platform; status: number; message: string }
  | { type: 'TIMEOUT_ERROR'; platform: Platform }
  | { type: 'PARSE_ERROR'; platform: Platform; message: string }
  | { type: 'NO_MATCHES'; platform: Platform }

export function handleApiError(error: unknown, platform: Platform): ExtensionError {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return { type: 'NETWORK_ERROR', message: '请检查网络连接' }
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return { type: 'TIMEOUT_ERROR', platform }
  }

  if (error instanceof Error && error.message.includes('timeout')) {
    return { type: 'TIMEOUT_ERROR', platform }
  }

  return {
    type: 'API_ERROR',
    platform,
    status: 0,
    message: `${platform} 服务暂时不可用`
  }
}

export function getErrorMessage(error: ExtensionError): string {
  switch (error.type) {
    case 'NETWORK_ERROR':
      return '网络连接失败，请检查网络'
    case 'TIMEOUT_ERROR':
      return `${error.platform} 请求超时，请稍后重试`
    case 'API_ERROR':
      return error.message
    case 'PARSE_ERROR':
      return `${error.platform} 数据解析失败`
    case 'NO_MATCHES':
      return `未在 ${error.platform} 找到匹配事件`
  }
}

export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < retries) {
        await new Promise(r => setTimeout(r, delay * (i + 1)))
      }
    }
  }

  throw lastError
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}
