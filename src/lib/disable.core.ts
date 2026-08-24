const labelPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/

type Site = { hostname: string; port: string | null }

function splitSite(value: string): Site {
  const colon = value.lastIndexOf(':')
  if (colon === -1) return { hostname: value, port: null }
  return { hostname: value.slice(0, colon), port: value.slice(colon + 1) }
}

export function normalizeSite(input: string): string | null {
  let value = input.trim().toLowerCase()
  if (value === '') return null
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
  const slash = value.indexOf('/')
  if (slash !== -1) value = value.slice(0, slash)
  const at = value.lastIndexOf('@')
  if (at !== -1) value = value.slice(at + 1)
  const { hostname, port } = splitSite(value)
  const host = hostname.replace(/\.$/, '').replace(/^www\./, '')
  if (!labelPattern.test(host)) return null
  if (port === null) return host
  if (!/^\d{1,5}$/.test(port)) return null
  return `${host}:${port}`
}

export function parseDisabledSites(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry) => typeof entry === 'string')
}

function matchesSite(host: string, entry: string): boolean {
  const target = splitSite(host.toLowerCase())
  const site = splitSite(entry)
  if (site.port !== null && site.port !== target.port) return false
  return target.hostname === site.hostname || target.hostname.endsWith(`.${site.hostname}`)
}

export function isDisabledOn(host: string, sites: string[]): boolean {
  return sites.some((site) => matchesSite(host, site))
}

export function addDisabledSite(sites: string[], site: string): string[] {
  return sites.includes(site) ? sites : [...sites, site]
}

export function removeDisabledSite(sites: string[], site: string): string[] {
  return sites.filter((entry) => entry !== site)
}
