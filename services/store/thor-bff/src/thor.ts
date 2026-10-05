import type { Config } from './config';
export class ThorError extends Error {
  constructor(public code:string, message:string) { super(message); }
}
export async function requestThor(url:string, headers:Record<string,string>, body:unknown, doFetch:typeof fetch = fetch) {
  let response: Response;
  try { response = await doFetch(url, {method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body),signal:AbortSignal.timeout(15000),redirect:'error'}); }
  catch { throw new ThorError('THOR_UNAVAILABLE','Thor could not be reached. Check the store connection.'); }
  if (!response.ok) throw new ThorError('THOR_REQUEST_FAILED',`Thor rejected the request (HTTP ${response.status}). Check configuration and access permissions.`);
  let result: {data?:unknown; errors?:unknown[]};
  try { result = await response.json(); } catch { throw new ThorError('THOR_RESPONSE_INVALID','Thor returned an invalid response.'); }
  if (result.errors?.length) throw new ThorError('THOR_GRAPHQL_ERROR','Thor could not resolve this operation in the selected context.');
  if (!result.data || typeof result.data !== 'object') throw new ThorError('THOR_RESPONSE_INVALID','Thor returned no operation data.');
  // Only named operation selections reach the client. GraphQL extensions are
  // discarded; upstream diagnostics must never expose credentials.
  return {data:result.data};
}
export function storefrontHeaders(config:Config, customerToken?:string) {
  return {...(config.token ? {'x-thor-storefront-token':config.token} : {}), ...(customerToken ? {Authorization:`Bearer ${customerToken}`} : {})};
}
