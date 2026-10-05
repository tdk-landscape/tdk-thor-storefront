import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import { ConfigError, contextFor, type Config } from './config';
import { operations, collectionsQuery } from './operations';
import { requestThor, storefrontHeaders, ThorError } from './thor';
import type { AuthBoundary } from './auth';

const id = z.string().min(1).max(200);
const schemas = {
  ProductGrid:z.object({search:z.string().max(200).optional(),categoryId:id.optional(),after:z.string().max(500).optional()}).strict(),
  ProductDetail:z.object({id}).strict(), ProductPrice:z.object({id}).strict(),
  CartCreate:z.object({}).strict(), CartAddLine:z.object({cartId:id,variantId:id,quantity:z.number().int().min(1).max(10000)}).strict(),
};
const envelope = z.object({operation:z.enum(['ProductGrid','ProductDetail','ProductPrice','CartCreate','CartAddLine']),marketId:z.string().max(80).optional(),variables:z.record(z.string(),z.unknown()).optional()}).strict();
export function createApp(config:Config, doFetch:typeof fetch = fetch, auth?:AuthBoundary) {
  const app = new Hono();
  app.use('*',bodyLimit({maxSize:16384,onError:c=>c.json({error:{code:'REQUEST_TOO_LARGE',message:'Request body is too large.'}},413)}));
  app.use('*',cors({origin:config.frontendOrigin,credentials:true,allowMethods:['GET','POST','OPTIONS'],allowHeaders:['Content-Type']}));
  app.use('*',async(c,next)=>{
    c.header('Cache-Control','no-store');
    const origin=c.req.header('Origin');
    if (origin && origin !== config.frontendOrigin && origin !== config.bffOrigin) return c.json({error:{code:'ORIGIN_NOT_ALLOWED',message:'This origin is not allowed.'}},403);
    await next();
  });
  app.onError((error,c)=>{
    if (error instanceof ConfigError) return c.json({error:{code:error.code,message:error.message}},400);
    if (error instanceof ThorError) return c.json({error:{code:error.code,message:error.message}},502);
    return c.json({error:{code:'REQUEST_FAILED',message:'The request could not be completed.'}},500);
  });
  app.get('/health',c=>c.json({status:'ok',service:'thor-bff'}));
  app.get('/context',c=>c.json({...contextFor(config),markets:config.markets,authEnabled:!!auth}));
  app.get('/collections',async c=>{
    if (!config.adminUrl || !config.adminKey) return c.json({error:{code:'THOR_ADMIN_NOT_CONFIGURED',message:'Configure THOR_ADMIN_URL and THOR_ADMIN_API_KEY for collections.'}},503);
    return c.json(await requestThor(config.adminUrl,{'X-Api-Key':config.adminKey},{query:collectionsQuery,operationName:'AdminCollections'},doFetch));
  });
  app.post('/storefront/graphql',async c=>{
    if (!c.req.header('Content-Type')?.startsWith('application/json')) return c.json({error:{code:'JSON_REQUIRED',message:'Send an application/json request.'}},415);
    const raw = await c.req.json().catch(()=>null);
    const parsed = envelope.safeParse(raw);
    if (!parsed.success) return c.json({error:{code:'OPERATION_NOT_ALLOWED',message:'Use a supported operation name and variables; GraphQL documents and upstream URLs are not accepted.'}},400);
    const {operation,marketId} = parsed.data;
    const checked=schemas[operation].safeParse(parsed.data.variables ?? {});
    if (!checked.success) return c.json({error:{code:'VARIABLES_INVALID',message:'The operation variables are invalid.'}},400);
    const context = contextFor(config,marketId);
    const vars=checked.data as Record<string,unknown>;
    let variables:Record<string,unknown>;
    if (operation === 'CartCreate') variables={input:{storeId:context.storeId,priceChannelId:context.channel,currency:context.currency,countryCode:context.country}};
    else if (operation === 'CartAddLine') variables={input:{cartId:vars.cartId,lineItems:[{variantId:vars.variantId,quantity:vars.quantity}]}};
    else {
      // Quote search values so user text cannot add Thor filter expressions.
      const query = [vars.search ? JSON.stringify(vars.search) : '',vars.categoryId ? `category_id:${JSON.stringify(vars.categoryId)}` : ''].filter(Boolean).join(' AND ');
      variables={storeId:context.storeId,priceChannelId:context.channel,priceCountry:context.country,priceCurrency:context.currency,...(operation==='ProductGrid'?{query:query || null,after:vars.after ?? null}:{id:vars.id})};
    }
    const customerToken=auth ? await auth.accessToken(c.req.raw) : undefined;
    return c.json(await requestThor(config.storefrontUrl,storefrontHeaders(config,customerToken),{query:operations[operation],operationName:operation,variables},doFetch));
  });
  app.get('/auth/session',async c=>c.json({user:auth ? await auth.user(c.req.raw) : null}));
  app.post('/auth/sign-in',async c=>{
    if (!auth) return c.json({error:{code:'AUTH_NOT_CONFIGURED',message:'Customer sign-in is not configured.'}},503);
    const body=z.object({email:z.string().email().max(254),password:z.string().min(1).max(1024)}).strict().safeParse(await c.req.json().catch(()=>null));
    if (!body.success) return c.json({error:{code:'SIGN_IN_INVALID',message:'Enter your email and password.'}},400);
    const result=await auth.signIn(body.data);
    c.header('Set-Cookie',result.cookie);
    return c.json({user:result.user});
  });
  app.post('/auth/sign-out',c=>{
    if (auth) c.header('Set-Cookie',auth.signOut(c.req.raw));
    return c.json({ok:true});
  });
  return app;
}
