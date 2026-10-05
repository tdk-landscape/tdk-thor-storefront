## 1. Landscape scaffold

- [ ] 1.1 Create `tdk-landscape/tdk-thor-storefront` with `tdk project --yes`, then add `thor-bff` (`backend`, stack `store`) and `storefront-web` (`frontend`, `--framework vue`, stack `store`). Confirm `storefront-web/service.json` has `"framework": "vue"` and both resources are under `services/store/`.
- [ ] 1.2 Set `storefront-web` `dependsOn` to `thor-bff`. Confirm `tdk up store --dry-run` lists both resources and routes without calling Thor.
- [ ] 1.3 Document TDK CLI 1.3.75+ and the older-CLI Vue limitation. State that TDK owns the landscape and Thor owns commerce.

## 2. Thor connection

- [ ] 2.1 Commit `.env.example` with `THOR_STOREFRONT_URL`, `THOR_ADMIN_URL`, `THOR_ACCESS_TOKEN`, `THOR_CHANNEL`, `THOR_MARKET`, `THOR_CURRENCY`, and optional `THOR_COMPANY_LOCATION_ID`. Confirm `.env` is ignored.
- [ ] 2.2 Make `tdk up store` fail with a named error when `THOR_STOREFRONT_URL` is empty, before the storefront reports ready. Confirm the empty state does not look like an empty catalog.
- [ ] 2.3 Make `tdk up store --dry-run` report both Traefik hosts and Thor env status without making a Thor request. If this needs CLI support, document and resolve that dependency rather than implementing a misleading workaround.
- [ ] 2.4 Add `bun run codegen` in `storefront-web` using `@thor-commerce/graphql-codegen-preset` against the public Storefront and Admin schemas, not a tenant URL or TDK generator.

## 3. BFF

- [ ] 3.1 Implement `GET /api/thor-bff/health`, `GET /api/thor-bff/context`, and `GET /api/thor-bff/collections`. Verify health responds at `http://api.tdk-thor-storefront.localhost/api/thor-bff/health`; verify no Admin credential appears in browser responses.
- [ ] 3.2 Thread channel, market, currency, and optional company location from environment into Thor GraphQL context. Verify `/context` returns the active values.
- [ ] 3.3 Keep Thor credentials on the server; document any public Storefront token separately from Admin credentials if Thor requires a browser token.

## 4. Storefront screens

- [ ] 4.1 Build a Thor-backed product grid with search and category filter. When a company location is configured, request Thor's contextual price for that buyer.
- [ ] 4.2 Add product detail showing the selected variant, Thor's contextual price, and the quantity rule when a company location is set.
- [ ] 4.3 Add market switching that updates channel, country, and currency in the GraphQL context and reloads prices.
- [ ] 4.4 Create carts and add lines against Thor; link checkout to Thor hosted checkout. Keep payment and order records out of the landscape.
- [ ] 4.5 Use the Better Auth plugin when credentials exist and document the server-side `.env` token fallback. Confirm the fallback can load the grid.

## 5. Done check

- [ ] 5.1 From a clean clone, copy `.env.example` to `.env`, fill the required Thor credentials and market context, and run `tdk up store`. Confirm the grid lists products from the configured Thor store.
- [ ] 5.2 Edit a Vue file and confirm hot reload without rebuilding Traefik. Run `tdk down` and confirm nothing from the stack remains running.
