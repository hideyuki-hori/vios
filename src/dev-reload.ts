const devServerUrl = 'http://127.0.0.1:35729'
const pollIntervalMs = 1000

async function fetchText(path: string): Promise<string | undefined> {
  try {
    const res = await fetch(`${devServerUrl}${path}`)
    return await res.text()
  } catch {
    return undefined
  }
}

async function reloadActiveTab(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id !== undefined) await chrome.tabs.reload(tab.id)
  } catch {}
}

export async function startDevReload(): Promise<void> {
  console.log('[vios] dev reload enabled')
  if ((await fetchText('/pending-tab-reload')) === 'yes') {
    await reloadActiveTab()
  }
  let known = await fetchText('/version')
  async function poll(): Promise<void> {
    void chrome.runtime.getPlatformInfo()
    const version = await fetchText('/version')
    if (version !== undefined) {
      if (known !== undefined && version !== known) {
        chrome.runtime.reload()
        return
      }
      known = version
    }
    setTimeout(poll, pollIntervalMs)
  }
  setTimeout(poll, pollIntervalMs)
}
