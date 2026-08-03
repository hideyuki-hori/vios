import { watch as watchDir } from 'node:fs'
import { cp } from 'node:fs/promises'
import { createServer } from 'node:http'
import { build, context } from 'esbuild'

const watch = process.argv.includes('--watch')
const devServerPort = 35729

const options = {
  entryPoints: ['src/content.ts', 'src/background.ts', 'src/options.ts', 'src/blocked.ts'],
  bundle: true,
  format: 'iife',
  outdir: 'dist',
  target: 'chrome120',
  logLevel: 'info',
  define: { __DEV__: watch ? 'true' : 'false' },
  loader: { '.css': 'text' },
}

await cp('public', 'dist', { recursive: true })

if (watch) {
  let version = 0
  let pendingTabReload = false

  const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    if (req.url === '/version') {
      res.end(String(version))
      return
    }
    if (req.url === '/pending-tab-reload') {
      res.end(pendingTabReload ? 'yes' : 'no')
      pendingTabReload = false
      return
    }
    res.statusCode = 404
    res.end()
  })

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`port ${devServerPort} is already in use. is another pnpm dev running?`)
      process.exit(1)
    }
    throw error
  })

  server.listen(devServerPort)

  const notifyPlugin = {
    name: 'dev-reload-notify',
    setup: (api) => {
      api.onEnd((result) => {
        if (result.errors.length === 0) {
          version += 1
          pendingTabReload = true
        }
      })
    },
  }

  watchDir('public', { recursive: true }, () => {
    void cp('public', 'dist', { recursive: true }).then(() => {
      version += 1
      pendingTabReload = true
    })
  })

  const ctx = await context({ ...options, plugins: [notifyPlugin] })
  await ctx.watch()
} else {
  await build(options)
}
