import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parse } from 'dotenv';
import { z } from 'zod';

export const thorEnvNames = ['THOR_STOREFRONT_URL', 'THOR_ADMIN_URL', 'THOR_ACCESS_TOKEN', 'THOR_ADMIN_API_KEY', 'THOR_STORE_ID', 'THOR_CHANNEL', 'THOR_MARKET', 'THOR_CURRENCY', 'THOR_MARKETS', 'THOR_COMPANY_LOCATION_ID', 'THOR_COMPANY_PRICE_CHANNEL_ID', 'THOR_AUTH_SECRET'] as const;
export class ConfigError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
export function loadRepositoryEnv(start = process.cwd(), overrides: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  let root = resolve(start);
  while (!existsSync(join(root, '.tdk/project.json')) && dirname(root) !== root) root = dirname(root);
  const file = join(root, '.env');
  return { ...(existsSync(file) ? parse(readFileSync(file)) : {}), ...overrides };
}
export function assertStorefrontUrl(env: NodeJS.ProcessEnv) {
  if (!env.THOR_STOREFRONT_URL?.trim()) throw new ConfigError('THOR_STOREFRONT_URL_REQUIRED', 'Set THOR_STOREFRONT_URL in the project .env before starting the store.');
}
function endpoint(value: string, name: string) {
  try {
    const url = new URL(value);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.hostname.endsWith('.localhost');
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) throw new Error();
    return url.toString();
  } catch { throw new ConfigError(`${name}_INVALID`, `${name} must be an HTTPS GraphQL endpoint (HTTP is allowed only on localhost).`); }
}
export const marketSchema = z.object({ id: z.string().min(1).max(80), label: z.string().min(1).max(100), channel: z.string().min(1).max(200), country: z.string().regex(/^[A-Z]{2}$/), currency: z.string().regex(/^[A-Z]{3}$/) }).strict();
export type Market = z.infer<typeof marketSchema>;
export function readConfig(env: NodeJS.ProcessEnv) {
  assertStorefrontUrl(env);
  for (const name of ['THOR_STORE_ID', 'THOR_CHANNEL', 'THOR_MARKET', 'THOR_CURRENCY'] as const) {
    if (!env[name]?.trim()) throw new ConfigError(`${name}_REQUIRED`, `Set ${name} in the project .env.`);
  }
  const initial = marketSchema.safeParse({id:env.THOR_MARKET!.trim(),label:env.THOR_MARKET!.trim(),channel:env.THOR_CHANNEL!.trim(),country:env.THOR_MARKET!.trim().toUpperCase(),currency:env.THOR_CURRENCY!.trim().toUpperCase()});
  if (!initial.success) throw new ConfigError('THOR_CONTEXT_INVALID', 'THOR_MARKET must be a two-letter country and THOR_CURRENCY a three-letter currency.');
  let markets: Market[] = [initial.data];
  if (env.THOR_MARKETS?.trim()) {
    try { markets = z.array(marketSchema).min(1).max(30).parse(JSON.parse(env.THOR_MARKETS)); }
    catch { throw new ConfigError('THOR_MARKETS_INVALID', 'THOR_MARKETS must be a JSON array of supported market definitions.'); }
  }
  if (new Set(markets.map(m=>m.id)).size !== markets.length) throw new ConfigError('THOR_MARKETS_INVALID', 'Market IDs must be unique.');
  const defaultMarket = markets.find(m => m.id === initial.data.id);
  if (!defaultMarket) throw new ConfigError('THOR_MARKETS_INVALID', 'THOR_MARKETS must include the THOR_MARKET default.');
  const companyLocationId = env.THOR_COMPANY_LOCATION_ID?.trim() || null;
  const buyerChannel = env.THOR_COMPANY_PRICE_CHANNEL_ID?.trim() || null;
  if (companyLocationId && !buyerChannel) throw new ConfigError('THOR_COMPANY_PRICE_CHANNEL_ID_REQUIRED', 'The public Thor schema has no company-location argument. Configure its buyer price-channel mapping before enabling THOR_COMPANY_LOCATION_ID.');
  const storefrontUrl = endpoint(env.THOR_STOREFRONT_URL!.trim(), 'THOR_STOREFRONT_URL');
  const adminUrl = env.THOR_ADMIN_URL?.trim() ? endpoint(env.THOR_ADMIN_URL.trim(), 'THOR_ADMIN_URL') : null;
  const frontendOrigin = env.THOR_FRONTEND_ORIGIN?.trim() || 'http://app.tdk-thor-storefront.localhost:8080';
  const bffOrigin = env.THOR_BFF_ORIGIN?.trim() || 'http://api.tdk-thor-storefront.localhost:8080';
  const authSecret = env.THOR_AUTH_SECRET?.trim() || null;
  if (authSecret && authSecret.length < 32) throw new ConfigError('THOR_AUTH_SECRET_INVALID', 'THOR_AUTH_SECRET must contain at least 32 characters.');
  return { storefrontUrl, adminUrl, token: env.THOR_ACCESS_TOKEN?.trim() || '', adminKey: env.THOR_ADMIN_API_KEY?.trim() || '', storeId:env.THOR_STORE_ID!.trim(), defaultMarket, markets, companyLocationId, buyerChannel, frontendOrigin, bffOrigin, authSecret };
}
export type Config = ReturnType<typeof readConfig>;
export function contextFor(config: Config, marketId?: string) {
  const market = marketId === undefined ? config.defaultMarket : config.markets.find(m => m.id === marketId);
  if (!market) throw new ConfigError('MARKET_NOT_SUPPORTED', 'Choose a configured market.');
  return {market:market.id,channel:config.buyerChannel || market.channel,country:market.country,currency:market.currency,storeId:config.storeId,companyLocationId:config.companyLocationId};
}
