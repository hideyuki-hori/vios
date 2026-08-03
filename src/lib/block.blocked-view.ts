import { isUnlockCommand } from './block.core'
import { unlockDomain } from './block.gateway'
import { byId, inputById } from './dom'

export function initBlockedPage(): void {
  const params = new URLSearchParams(location.search)
  const domain = params.get('domain') ?? ''

  const errorEl = byId('error')
  const inputEl = inputById('input')

  byId('domain').textContent = domain
  byId('command').textContent = `unlock ${domain}`

  async function submit(value: string): Promise<void> {
    if (!isUnlockCommand(value, domain)) {
      errorEl.textContent = 'コマンドが一致しません'
      return
    }
    const unlocked = await unlockDomain(domain)
    if (!unlocked) {
      errorEl.textContent = '解除に失敗しました'
      return
    }
    location.href = `https://${domain}/`
  }

  inputEl.addEventListener('paste', (event) => {
    event.preventDefault()
  })

  inputEl.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.isComposing) return
    void submit(inputEl.value)
  })

  inputEl.focus()
}
