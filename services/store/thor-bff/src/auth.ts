import { betterAuth } from 'better-auth';
import { thorAuthPlugin } from '@thor-commerce/better-auth-thor';
import { parse as parseGraphQL, Kind } from 'graphql';
import { type Config } from './config';
import { ThorError, storefrontHeaders } from './thor';

type User = {id:string;email:string;name:string};
export type AuthBoundary = {
  signIn(body:{email:string;password:string}):Promise<{cookie:string;user:User}>;
  accessToken(request:Request):Promise<string|undefined>;
  user(request:Request):Promise<User|null>;
  signOut(request:Request):string;
  close():void;
};
export function createAuthBoundary(config:Config):AuthBoundary|undefined {
  if (!config.authSecret) return;
  // The plugin cannot attach a protected project token. Its private loopback
  // relay attaches that token to the three auth operations only. It is not a
  // public GraphQL proxy and never listens on a container's external interface.
  const relayPath=`/${crypto.randomUUID()}`;
  const relay=Bun.serve({hostname:'127.0.0.1',port:0,async fetch(request){
    if (new URL(request.url).pathname !== relayPath || request.method !== 'POST') return new Response(null,{status:404});
    const body=await request.json().catch(()=>null) as {query?:string;variables?:unknown}|null;
    try {
      if (!body?.query || body.query.length > 10000) throw new Error();
      const doc=parseGraphQL(body.query);
      if (doc.definitions.length!==1) throw new Error();
      const def=doc.definitions[0];
      if (def.kind!==Kind.OPERATION_DEFINITION || def.selectionSet.selections.length!==1) throw new Error();
      const field=def.selectionSet.selections[0];
      if (field.kind!==Kind.FIELD || !['customerAccessTokenCreate','customerAccessTokenRefresh','customer'].includes(field.name.value)) throw new Error();
      const headers:Record<string,string>={'Content-Type':'application/json',...storefrontHeaders(config)};
      const authorization=request.headers.get('Authorization');
      if (authorization) headers.Authorization=authorization;
      const response=await fetch(config.storefrontUrl,{method:'POST',headers,body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(15000)});
      return new Response(response.body,{status:response.status,headers:{'Content-Type':'application/json'}});
    } catch { return Response.json({errors:[{message:'Authentication operation failed.'}]},{status:400}); }
  }});
  const auth=betterAuth({secret:config.authSecret,baseURL:config.bffOrigin,basePath:'/internal-auth',trustedOrigins:[config.frontendOrigin],session:{cookieCache:{enabled:true,maxAge:3600,strategy:'jwe'}},plugins:[thorAuthPlugin({apiEndpoint:`http://127.0.0.1:${relay.port}${relayPath}`})]});
  const sessions=new Map<string,{cookies:string;expires:number}>();
  const secure=new URL(config.bffOrigin).protocol==='https:';
  const cookie=(id:string,age=3600)=>`thor_session=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure?'; Secure':''}`;
  function idFor(req:Request){return /(?:^|;\s*)thor_session=([a-f0-9-]{36})(?:;|$)/.exec(req.headers.get('Cookie')||'')?.[1];}
  function storeCookies(response:Response,previous=''){
    const pairs=new Map(previous.split('; ').filter(Boolean).map(s=>{const i=s.indexOf('=');return [s.slice(0,i),s.slice(i+1)];}));
    for(const item of response.headers.getSetCookie()){const pair=item.split(';',1)[0];const i=pair.indexOf('=');pairs.set(pair.slice(0,i),pair.slice(i+1));}
    return [...pairs].map(([key,value])=>`${key}=${value}`).join('; ');
  }
  async function session(req:Request){
    const id=idFor(req);const entry=id ? sessions.get(id) : undefined;
    if (!id || !entry) return null;
    if(entry.expires<Date.now()){sessions.delete(id);return null;}
    try {
      const response=await auth.api.getSession({headers:new Headers({cookie:entry.cookies}),asResponse:true});
      entry.cookies=storeCookies(response,entry.cookies);
      const data=await response.json() as {user?:User;session?:{token?:string}}|null;
      if(!response.ok || !data?.session?.token || !data.user){sessions.delete(id);return null;}
      return {user:{id:data.user.id,email:data.user.email,name:data.user.name},token:data.session.token};
    } catch { sessions.delete(id);return null; }
  }
  return {
    async signIn(body){
      for(const [key,value] of sessions) if(value.expires<Date.now()) sessions.delete(key);
      if(sessions.size>=1000) throw new ThorError('AUTH_CAPACITY','Sign-in is temporarily unavailable.');
      const response=await auth.api.customerSignIn({body,asResponse:true});
      const data=await response.json() as {user?:User;error?:string};
      const cookies=storeCookies(response);
      if(!response.ok || !data.user || !cookies) throw new ThorError('SIGN_IN_FAILED','Sign-in failed. Check your email and password.');
      const id=crypto.randomUUID();sessions.set(id,{cookies,expires:Date.now()+3600_000});
      return {cookie:cookie(id),user:{id:data.user.id,email:data.user.email,name:data.user.name}};
    },
    async accessToken(req){return (await session(req))?.token;},
    async user(req){return (await session(req))?.user ?? null;},
    signOut(req){const id=idFor(req);if(id)sessions.delete(id);return cookie('',0);},
    close(){sessions.clear();relay.stop(true);},
  };
}
