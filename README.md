# TDK Thor storefront

A Vue 3 storefront and Hono BFF in one TDK `store` stack. TDK owns the landscape; Thor owns catalog, contextual prices, carts, and hosted checkout. No local database, payment flow, or order records.

## Run the complete storefront

### 1. Choose Bun or TDK

Both options use the same Thor store and root `.env`. Choose how to run the local storefront:

| Option | Start command | Storefront URL | Tools |
| --- | --- | --- | --- |
| Bun on your computer | `bun run dev:local` | `http://127.0.0.1:3300/storefront-web/` | Bun and Git |
| TDK with Traefik | `tdk up store` | `http://app.tdk-thor-storefront.localhost:8080/storefront-web/` | Bun, Git, Docker, Tilt, TDK CLI 1.3.75+ |

Creating a Thor store also needs Node.js LTS **22.18+**, npm/npx, and pnpm. Every executable must be available on `PATH` in the shell that starts onboarding or development.

```sh
bun --version
git --version
# Needed for Thor onboarding:
node --version
npm --version
npx --version
pnpm --version
# Needed for the TDK option:
tilt version
tdk --version
docker info
```

For TDK, start your Docker runtime first: `docker info` must connect to the engine. On Apple Silicon, use native ARM64 Docker/Colima/Lima; a Lima error about running under Rosetta means the runtime installation needs correcting. Older TDK releases do not generate Vue configuration correctly; see [the Vue framework gate](https://github.com/tdk-landscape/tdk-cli-core/pull/149).

### 2. Create or select a hosted Thor store

Thor runs at `api.thorcommerce.io`. The local TDK stack connects to that hosted store.

For an existing store, get its project slug from [accounts.thorcommerce.io](https://accounts.thorcommerce.io) and obtain the Storefront token, store ID, price-channel ID, country, and currency from its configuration.

The local setup page can also be used to browse storefront directions before creating the Thor store. It provides Everyday, Utility, Studio, Fieldwork, Supply, and Atelier previews:

```sh
bun run store:setup
# Open http://app.tdk-thor-storefront.localhost:8080/new-store
```

The launcher uses port 8080, so stop it before starting the TDK Traefik stack. The visual choice is a reference for the storefront look; Thor onboarding creates the hosted store separately. Set `THOR_SETUP_URL` to a saved local onboarding link if you want the **Continue saved setup** action to appear.

To create a store on this computer:

```sh
mkdir -p "$HOME/ThorStores"
npx --yes create-thor-store@latest --workspace "$HOME/ThorStores"
```

Open the onboarding link printed by the command and complete the browser steps yourself. Keep its local runner running; some versions detach it and return the shell prompt while setup continues. Setup saves progress and offers a completion prompt with the project slug, token, channel, market, and currency. Use that output to configure this landscape. The scaffold created under `ThorStores` is separate from this TDK repository.

An agent running onboarding should show you the link and let you complete the browser steps. Resume the agent with the completion-page prompt when setup finishes.

The onboarding link can use `127.0.0.1` and a temporary port. The storefront uses the Traefik URL in step 5. These addresses serve different stages of setup.

### 3. Clone and configure the landscape

```sh
git clone https://github.com/tdk-landscape/tdk-thor-storefront.git
cd tdk-thor-storefront
bun install --frozen-lockfile
cp .env.example .env
```

For an existing checkout, keep your current `.env`; do not overwrite its credentials. Edit the ignored root `.env` with your actual store values. For example, project slug `acme` produces:

```dotenv
THOR_STOREFRONT_URL=https://api.thorcommerce.io/acme/storefront/graphql
THOR_ADMIN_URL=https://api.thorcommerce.io/acme/admin/graphql
THOR_ACCESS_TOKEN=<your-storefront-token>
THOR_STORE_ID=<your-thor-store-id>
THOR_CHANNEL=<your-price-channel-id>
THOR_MARKET=NL
THOR_CURRENCY=EUR
```

Replace every placeholder; `NL` and `EUR` are examples and must match your store. The store ID is required for cart creation and is separate from the project slug. If onboarding omits it, obtain it from your Thor store configuration before starting the BFF. Set the separate `THOR_ADMIN_API_KEY` if you want the Admin collections route to work. Storefront tokens and Admin keys are different credentials.

Leave optional auth, company-location, and additional-market settings empty for the first run. The `.env.example` origin defaults match the Traefik URLs below. Keep tokens exclusively in `.env` and server environment variables.

### 4. Start with either option

**Option A — Bun:**

```sh
bun run dev:local
```

This command validates the root `.env`, starts the BFF on port 4300 and Vue/Vite on port 3300, and enables hot reload. It supplies matching local origins and the frontend BFF URL for this mode automatically. Open [the Bun storefront](http://127.0.0.1:3300/storefront-web/). Ctrl+C stops both processes; if either process exits, the launcher stops the other. Ports are fixed so a busy port cannot silently change the browser origin.

**Option B — TDK:**

```sh
# Optional offline preview; no Thor request or container startup:
tdk up store --dry-run
# Start the generated landscape:
tdk up store
```

The direct TDK command starts the generated Docker/Tilt/Traefik stack. The BFF validates its configuration before listening. Wait for `thor-bff` and `storefront-web` to become healthy, then open [the TDK storefront](http://app.tdk-thor-storefront.localhost:8080/storefront-web/).

For configuration checks before TDK startup, these repo commands are also available:

```sh
bun run thor:preflight
bun run thor:preflight --dry-run
# Equivalent TDK launch with configuration validation first:
bun run dev:store
```

The repo dry-run combines the TDK route preview with masked **set/missing** Thor env status. Missing values are report-only; a failed TDK preview fails the report. Neither offline preview establishes live Thor connectivity. Plain TDK dry-run has no Thor environment report.

Both startup options fail with a named configuration error when required Thor values are absent. A missing URL produces `THOR_STOREFRONT_URL_REQUIRED`; a missing store ID produces `THOR_STORE_ID_REQUIRED`. Direct TDK startup reports these errors in the BFF logs.

If you previously installed a temporary onboarding redirect on port 8080, stop that redirect before launching TDK. Inspect the listener with `lsof -nP -iTCP:8080 -sTCP:LISTEN`; stop only the process you recognize as the temporary redirect. It is a session helper outside this repository, and TDK needs that port for Traefik.

### 5. Check the running storefront

For Bun:

```sh
curl --fail http://127.0.0.1:4300/health
curl --fail http://127.0.0.1:4300/context
```

For TDK, use another terminal:

```sh
curl --fail http://api.tdk-thor-storefront.localhost:8080/api/thor-bff/health
curl --fail http://api.tdk-thor-storefront.localhost:8080/api/thor-bff/context
tdk networks
```

Health should return `status: "ok"`; context should show your configured market. Confirm actual Thor products in the grid, then try search, category filtering, detail, adding a line to a cart, and the hosted checkout link. A connection failure is displayed explicitly.

Edit `services/store/storefront-web/src/App.vue` to check hot reload. The TDK proxy should not need a rebuild.

### 6. Stop development

For Bun, press Ctrl+C in the `bun run dev:local` terminal. For TDK, run from the repository root:

```sh
tdk down
docker ps --format '{{.Names}}'
```

Confirm the running container list contains no containers for this TDK project. The Thor store remains hosted and available for the next run.

### Common startup failures

| Symptom | Action |
| --- | --- |
| Onboarding says `spawn pnpm ENOENT` | Make `pnpm` available on the runner's `PATH`, then click **Try again**. If its environment cannot be corrected in place, relaunch onboarding with the same workspace and a shell where `pnpm --version` succeeds. |
| `THOR_STORE_ID_REQUIRED` | Fill the root `.env` with the actual Thor store ID. Onboarding alone does not automatically configure this landscape. |
| Another `THOR_*_REQUIRED` or invalid-context error | Correct the named variable in the root `.env`, then rerun `bun run thor:preflight`. |
| `docker info` cannot connect | Start or repair the Docker engine before running TDK. |
| Port 8080 is occupied, or the storefront link opens onboarding | Stop the temporary onboarding redirect or other identified conflicting listener. |
| Connection to the `.localhost` URL is refused | Check that TDK is running and Traefik started on port 8080. Inspect Tilt's errors. |
| Storefront displays a Thor request failure | Check the project slug, HTTPS endpoint, Storefront token, store ID, and price-channel/country/currency values against the same Thor store. |
| `/collections` returns unavailable | Supply both the Admin endpoint and separate Admin API key if that optional read is needed. |

## Development store configuration

Keep credentials in the ignored root `.env`. Never put them in `VITE_` variables or service manifests.

| Variable | Meaning |
| --- | --- |
| `THOR_STOREFRONT_URL` | Your project Storefront endpoint, such as `https://api.thorcommerce.io/<project-slug>/storefront/graphql` |
| `THOR_ACCESS_TOKEN` | Protected Storefront token; BFF sends `x-thor-storefront-token`. Leave empty only if your store allows anonymous access. |
| `THOR_STORE_ID` | Thor store ID used by cart creation |
| `THOR_CHANNEL` | Default Thor price-channel ID |
| `THOR_MARKET` | Default two-letter country, such as `NL` |
| `THOR_CURRENCY` | Default three-letter currency, such as `EUR` |
| `THOR_ADMIN_URL`, `THOR_ADMIN_API_KEY` | Separate Admin endpoint and key for collections; BFF sends `X-Api-Key`. Without these, collections returns an explicit unavailable response. |
| `THOR_MARKETS` | Optional JSON array of `{id,label,channel,country,currency}` mappings; must include the default market ID |
| `THOR_COMPANY_LOCATION_ID` | Optional agency buyer-location metadata |
| `THOR_COMPANY_PRICE_CHANNEL_ID` | Explicit Thor buyer-channel mapping, required if company location is set |
| `THOR_AUTH_SECRET` | Optional secret of at least 32 characters enabling Better Auth customer sign-in |
| `THOR_FRONTEND_ORIGIN`, `THOR_BFF_ORIGIN` | Allowed public origins; include the proxy port |
| `VITE_THOR_BFF_URL` | Optional browser-safe BFF URL override; contains no credentials |

The public schema declares `storeId`, `priceChannelId`, `priceCountry`, and `priceCurrency`. The browser submits an allowlisted market ID; the BFF resolves its mapping. It never trusts caller-supplied price context. Company location has no native public-schema argument, so it requires an operator-provided buyer-channel mapping. No speculative company header or quantity-rule query is sent. Detail can render minimum, maximum, and increment only if a variant payload returns them; v1 does not require quantity rules.

Market or sign-in context changes discard the local cart reference. Prices, line totals, and checkout URLs come from Thor.

## Generated routes

TDK CLI 1.3.111 dry-run and its evaluated Tilt generator emitted these paths. Generated Compose labels confirm the prefixes and strip-prefix middleware. The CLI preview appends `/health` to the frontend link even though this frontend uses `/` for its health check; open the storefront root listed below. HTTP uses proxy port `8080` by default.

| Route | URL |
| --- | --- |
| Storefront | `http://app.tdk-thor-storefront.localhost:8080/storefront-web/` |
| Health | `http://api.tdk-thor-storefront.localhost:8080/api/thor-bff/health` |
| Context | `http://api.tdk-thor-storefront.localhost:8080/api/thor-bff/context` |
| Admin collections | `http://api.tdk-thor-storefront.localhost:8080/api/thor-bff/collections` |
| Storefront operations | `POST http://api.tdk-thor-storefront.localhost:8080/api/thor-bff/storefront/graphql` |

Use the canonical `app` host above so the frontend derives the matching `api` host. Changing proxy ports also requires matching origin configuration. Run `tdk networks` once the stack is up to inspect the active routes. Only proxy ports are published; the generated resource Compose has no resource `ports` bindings. BFF container port is 4300; frontend Vite development port is 3300 and the generated nginx image serves port 80.

The resources live under `services/store/`, with `storefront-web` depending on `thor-bff`. Docker, nginx, Traefik, and Tilt configuration are generated by TDK. Do not edit `.autogenerated/` or `.tdk/.tdk-out/`.

## API and session boundary

`POST /storefront/graphql` accepts exactly `ProductGrid`, `ProductDetail`, `ProductPrice`, `CartCreate`, and `CartAddLine`, backed by fixed query documents and strict per-operation variables. Arbitrary query text, unknown variables, Admin operations, unknown markets, and upstream URL overrides are rejected. `GET /collections` is the only Admin read. Thor tokens and upstream diagnostics are not returned to the browser.

With `THOR_AUTH_SECRET` configured, the BFF uses `@thor-commerce/better-auth-thor` for customer sign-in. Plugin cookies and Thor customer tokens stay inside the BFF. The browser receives an opaque HttpOnly session ID; sessions live in memory for one hour and a BFF restart requires sign-in again. Without auth configuration, the grid uses the server-side `.env` Storefront token fallback.

## Code generation and host development

```sh
bun run --cwd services/store/storefront-web codegen
bun run check
bun run test
bun run --cwd services/store/thor-bff build
bun run build:local
```

Codegen uses `@thor-commerce/graphql-codegen-preset` and these public, tenant-independent schema URLs:

- [Storefront schema](https://api.thorcommerce.io/storefront/graphql/schema.graphql)
- [Admin schema](https://api.thorcommerce.io/admin/graphql/schema.graphql)

The five Storefront documents and separate Admin collections document are validated during generation. Generated types are ignored and reproducible. Codegen is independent of TDK generation.

For host-only development, fill the same root `.env` with Thor values, then run these commands from the repository root in separate terminals:

```sh
# Terminal 1: BFF on port 4300.
THOR_FRONTEND_ORIGIN=http://127.0.0.1:3300 \
THOR_BFF_ORIGIN=http://127.0.0.1:4300 \
bun run --cwd services/store/thor-bff dev
```

```sh
# Terminal 2: Vite on port 3300, calling the BFF directly.
VITE_THOR_BFF_URL=http://127.0.0.1:4300 \
bun run --cwd services/store/storefront-web dev:local
```

Open `http://127.0.0.1:3300/storefront-web/`. This mode uses `vite.config.local.ts` and direct host ports; the full TDK commands above provide the Traefik `.localhost` route. The normal TDK frontend scripts use the generated Vite configuration.

## Live done checks

These require a configured development store and a working Docker engine:

1. From a clean clone, install dependencies, fill `.env`, and run `bun run dev:store`.
2. Open the canonical storefront route. Confirm actual Thor products, search, category filtering, variant selection, and contextual prices.
3. Configure a second supported market; switch and confirm the request uses its server-owned context and displays the returned price. Buyer-price checks require a real buyer-channel mapping.
4. Create a cart, add a line, and confirm checkout points to the Thor-hosted URL. Check Admin collections separately when Admin credentials exist.
5. Edit a Vue file and confirm hot reload without a Traefik rebuild.
6. Run `tdk down` and confirm no stack containers remain.

Public-schema codegen, host builds, and fixture-backed unit checks are available without tenant credentials. They do not establish successful live Thor access, Traefik routing, container startup, hot reload, or teardown. The OpenSpec live done tasks remain open until those checks pass.
