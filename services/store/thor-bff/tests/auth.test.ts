import { expect, test } from 'bun:test';
import { createAuthBoundary } from '../src/auth';
import { createApp } from '../src/app';
import { readConfig } from '../src/config';
test('plugin sign-in keeps upstream tokens and plugin cookies on the BFF',async()=>{
 const seen:string[]=[];
 const thor=Bun.serve({hostname:'127.0.0.1',port:0,async fetch(req){
  seen.push(req.headers.get('x-thor-storefront-token')||'');
  const payload=await req.json() as {query:string};
  if(payload.query.includes('customerAccessTokenCreate'))return Response.json({data:{customerAccessTokenCreate:{customerAccessToken:{accessToken:'test-customer-access',refreshToken:'test-customer-refresh',expiresIn:3600},errors:[]}}});
  return Response.json({data:{customer:{id:'customer_test',email:'test@example.com',firstName:'Test',lastName:'Buyer',customerGroups:{nodes:[]}}}});
 }});
 const config=readConfig({THOR_STOREFRONT_URL:`http://127.0.0.1:${thor.port}/graphql`,THOR_ACCESS_TOKEN:'test-project-access',THOR_STORE_ID:'store_test',THOR_CHANNEL:'channel_test',THOR_MARKET:'NL',THOR_CURRENCY:'EUR',THOR_AUTH_SECRET:'test-only-secret-with-more-than-thirty-two-characters'});
 const auth=createAuthBoundary(config)!;
 try{
  const app=createApp(config,fetch,auth);
  const login=await app.request('/auth/sign-in',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'test@example.com',password:'test-password'})});
  expect(login.status).toBe(200);
  const browserCookie=login.headers.get('Set-Cookie')!;
  expect(browserCookie).toStartWith('thor_session=');expect(browserCookie).toContain('HttpOnly');expect(browserCookie).not.toContain('test-customer');
  expect(JSON.stringify(await login.json())).not.toContain('test-customer');
  const request=new Request('http://bff.local/auth/session',{headers:{Cookie:browserCookie.split(';')[0]}});
  expect(await auth.accessToken(request)).toBe('test-customer-access');
  expect(await auth.user(request)).toMatchObject({email:'test@example.com'});
  const session=await app.request('/auth/session',{headers:{Cookie:browserCookie.split(';')[0]}});
  expect(await session.json()).toEqual({user:{id:'customer_test',email:'test@example.com',name:'Test Buyer'}});
  expect(seen).toEqual(['test-project-access','test-project-access']);
  auth.signOut(request);expect(await auth.accessToken(request)).toBeUndefined();
 }finally{auth.close();thor.stop(true);}
},15000);
