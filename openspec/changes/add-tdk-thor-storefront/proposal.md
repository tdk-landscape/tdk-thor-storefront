## Why

Agencies with an existing Thor Commerce store need a TDK landscape they can clone, point at that store, and build on. Unlike `tdk-ecommerce-example`, this landscape delegates catalog, pricing, cart, and checkout to Thor; TDK only starts the storefront landscape.

## What Changes

- Add the `tdk-landscape/tdk-thor-storefront` example: one `store` stack with a Vue 3 + Vite storefront and a Hono-on-Bun Thor BFF, with no database or cluster.
- Put both resources under `services/store/`, wire the storefront to depend on the BFF, and use the shared Docker, nginx, Traefik, and Tilt runtime without publishing container ports on localhost.
- Require TDK CLI 1.3.75 or newer for Vue framework support; document that older CLIs ignore `"framework": "vue"` and generate React configuration.
- Commit `.env.example`, keep `.env` ignored, fail by name when `THOR_STOREFRONT_URL` is missing, and make `tdk up store --dry-run` show routes and Thor env status without contacting Thor.
- Provide a Thor-backed product grid and detail, market switching, cart creation and add-line, hosted-checkout handoff, and one Admin collections read on the BFF. Thor supplies all prices.
- State the ownership split in the README: TDK owns the landscape; Thor owns commerce.

## Capabilities

### New Capabilities

- `store-landscape`: One `store` stack with the Vue storefront and Thor BFF on the shared TDK runtime.
- `thor-store-connection`: Store configuration, startup validation, dry-run behavior, and public-schema codegen.
- `thor-bff`: Server-side Thor credentials and market context, plus the single Admin read.
- `storefront-screens`: Thor-backed grid, detail, market switch, cart, and hosted-checkout handoff.

### Modified Capabilities

None. This change introduces a new example repo and does not change `tdk-ecommerce-example` or TDK CLI requirements.

## Impact

- New public repo: `tdk-landscape/tdk-thor-storefront`.
- Runtime dependencies: Docker, Tilt, Bun, and TDK CLI 1.3.75 or newer. Storefront codegen uses `@thor-commerce/graphql-codegen-preset`; optional sign-in uses `@thor-commerce/better-auth-thor`.
- Agencies need an existing Thor store with Storefront GraphQL, Admin GraphQL, B2B context where applicable, and more than one market for the market-switch demonstration.
- Out of scope: company accounts, quotes, shopping lists, refunds, fulfillment, a second channel storefront, local payment/order records, and a `--with thor` CLI flag.
