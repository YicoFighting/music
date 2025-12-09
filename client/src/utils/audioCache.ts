const CACHE_NAME = 'music-audio-cache-v1'
const MAX_ENTRIES = 30

const noop = () => {}

const isBrowser = typeof window !== 'undefined'

const supportsCacheStorage = (): boolean => {
  return isBrowser && 'caches' in window
}

export interface AudioCacheOptions {
  headers?: Record<string, string>
  useCache?: boolean
}

export interface AudioCacheResult {
  src: string
  fromCache: boolean
  cached: boolean
  revoke: () => void
}

const buildRequest = (url: string, headers?: Record<string, string>) => {
  return new Request(url, {
    method: 'GET',
    headers,
    mode: 'cors',
    credentials: 'omit'
  })
}

const createObjectUrl = async (
  response: Response,
  options: { fromCache: boolean; cached: boolean }
): Promise<AudioCacheResult> => {
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  return {
    src: objectUrl,
    fromCache: options.fromCache,
    cached: options.cached,
    revoke: () => URL.revokeObjectURL(objectUrl)
  }
}

const fetchAsObjectUrl = async (request: Request): Promise<Response> => {
  const response = await fetch(request)
  if (!response.ok) {
    throw new Error(`Audio fetch failed: ${response.status}`)
  }
  return response
}

const ensureCacheLimit = async (cache: Cache) => {
  const keys = await cache.keys()
  if (keys.length <= MAX_ENTRIES) return
  const overflow = keys.length - MAX_ENTRIES
  for (let i = 0; i < overflow; i += 1) {
    await cache.delete(keys[i])
  }
}

export const getAudioSource = async (url: string, options: AudioCacheOptions = {}): Promise<AudioCacheResult> => {
  if (!url) {
    return { src: url, fromCache: false, cached: false, revoke: noop }
  }

  const { headers, useCache = true } = options

  if (!isBrowser) {
    return { src: url, fromCache: false, cached: false, revoke: noop }
  }

  if (useCache && supportsCacheStorage()) {
    try {
      const cache = await caches.open(CACHE_NAME)
      const request = buildRequest(url, headers)
      let cachedResponse = await cache.match(request)

      if (!cachedResponse) {
        const networkResponse = await fetchAsObjectUrl(request.clone())
        await cache.put(request, networkResponse.clone())
        await ensureCacheLimit(cache)
        return createObjectUrl(networkResponse, { fromCache: false, cached: true })
      }

      return createObjectUrl(cachedResponse, { fromCache: true, cached: true })
    } catch (error) {
      console.warn('[audioCache] Cache storage unavailable, falling back to direct fetch', error)
    }
  }

  try {
    const response = await fetchAsObjectUrl(buildRequest(url, headers))
    const result = await createObjectUrl(response, { fromCache: false, cached: false })
    return { ...result, fromCache: false, cached: false }
  } catch (error) {
    console.warn('[audioCache] Failed to fetch audio, using remote url', error)
    return { src: url, fromCache: false, cached: false, revoke: noop }
  }
}

export const clearAudioCache = async () => {
  if (!supportsCacheStorage()) return
  try {
    await caches.delete(CACHE_NAME)
  } catch (error) {
    console.warn('[audioCache] Failed to clear cache', error)
  }
}

export const isAudioCacheSupported = (): boolean => supportsCacheStorage()
