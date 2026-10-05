## Purpose

Point the landscape at an existing Thor store and fail by name when its Storefront URL is missing.

## ADDED Requirements

### Requirement: Documented store environment
The repo MUST commit `.env.example` and MUST NOT commit `.env`. The example MUST include `THOR_STOREFRONT_URL`, `THOR_ADMIN_URL`, `THOR_ACCESS_TOKEN`, `THOR_CHANNEL`, `THOR_MARKET`, `THOR_CURRENCY`, and optional `THOR_COMPANY_LOCATION_ID`.

#### Scenario: Clone setup
- **WHEN** an operator copies `.env.example` to `.env` and fills the Thor URLs, access token, and default market context
- **THEN** the stack can start against that Thor store and the filled file is not committed

### Requirement: Named refusal on empty Storefront URL
`tdk up store` MUST refuse to start when `THOR_STOREFRONT_URL` is empty, with a named error, and MUST NOT serve an empty product grid as if setup succeeded.

#### Scenario: Missing URL
- **WHEN** an operator runs `tdk up store` with an empty `THOR_STOREFRONT_URL`
- **THEN** startup fails with an error naming `THOR_STOREFRONT_URL` and no product grid is served

### Requirement: Dry run does not call Thor
`tdk up store --dry-run` MUST print the Traefik hosts and whether the Thor environment is set, and MUST NOT call Thor.

#### Scenario: Dry run
- **WHEN** an operator runs `tdk up store --dry-run`
- **THEN** the output shows the Traefik hosts and Thor environment status, and Thor receives no request

### Requirement: Public schema codegen
Schema fetch MUST NOT be tenant-specific. Codegen MUST use `@thor-commerce/graphql-codegen-preset` against the public Storefront schema at `https://api.thorcommerce.io/storefront/graphql/schema.graphql` and the public Admin schema. A `bun run codegen` script in `storefront-web` MUST regenerate types and MUST NOT be a TDK generator.

#### Scenario: Type generation
- **WHEN** an operator runs `bun run codegen` in `storefront-web`
- **THEN** types regenerate from the public Storefront and Admin schemas, not a tenant URL
