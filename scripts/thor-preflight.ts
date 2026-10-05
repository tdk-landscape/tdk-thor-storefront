import { ConfigError, loadRepositoryEnv, readConfig, thorEnvNames } from '../services/store/thor-bff/src/config';

export function preflight(args = process.argv.slice(2), env = loadRepositoryEnv(), spawn = Bun.spawnSync): number {
  if (args.some(arg => arg !== '--dry-run')) { console.error('Usage: bun run thor:preflight [--dry-run]'); return 2; }
  if (args.includes('--dry-run')) {
    for (const name of thorEnvNames) console.log(`${name}: ${env[name]?.trim() ? 'set' : 'missing'}`);
    try {
      const result = spawn(['tdk', 'up', 'store', '--dry-run'], {cwd:process.cwd(), env, stdout:'inherit', stderr:'inherit'});
      return result.exitCode ?? 1;
    } catch { console.error('TDK_NOT_AVAILABLE: Install TDK CLI 1.3.75 or newer.'); return 1; }
  }
  try { readConfig(env); console.log('Thor configuration ready.'); return 0; }
  catch (error) { console.error(error instanceof ConfigError ? `${error.code}: ${error.message}` : 'THOR_CONFIG_INVALID: Check the project .env.'); return 1; }
}
if (import.meta.main) process.exitCode = preflight();
