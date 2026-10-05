## Purpose

Hold Thor credentials and market context on the server, and keep the Admin credential out of the browser.

## ADDED Requirements

### Requirement: Server-side credentials
`thor-bff` MUST hold `THOR_ACCESS_TOKEN` or a Better Auth session from `@thor-commerce/better-auth-thor`. Admin GraphQL MUST be called only by `thor-bff`; Admin credentials MUST NOT reach the browser. Any Storefront token exposed to the browser MUST be distinct from the Admin credential and documented as public/least-privileged.

#### Scenario: Admin credential boundary
- **WHEN** the browser loads the storefront and calls the BFF
- **THEN** no response contains an Admin credential

### Requirement: Health and context
`thor-bff` MUST expose `GET /api/thor-bff/health` and `GET /api/thor-bff/context`. The context route MUST return the active market and optional company location.

#### Scenario: Context read
- **WHEN** a client calls `GET /api/thor-bff/context`
- **THEN** the response includes the active channel, market, currency, and company location when one is set

### Requirement: Single Admin read
`thor-bff` MUST expose `GET /api/thor-bff/collections` as the only Admin read in v1.

#### Scenario: Collections
- **WHEN** a client calls `GET /api/thor-bff/collections`
- **THEN** the BFF reads collections from Admin GraphQL and returns them without exposing the Admin credential

### Requirement: Buyer price context
When `THOR_COMPANY_LOCATION_ID` is set, the product grid MUST ask Thor for that buyer's price. Prices MUST be whatever Thor returns. The repo MUST NOT compute prices.

#### Scenario: Company location set
- **WHEN** `THOR_COMPANY_LOCATION_ID` is set and the grid loads
- **THEN** the Thor price request includes that company location and the displayed price is Thor's response
