import { loadRepositoryEnv } from '../services/store/thor-bff/src/config';
import { preflight } from './thor-preflight';
const env = loadRepositoryEnv();
const code = preflight([], env);
if (code) process.exit(code);
try {
  const child = Bun.spawn(['tdk','up','store'], {env, stdin:'inherit',stdout:'inherit',stderr:'inherit'});
  for (const signal of ['SIGINT','SIGTERM'] as const) process.on(signal, () => child.kill(signal));
  process.exitCode = await child.exited;
} catch { console.error('TDK_NOT_AVAILABLE: Install TDK CLI 1.3.75 or newer.'); process.exitCode = 1; }
