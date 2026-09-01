const proxyFetchers = new Map()

async function createProxyFetch(proxyUrl) {
  const [{ default: nodeFetch }, { ProxyAgent }] = await Promise.all([
    import('node-fetch'),
    import('proxy-agent'),
  ])
  const agent = new ProxyAgent({ getProxyForUrl: () => proxyUrl })

  return (input, init) => nodeFetch(input, { ...init, agent })
}

/** Uses the native fetch unless a dedicated proxy URL is configured. */
export async function fetchWithProxy(input, init, proxyUrl = '') {
  const normalizedProxyUrl = proxyUrl.trim()
  if (!normalizedProxyUrl) return fetch(input, init)

  let proxyFetch = proxyFetchers.get(normalizedProxyUrl)
  if (!proxyFetch) {
    proxyFetch = createProxyFetch(normalizedProxyUrl)
    proxyFetchers.set(normalizedProxyUrl, proxyFetch)
  }

  return (await proxyFetch)(input, init)
}
