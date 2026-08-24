import { addBlockedDomain, normalizeDomain, removeBlockedDomain } from '~/lib/block.core'
import { findOpenTabs, reblockAlarmPrefix, syncBlockRules } from '~/lib/block.gateway'
import { loadBlockState, saveBlockState } from '~/lib/block.storage'
import { addDisabledSite, normalizeSite, removeDisabledSite } from '~/lib/disable.core'
import { loadDisabledSites, saveDisabledSites } from '~/lib/disable.storage'
import { byId, inputById } from '~/lib/dom'

const focusedFlag = 'focused'

if (!new URLSearchParams(location.search).has(focusedFlag)) {
  location.replace(`${location.pathname}?${focusedFlag}`)
}

const inputEl = inputById('input')
const errorEl = byId('error')
const listEl = byId('list')
const disableInputEl = inputById('disable-input')
const disableErrorEl = byId('disable-error')
const disableListEl = byId('disable-list')

function renderDomainList(
  target: HTMLElement,
  domains: string[],
  emptyText: string,
  onRemove: (domain: string) => void,
): void {
  target.textContent = ''
  if (domains.length === 0) {
    const empty = document.createElement('li')
    empty.className = 'empty'
    empty.textContent = emptyText
    target.append(empty)
    return
  }
  for (const domain of domains) {
    const item = document.createElement('li')
    const name = document.createElement('span')
    name.textContent = domain
    const remove = document.createElement('button')
    remove.type = 'button'
    remove.textContent = '削除'
    remove.addEventListener('click', () => {
      onRemove(domain)
    })
    item.append(name, remove)
    target.append(item)
  }
}

async function render(): Promise<void> {
  const state = await loadBlockState()
  renderDomainList(listEl, state.domains, 'ブロック中のサイトはありません', (domain) => {
    void removeDomain(domain)
  })
}

async function renderDisabled(): Promise<void> {
  const domains = await loadDisabledSites()
  renderDomainList(disableListEl, domains, '無効にしているサイトはありません', (domain) => {
    void removeDisabled(domain)
  })
}

async function removeDisabled(domain: string): Promise<void> {
  await saveDisabledSites(removeDisabledSite(await loadDisabledSites(), domain))
  await renderDisabled()
}

async function addDisabled(raw: string): Promise<void> {
  disableErrorEl.textContent = ''
  const domain = normalizeSite(raw)
  if (domain === null) {
    disableErrorEl.textContent = 'ホストとして解釈できません'
    return
  }
  const domains = await loadDisabledSites()
  if (domains.includes(domain)) {
    disableErrorEl.textContent = 'すでに登録されています'
    return
  }
  await saveDisabledSites(addDisabledSite(domains, domain))
  disableInputEl.value = ''
  await renderDisabled()
}

async function removeDomain(domain: string): Promise<void> {
  await saveBlockState(removeBlockedDomain(await loadBlockState(), domain))
  await syncBlockRules()
  await chrome.alarms.clear(`${reblockAlarmPrefix}${domain}`)
  await render()
}

async function commitAdd(domain: string): Promise<void> {
  await saveBlockState(addBlockedDomain(await loadBlockState(), domain))
  await syncBlockRules()
  inputEl.value = ''
  await render()
}

function openConfirmModal(domain: string, targets: chrome.tabs.Tab[]): void {
  const overlay = document.createElement('div')
  overlay.className = 'overlay'
  const modal = document.createElement('div')
  modal.className = 'modal'
  const message = document.createElement('p')
  message.textContent = `${domain} を追加すると、開いている${targets.length}個のタブを閉じます`
  const titles = document.createElement('ul')
  for (const tab of targets) {
    const item = document.createElement('li')
    const title = tab.title ?? ''
    item.textContent = title === '' ? (tab.url ?? '') : title
    titles.append(item)
  }
  const buttons = document.createElement('div')
  buttons.className = 'modal-buttons'
  const cancel = document.createElement('button')
  cancel.type = 'button'
  cancel.textContent = 'キャンセル'
  cancel.addEventListener('click', () => {
    overlay.remove()
  })
  const confirm = document.createElement('button')
  confirm.type = 'button'
  confirm.className = 'danger'
  confirm.textContent = 'タブを閉じて追加'
  confirm.addEventListener('click', () => {
    void closeTabsAndAdd(domain, targets, overlay)
  })
  buttons.append(cancel, confirm)
  modal.append(message, titles, buttons)
  overlay.append(modal)
  document.body.append(overlay)
}

async function closeTabsAndAdd(
  domain: string,
  targets: chrome.tabs.Tab[],
  overlay: HTMLElement,
): Promise<void> {
  const ids = targets.flatMap((tab) => (tab.id === undefined ? [] : [tab.id]))
  if (ids.length > 0) await chrome.tabs.remove(ids)
  await commitAdd(domain)
  overlay.remove()
}

async function addDomain(raw: string): Promise<void> {
  errorEl.textContent = ''
  const domain = normalizeDomain(raw)
  if (domain === null) {
    errorEl.textContent = 'ドメインとして解釈できません'
    return
  }
  const state = await loadBlockState()
  if (state.domains.includes(domain)) {
    errorEl.textContent = 'すでに登録されています'
    return
  }
  const targets = await findOpenTabs(domain)
  if (targets.length === 0) {
    await commitAdd(domain)
    return
  }
  openConfirmModal(domain, targets)
}

byId('add').addEventListener('click', () => {
  void addDomain(inputEl.value)
})

inputEl.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.isComposing) return
  void addDomain(inputEl.value)
})

byId('disable-add').addEventListener('click', () => {
  void addDisabled(disableInputEl.value)
})

disableInputEl.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.isComposing) return
  void addDisabled(disableInputEl.value)
})

void render()
void renderDisabled()
