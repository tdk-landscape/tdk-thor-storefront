## Purpose

Show a Thor-backed storefront with grid, detail, market switch, cart, and hosted checkout, without a local commerce record.

## ADDED Requirements

### Requirement: Product grid
The storefront MUST list products from Thor, with search and a category filter.

#### Scenario: Grid load
- **WHEN** the operator has filled `.env` and the stack is up
- **THEN** the grid lists products from that Thor store, and search and category filtering narrow the list

### Requirement: Product detail
Product detail MUST show the selected variant, contextual price, and the quantity rule when a company location is set.

#### Scenario: Detail with location
- **WHEN** a company location is set and the operator opens a product
- **THEN** the page shows the variant, Thor's contextual price, and the quantity rule

### Requirement: Market switch
The market switch MUST write channel, country, and currency into Thor's GraphQL context and reload the price.

#### Scenario: Price changes with market
- **WHEN** the operator switches market and Thor returns a different contextual price
- **THEN** the displayed price changes to that contextual price

### Requirement: Cart and hosted checkout
The storefront MUST create a cart and add a line against Thor. Checkout MUST link to Thor hosted checkout. The repo MUST NOT take payment locally and MUST NOT store an order.

#### Scenario: Checkout handoff
- **WHEN** the operator adds a line and follows checkout
- **THEN** the cart exists on Thor and the browser is sent to Thor hosted checkout with no local order record

### Requirement: Sign-in fallback
The storefront MUST use the Better Auth plugin when its credentials exist. The server-side `.env` token MUST be the documented fallback.

#### Scenario: Token fallback
- **WHEN** Better Auth credentials are absent and `THOR_ACCESS_TOKEN` is set
- **THEN** the storefront uses the server-backed token path and the grid still lists products
