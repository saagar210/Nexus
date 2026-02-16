import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(scriptDir, '..')

export const heavyTargets = [
  '.vite',
  'out',
  'dist',
  '.webpack',
]

export const fullTargets = [
  ...heavyTargets,
  'node_modules',
  '.cache',
  'coverage',
  '.eslintcache',
  '.npm',
  '.pnpm-store',
]

function ensureRepoRelative(target) {
  if (path.isAbsolute(target)) {
    throw new Error(`Expected repo-relative path, got absolute: ${target}`)
  }

  const resolved = path.resolve(repoRoot, target)
  const rel = path.relative(repoRoot, resolved)
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Refusing to operate outside repository: ${target}`)
  }

  return resolved
}

async function removeOne(target) {
  const resolved = ensureRepoRelative(target)
  let lastError
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await fs.rm(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
      return { target, status: 'removed' }
    } catch (error) {
      lastError = error
      const errorCode = /** @type {{ code?: string }} */ (error).code
      if (errorCode !== 'ENOTEMPTY' && errorCode !== 'EBUSY' && errorCode !== 'EPERM') {
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)))
    }
  }
  return { target, status: 'error', error: String(lastError) }
}

async function findTsBuildInfoFiles() {
  const entries = await fs.readdir(repoRoot, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tsbuildinfo'))
    .map((entry) => entry.name)
}

export async function cleanupTargets(targets, options = {}) {
  const { includeTsBuildInfo = false } = options
  const cleanupList = [...targets]

  if (includeTsBuildInfo) {
    const tsBuildInfoFiles = await findTsBuildInfoFiles()
    cleanupList.push(...tsBuildInfoFiles)
  }

  const results = []
  for (const target of cleanupList) {
    results.push(await removeOne(target))
  }

  return results
}

export function printCleanupReport(results) {
  for (const result of results) {
    if (result.status === 'removed') {
      console.log(`removed: ${result.target}`)
    } else {
      console.error(`error: ${result.target} (${result.error})`)
    }
  }
}
