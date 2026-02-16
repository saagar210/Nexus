import { cleanupTargets, fullTargets, printCleanupReport } from './cleanup-lib.mjs'

const results = await cleanupTargets(fullTargets, { includeTsBuildInfo: true })
printCleanupReport(results)
