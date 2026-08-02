import { extensionName } from '@vios/core'
import { startDevReload } from './dev-reload'

console.log(`[${extensionName}] background loaded`)

if (__DEV__) {
  void startDevReload()
}
