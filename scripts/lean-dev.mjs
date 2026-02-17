import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { cleanupTargets, heavyTargets, printCleanupReport } from './cleanup-lib.mjs'

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'nexus-lean-dev-'))
const viteCacheDir = path.join(tmpRoot, 'vite-cache')
await fs.mkdir(viteCacheDir, { recursive: true })

console.log(`Lean cache dir: ${viteCacheDir}`)

const child = spawn('pnpm', ['start'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_CACHE_DIR: viteCacheDir,
  },
})

let shuttingDown = false

async function finalize(exitCode) {
  if (shuttingDown) return
  shuttingDown = true

  console.log('\nCleaning heavy build artifacts...')
  const results = await cleanupTargets(heavyTargets)
  printCleanupReport(results)

  await fs.rm(tmpRoot, { recursive: true, force: true })
  process.exit(exitCode)
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal)
  })
}

child.on('exit', async (code, signal) => {
  const exitCode = signal ? 1 : (code ?? 0)
  await finalize(exitCode)
})
