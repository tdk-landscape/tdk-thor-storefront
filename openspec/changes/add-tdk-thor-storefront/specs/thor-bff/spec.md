## Purpose

Hold Thor credentials and market context on the server, and keep the Admin credential out of the browser.

## ADDED Requirements

### Requirement: Server-side credentials
`thor-bff` MUST hold `THOR_ACCESS_TOKEN` or a Better Auth session from `@thor-commerce/better-auth-thor`. Storefront and Admin GraphQL MUST be called only by `thor-bff`. Thor access tokens, Admin credentials, and Better Auth credentials used for upstream GraphQL MUST NOT be returned to the browser.

#### Scenario: Admin credential boundary
- **WHEN** the browser loads the storefront and calls the BFF
- **THEN** no response contains an Admin credential

### Requirement: Storefront GraphQL through the BFF
The BFF MUST expose service-relative `POST /storefront/graphql` under its generated Traefik prefix for the supported product grid, product detail, contextual-price, cart-create, and add-line operations. The browser MUST call this route; the BFF MUST call the configured Thor Storefront GraphQL endpoint with server-held credentials and buyer context. The route MUST NOT accept a caller-supplied upstream URL or perform Admin GraphQL operations.

#### Scenario: Product query path
- **WHEN** the browser requests products through the generated BFF route
- **THEN** the BFF calls Thor Storefront GraphQL with the active buyer context and returns product data without Thor credentials, and the browser makes no direct Thor GraphQL request

#### Scenario: Cart operation path
- **WHEN** the browser requests cart creation or add-line through the BFF
- **THEN** the BFF performs that Storefront GraphQL operation on Thor with the active context and returns the result without upstream credentials

#### Scenario: Admin query rejected on Storefront route
- **WHEN** a client submits an Admin operation or upstream URL to `POST /storefront/graphql`
- **THEN** the BFF rejects the request without calling Admin GraphQL

### Requirement: Health and context
`thor-bff` MUST expose service-relative `GET /health` and `GET /context` under its generated Traefik prefix. The context route MUST return the active market and optional company location.

#### Scenario: Context read
- **WHEN** a client calls `GET /context` on the generated BFF route
- **THEN** the response includes the active channel, market, currency, and company location when one is set

### Requirement: Single Admin read
`thor-bff` MUST expose service-relative `GET /collections` under the generated BFF prefix as the only Admin read in v1.

#### Scenario: Collections
- **WHEN** a client calls `GET /collections` on the generated BFF route
- **THEN** the BFF reads collections from Admin GraphQL and returns them without exposing the Admin credential

### Requirement: Buyer price context
When `THOR_COMPANY_LOCATION_ID` is set, the BFF MUST include that company location in the grid's Thor Storefront GraphQL request for the buyer's price. Prices MUST be whatever Thor returns. The repo MUST NOT compute prices.

#### Scenario: Company location set
- **WHEN** `THOR_COMPANY_LOCATION_ID` is set and the grid loads
- **THEN** the browser calls the BFF and the BFF's Thor price request includes that company location and the displayed price is Thor's response
