import { cleanupTargets, heavyTargets, printCleanupReport } from './cleanup-lib.mjs'

const results = await cleanupTargets(heavyTargets)
printCleanupReport(results)
