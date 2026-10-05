## Purpose

Point the landscape at an existing Thor store and fail by name when its Storefront URL is missing.

## ADDED Requirements

### Requirement: Documented store environment
The repo MUST commit `.env.example` and MUST NOT commit `.env`. The example MUST include `THOR_STOREFRONT_URL`, `THOR_ADMIN_URL`, `THOR_ACCESS_TOKEN`, `THOR_CHANNEL`, `THOR_MARKET`, `THOR_CURRENCY`, `THOR_STORE_ID`, separate `THOR_ADMIN_API_KEY`, optional `THOR_MARKETS`, and optional `THOR_COMPANY_LOCATION_ID` with its `THOR_COMPANY_PRICE_CHANNEL_ID` mapping. The Storefront token MUST use `x-thor-storefront-token`; the separate Admin key MUST use `X-Api-Key`, exclusively on the server.

#### Scenario: Clone setup
- **WHEN** an operator copies `.env.example` to `.env` and fills the Thor URLs, access token, and default market context
- **THEN** the stack can start against that Thor store and the filled file is not committed

### Requirement: Repo-owned configuration preflight
The repo MUST provide `bun run thor:preflight`, backed by `scripts/thor-preflight.ts`, and `bun run dev:store`. The preflight MUST load the root `.env` with process-env overrides and MUST exit nonzero with `THOR_STOREFRONT_URL_REQUIRED` when the Storefront URL is absent, empty, or whitespace-only. `dev:store` MUST run the preflight before `tdk up store` and MUST NOT invoke TDK when that check fails.

#### Scenario: Missing URL in documented startup
- **WHEN** an operator runs `bun run dev:store` without a nonblank `THOR_STOREFRONT_URL`
- **THEN** preflight exits nonzero with `THOR_STOREFRONT_URL_REQUIRED` and `tdk up store` is not invoked

#### Scenario: Configured startup
- **WHEN** an operator runs `bun run dev:store` with valid Thor configuration
- **THEN** preflight succeeds and the wrapper invokes `tdk up store`

### Requirement: BFF startup guard
The BFF entrypoint MUST reuse the Storefront URL validation before binding its listener. With missing configuration it MUST emit `THOR_STOREFRONT_URL_REQUIRED` and fail to become healthy. The storefront MUST show an explicit startup or connection error rather than a successful empty grid. This requirement MUST NOT depend on the TDK CLI inspecting Thor variables.

#### Scenario: Direct TDK startup without URL
- **WHEN** an operator bypasses the wrapper and runs `tdk up store` without a nonblank `THOR_STOREFRONT_URL`
- **THEN** the BFF fails before listening with `THOR_STOREFRONT_URL_REQUIRED`, and the storefront cannot show a successful empty product grid

### Requirement: Offline repo configuration report
`bun run thor:preflight --dry-run` MUST include the existing `tdk up store --dry-run` resource and generated Traefik route preview, plus set/missing status for the Thor environment variables. It MUST NOT print credential values, contact Thor, modify configuration, or start containers. Missing variables MUST be reported without failing the report-only mode; a failure of the TDK preview MUST be propagated. Plain `tdk up store --dry-run` MUST NOT be required to add Thor-specific output.

#### Scenario: Offline report with missing configuration
- **WHEN** an operator runs `bun run thor:preflight --dry-run` with missing Thor configuration and a successful TDK preview
- **THEN** the command exits zero, reports generated routes and missing variables without credential values, and makes no Thor request or runtime change

#### Scenario: Failed TDK preview
- **WHEN** the TDK preview invoked by `bun run thor:preflight --dry-run` exits nonzero
- **THEN** the repo report also exits nonzero and surfaces the preview failure

### Requirement: Public schema codegen
Schema fetch MUST NOT be tenant-specific. Codegen MUST use `@thor-commerce/graphql-codegen-preset` against the public Storefront schema at `https://api.thorcommerce.io/storefront/graphql/schema.graphql` and the public Admin schema at `https://api.thorcommerce.io/admin/graphql/schema.graphql` (the preset defaults). A `bun run codegen` script in `storefront-web` MUST regenerate types and MUST NOT be a TDK generator.

#### Scenario: Type generation
- **WHEN** an operator runs `bun run codegen` in `storefront-web`
- **THEN** types regenerate from the public Storefront and Admin schemas, not a tenant URL
