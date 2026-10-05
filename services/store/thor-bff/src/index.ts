import { createApp } from './app';
import { ConfigError, loadRepositoryEnv, readConfig } from './config';
import { createAuthBoundary } from './auth';

const env=loadRepositoryEnv();
let config;
try { config=readConfig(env); }
catch(error){console.error(error instanceof ConfigError?`${error.code}: ${error.message}`:'THOR_CONFIG_INVALID: Check your store configuration.');process.exit(1);}
const auth=createAuthBoundary(config);
const app=createApp(config,fetch,auth);
const port=Number(env.PORT || 4300);
if(!Number.isInteger(port)||port<1||port>65535){console.error('PORT_INVALID');process.exit(1);}
const server=Bun.serve({port,hostname:'0.0.0.0',fetch:app.fetch});
console.log(`thor-bff ready on container port ${port}`);
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{auth?.close();server.stop(true);process.exit(0);});
