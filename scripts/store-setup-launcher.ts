import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

const port = Number(Bun.env.STORE_SETUP_PORT || 8080);
const host = Bun.env.STORE_SETUP_HOST || 'app.tdk-thor-storefront.localhost';
const workspace = resolve(Bun.env.THOR_STORES_WORKSPACE || `${homedir()}/ThorStores`);
const savedSetupUrl = Bun.env.THOR_SETUP_URL;
const templates = [
  { id: 'everyday', name: 'Everyday', line: 'Quiet essentials. Made for living well.', title: 'Considered goods.', note: 'A collection for living well.' },
  { id: 'utility', name: 'Utility', line: 'A practical point of view. Made for outside.', title: 'Ready for out there.', note: 'Built for the open air.' },
  { id: 'studio', name: 'Studio', line: 'Design-led pieces. Chosen to be noticed.', title: 'Objects of interest.', note: 'Form follows feeling.' },
  { id: 'fieldwork', name: 'Fieldwork', line: 'Made to move. Ready for the elements.', title: 'Take the long way.', note: 'Equipment for open horizons.' },
  { id: 'supply', name: 'Supply', line: 'Useful by nature. Made to work hard.', title: 'Good tools, daily.', note: 'Dependable things, thoughtfully made.' },
  { id: 'atelier', name: 'Atelier', line: 'Material first. Made with intention.', title: 'A study in form.', note: 'Objects with a point of view.' },
] as const;

