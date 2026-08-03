import { normalizeDomain } from '../../lib/block.core'
import { findOpenTabs, reblockAlarmPrefix, syncBlockRules } from '../../lib/block.gateway'
import { loadBlockState, saveBlockState } from '../../lib/block.storage'
import { byId, inputById } from '../../lib/dom'

const inputEl = inputById('input')
const errorEl = byId('error')
const listEl = byId('list')

async function render(): Promise<void> {
  const state = await loadBlockState()
  listEl.textContent = ''
  if (state.domains.length === 0) {
    const empty = document.createElement('li')
    empty.className = 'empty'
    empty.textContent = 'ブロック中のサイトはありません'
    listEl.append(empty)
    return
  }
  for (const domain of state.domains) {
    const item = document.createElement('li')
    const name = document.createElement('span')
    name.textContent = domain
    const remove = document.createElement('button')
    remove.type = 'button'
    remove.textContent = '削除'
    remove.addEventListener('click', () => {
      void removeDomain(domain)
    })
    item.append(name, remove)
    listEl.append(item)
  }
}

async function removeDomain(domain: string): Promise<void> {
  const state = await loadBlockState()
  state.domains = state.domains.filter((entry) => entry !== domain)
  state.unlocks = Object.fromEntries(
    Object.entries(state.unlocks).filter(([key]) => key !== domain),
  )
  await saveBlockState(state)
  await syncBlockRules()
  await chrome.alarms.clear(`${reblockAlarmPrefix}${domain}`)
  await render()
}

async function commitAdd(domain: string): Promise<void> {
  const state = await loadBlockState()
  state.domains = [...state.domains, domain]
  await saveBlockState(state)
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

void render()
