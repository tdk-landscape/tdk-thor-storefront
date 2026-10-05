import { join } from 'node:path';
import { createServer } from 'node:net';
import { loadRepositoryEnv } from '../services/store/thor-bff/src/config';
import { preflight } from './thor-preflight';

const root = join(import.meta.dir, '..');
const env = {
  ...loadRepositoryEnv(root),
  PORT: '4300',
  THOR_FRONTEND_ORIGIN: 'http://127.0.0.1:3300',
  THOR_BFF_ORIGIN: 'http://127.0.0.1:4300',
  VITE_THOR_BFF_URL: 'http://127.0.0.1:4300',
};
const code = preflight([], env);
if (code) process.exit(code);

const children: Bun.Subprocess[] = [];
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM');
}
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, stop);
try {
  for (const port of [3300, 4300]) {
    await new Promise<void>((resolve, reject) => {
      const probe = createServer();
      probe.once('error', () => reject(new Error(`LOCAL_PORT_IN_USE: Free port ${port} before starting Bun development.`)));
      probe.listen(port, '127.0.0.1', () => probe.close(error => error ? reject(error) : resolve()));
    });
  }
  children.push(Bun.spawn([process.execPath, '--watch', 'src/index.ts'], {
    cwd: join(root, 'services/store/thor-bff'), env,
    stdin: 'inherit', stdout: 'inherit', stderr: 'inherit',
  }));
  children.push(Bun.spawn([process.execPath, 'node_modules/vite/bin/vite.js', '--config', 'vite.config.local.ts', '--strictPort'], {
    cwd: join(root, 'services/store/storefront-web'), env,
    stdin: 'inherit', stdout: 'inherit', stderr: 'inherit',
  }));
  console.log('Bun development: http://127.0.0.1:3300/storefront-web/');
  console.log('BFF: http://127.0.0.1:4300/health');
  const result = await Promise.race(children.map(async child => {
    const exitCode = await child.exited;
    return { exitCode, interrupted: stopping };
  }));
  stop();
  await Promise.all(children.map(child => child.exited));
  process.exitCode = result.interrupted ? 0 : (result.exitCode || 1);
} catch (error) {
  stop();
  await Promise.all(children.map(child => child.exited));
  console.error(error instanceof Error && error.message.startsWith('LOCAL_PORT_IN_USE:')
    ? error.message
    : 'LOCAL_START_FAILED: Run bun install and check ports 3300 and 4300.');
  process.exitCode = 1;
}