const templateCards = templates.map((item, index) => `<button class="template template-${item.id}" type="button" aria-pressed="${index === 0}" data-template="${item.id}"><span class="template-art"><span class="art-label">${item.name.toUpperCase()} / THOR</span><span class="art-title">${item.title}</span><span class="art-rule"></span><span class="art-blocks"><i></i><i></i><i></i></span></span><span class="template-caption"><strong>${item.name}</strong><span>${item.line}</span></span></button>`).join('');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Choose a storefront template</title><style>
:root{font-family:Arial,Helvetica,sans-serif;color:#f4f4f0;background:#080908;font-synthesis:none}*{box-sizing:border-box}body{margin:0;background:#080908;color:#f4f4f0;min-height:100vh}.page{max-width:1180px;margin:auto;padding:clamp(28px,6vw,76px)}.topline{font-size:11px;letter-spacing:.19em;color:#989b92;text-transform:uppercase;border-top:1px solid #30322d;padding-top:18px}h1{font-size:clamp(40px,6.8vw,76px);line-height:.98;letter-spacing:-.075em;font-weight:500;margin:52px 0 18px}.lede{max-width:520px;color:#a5a79f;font-size:15px;line-height:1.7;margin:0}.templates{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:46px 0 30px}.template{border:1px solid #383a34;background:#11120f;color:#f4f4f0;padding:0;text-align:left;cursor:pointer;transition:border-color .18s,transform .18s}.template:hover,.template[aria-pressed=true]{border-color:#e2e3d9;transform:translateY(-2px)}.template-art{height:190px;padding:16px;display:flex;flex-direction:column;background:#e8e7df;color:#191a17}.template-utility .template-art,.template-fieldwork .template-art{background:#131610;color:#f4f4ef}.template-studio .template-art,.template-atelier .template-art{background:#d2cabc;color:#28231e}.template-supply .template-art{background:#dce0d0;color:#252920}.art-label{font-size:8px;letter-spacing:.17em;opacity:.75}.art-title{font:400 clamp(21px,3vw,37px)/.97 Georgia,serif;letter-spacing:-.065em;margin:auto 0 12px;max-width:250px}.template-utility .art-title,.template-supply .art-title{font:700 clamp(21px,3vw,37px)/.95 Arial,sans-serif;letter-spacing:-.08em}.template-studio .art-title,.template-atelier .art-title{font-style:italic}.art-rule{height:1px;width:40px;background:currentColor;opacity:.65}.art-blocks{display:flex;gap:5px;margin-top:13px}.art-blocks i{height:36px;flex:1;background:color-mix(in srgb,currentColor 14%,transparent)}.template-caption{display:flex;flex-direction:column;gap:6px;padding:15px 16px 17px}.template-caption strong{font-weight:600;font-size:15px}.template-caption>span{color:#9c9e96;font-size:12px;line-height:1.45;min-height:34px}.actions{display:flex;gap:12px;max-width:540px;margin-top:34px}.actions form,.actions a{flex:1}.actions button,.actions a{width:100%;min-height:54px;padding:15px 18px;display:flex;align-items:center;justify-content:space-between;border:1px solid #e9eae4;background:#e9eae4;color:#11120f;text-align:left;text-decoration:none;font:600 14px Arial,sans-serif;cursor:pointer}.actions a{background:transparent;color:#f4f4f0;border-color:#55574f;font-weight:400}.actions button:hover{background:#d3d4cc}.actions a:hover{border-color:#eee}.arrow{font-size:20px}small{display:block;color:#7f817a;font-size:11px;line-height:1.6;margin-top:30px}@media(max-width:760px){.templates{grid-template-columns:repeat(2,minmax(0,1fr))}.template-art{height:160px}}@media(max-width:480px){.templates{grid-template-columns:1fr}.template-art{height:145px}.actions{flex-direction:column}}@media(prefers-reduced-motion:reduce){.template{transition:none}}
</style><main class="page"><div class="topline">TDK / Thor Storefront</div><h1>Choose a point of view.</h1><p class="lede">Pick a visual direction for your storefront. Each template gives your Thor-powered store its own character.</p><section class="templates" aria-label="Storefront templates">${templateCards}</section><div class="actions"><form method="post" action="/new-store"><button type="submit">Create new storefront <span class="arrow">↗</span></button></form>${savedSetupUrl ? '<a href="/continue">Continue saved setup <span class="arrow">↗</span></a>' : ''}</div><small>Your choice is a visual starting point. Store setup opens in Thor onboarding. Product catalog, prices, cart, and checkout remain managed by Thor.</small></main><script>document.querySelectorAll('.template').forEach(card=>card.addEventListener('click',()=>{document.querySelectorAll('.template').forEach(item=>item.setAttribute('aria-pressed','false'));card.setAttribute('aria-pressed','true');localStorage.setItem('store-template',card.dataset.template||'everyday')}));const selected=localStorage.getItem('store-template');if(selected){const card=document.querySelector('[data-template="'+CSS.escape(selected)+'"]');if(card){document.querySelectorAll('.template').forEach(item=>item.setAttribute('aria-pressed','false'));card.setAttribute('aria-pressed','true')}}</script></html>`;
const pageHeaders = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
let creating: Promise<string> | undefined;

function getSavedSetupUrl() {
  if (!savedSetupUrl) return null;
  try {
    const url = new URL(savedSetupUrl);
    return url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname) && Boolean(url.hash) ? url.href : null;
  } catch { return null; }
}

async function startThorSetup() {
  mkdirSync(workspace, { recursive: true });
  const child = Bun.spawn(['npx', '--yes', 'create-thor-store@latest', 'start', '--workspace', workspace, '--no-open'], {
    cwd: workspace, stdout: 'pipe', stderr: 'pipe',
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ]);
  if (exitCode !== 0) throw new Error(stderr || 'Thor onboarding did not start.');
  const result = JSON.parse(stdout) as { url?: string };
  const destination = new URL(result.url || '');
  if (destination.protocol !== 'http:' || destination.hostname !== '127.0.0.1' || !destination.hash) throw new Error('Thor onboarding returned an invalid local link.');
  return destination.href;
}

const savedUrl = getSavedSetupUrl();
const server = Bun.serve({ hostname: '127.0.0.1', port, async fetch(request) {
  const url = new URL(request.url);
  const requestHost = request.headers.get('Host')?.toLowerCase();
  if (requestHost !== `${host}:${port}` && requestHost !== `127.0.0.1:${port}` && requestHost !== `localhost:${port}`) return new Response('Not found', { status: 404 });
  if (request.method === 'GET' && ['/', '/new-store', '/storefront-web', '/storefront-web/'].includes(url.pathname)) {
    return new Response(html, { headers: { ...pageHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
  }
  if (request.method === 'GET' && url.pathname === '/continue') {
    if (!savedUrl) return new Response('Set THOR_SETUP_URL to a saved localhost onboarding link first.', { status: 404, headers: pageHeaders });
    return new Response(null, { status: 302, headers: { ...pageHeaders, Location: savedUrl } });
  }
  if (request.method === 'POST' && url.pathname === '/new-store') {
    const fetchSite = request.headers.get('Sec-Fetch-Site');
    if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return new Response('Origin not allowed', { status: 403 });
    try {
      creating ??= startThorSetup();
      const destination = await creating;
      return new Response(null, { status: 303, headers: { ...pageHeaders, Location: destination } });
    } catch (error) {
      console.error('Could not start Thor onboarding:', error);
      return new Response('Could not start setup. Confirm Node.js, npm/npx, and pnpm are available, then try again.', { status: 502, headers: pageHeaders });
    } finally { creating = undefined; }
  }
  return new Response('Not found', { status: 404 });
}});
console.log(`Thor setup launcher ready at http://${host}:${port}/new-store`);
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { server.stop(true); process.exit(0); });
