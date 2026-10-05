## 1. Landscape scaffold

- [x] 1.1 Scaffold this existing repository with `tdk project --yes`, then add `thor-bff` (`backend`, stack `store`) and `storefront-web` (`frontend`, `--framework vue`, stack `store`). Confirm `storefront-web/service.json` has `"framework": "vue"` and both resources are under `services/store/`.
- [x] 1.2 Set `storefront-web` `dependsOn` to `thor-bff`. Confirm `tdk up store --dry-run` lists both resources and generated routes without calling Thor; record and verify the concrete public URLs in the repo README.
- [x] 1.3 Document TDK CLI 1.3.75+ and the older-CLI Vue limitation. State that TDK owns the landscape and Thor owns commerce.

## 2. Thor connection

- [x] 2.1 Document in `.env.example` how to obtain the Thor project slug from `accounts.thorcommerce.io` or the `npx --yes create-thor-store@latest --workspace <ThorStores-folder>` onboarding completion prompt, with hosted Storefront and Admin URL templates. Include the server credentials and market context variables; keep optional company location mapped to its buyer price channel. Confirm `.env` is ignored.
- [x] 2.2 Add `scripts/thor-preflight.ts`, `bun run thor:preflight`, and `bun run dev:store`. Verify absent, empty, and whitespace-only Storefront URLs fail with `THOR_STOREFRONT_URL_REQUIRED` before the wrapper invokes TDK; reuse the guard in the BFF entrypoint before it binds its listener and show an explicit frontend error if direct TDK startup fails.
- [x] 2.3 Add `bun run thor:preflight --dry-run` to combine the existing TDK dry-run resource/route preview with masked Thor env set/missing status. Verify missing variables are report-only, TDK preview failures propagate, and no Thor request, configuration write, or container startup occurs. Document the repo command separately from plain TDK dry-run.
- [x] 2.4 Add `bun run codegen` in `storefront-web` using `@thor-commerce/graphql-codegen-preset` against `https://api.thorcommerce.io/storefront/graphql/schema.graphql` and `https://api.thorcommerce.io/admin/graphql/schema.graphql` (preset defaults), with `@graphql-codegen/cli` and `graphql` installed. Verify no tenant schema URL or TDK generator is used.

- [x] 2.5 Add `bun run dev:local` to validate the root Thor environment, run both resources with local origins on ports 3300/4300, refuse occupied ports, and stop both children together. Document direct `tdk up store` as the Traefik option.

## 3. BFF

- [x] 3.1 Implement service-relative `GET /health`, `GET /context`, and `GET /collections` under the generated BFF prefix. Verify their generated public URLs; keep collections as the only Admin read and verify no Thor credential appears in browser responses.
- [x] 3.2 Thread server-owned market mappings into Thor's declared `storeId`, `priceChannelId`, `priceCountry`, and `priceCurrency` variables; resolve an optional company location through its explicitly configured buyer price channel. Verify `/context` returns the active values.
- [x] 3.3 Implement service-relative `POST /storefront/graphql` for supported product, detail, contextual-price, cart-create, and add-line operations. Verify the browser calls only the BFF, the BFF calls only the configured Storefront endpoint for those operations, and Admin queries or caller-supplied upstream URLs are rejected.

## 4. Storefront screens

- [x] 4.1 Build a product grid through the BFF Storefront GraphQL route with search and category filter. When a company location is configured, request Thor's contextual price for that buyer.
- [x] 4.2 Add product detail through the BFF showing the selected variant and Thor's contextual price. Do not require or query a quantity-rule field; when absent from the payload, do not invent a rule.
- [x] 4.3 Add market switching by allowlisted market ID; the BFF resolves channel, country, currency, and optional buyer-channel mapping and returns refreshed prices. Discard the previous cart reference on a context change.
- [x] 4.4 Create carts and add lines through the BFF against Thor; link checkout to Thor hosted checkout. Keep payment and order records out of the landscape.
- [x] 4.5 Use the Better Auth plugin when credentials exist and document the server-side `.env` token fallback. Confirm the fallback can load the grid.

## 5. Done check

- [ ] 5.1 From a clean clone, copy `.env.example` to `.env`, fill the required Thor credentials and market context, and run `bun run dev:store` to preflight then invoke `tdk up store`. Confirm the grid lists products from the configured Thor store.
- [ ] 5.2 Edit a Vue file and confirm hot reload without rebuilding Traefik. Run `tdk down` and confirm nothing from the stack remains running.

## Verification status

Implementation and offline verification cover tasks 1–4: CLI preview and evaluated generator routes, parsed Compose (two resources, no published resource ports, server-only Thor environment), strict operation validation against both public schemas, TypeScript checks, generated-config frontend build, bundled BFF build, and fixture-backed checks. Live tasks 5.1 and 5.2 remain open: no development-store credentials were supplied and the local Docker engine is unavailable. Quantity rules are conditional and are not part of the public-schema v1 done check.
