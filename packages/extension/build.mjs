import { cp } from 'node:fs/promises'
import { build, context } from 'esbuild'

const watch = process.argv.includes('--watch')

const options = {
  entryPoints: ['src/content.ts', 'src/background.ts'],
  bundle: true,
  format: 'iife',
  outdir: 'dist',
  target: 'chrome120',
  logLevel: 'info',
}

await cp('public', 'dist', { recursive: true })

if (watch) {
  const ctx = await context(options)
  await ctx.watch()
} else {
  await build(options)
}
