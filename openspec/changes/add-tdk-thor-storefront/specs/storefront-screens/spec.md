## Purpose

Show a Thor-backed storefront with grid, detail, market switch, cart, and hosted checkout, without a local commerce record.

## ADDED Requirements

### Requirement: Product grid
The storefront MUST request products through the BFF Storefront GraphQL route and list the Thor response, with search and a category filter. The browser MUST NOT call Thor GraphQL directly or hold a Thor access token.

#### Scenario: Grid load
- **WHEN** the operator has filled `.env` and the stack is up
- **THEN** the browser queries the BFF, the BFF queries the configured Thor Storefront GraphQL endpoint, and the grid lists the returned products, and search and category filtering narrow the list

### Requirement: Product detail
Product detail MUST request its data through the BFF and show the selected variant, Thor contextual price, and a quantity rule only when Thor returns one in the variant payload. The public-schema operations MUST NOT query a speculative quantity-rule field.

#### Scenario: Detail price
- **WHEN** the operator opens a product
- **THEN** the page shows the selected variant and Thor's contextual price

#### Scenario: Optional quantity rule
- **WHEN** Thor returns a quantity rule in the selected variant payload
- **THEN** the page renders the returned minimum, maximum, and increment

#### Scenario: No quantity rule
- **WHEN** the public Thor payload has no quantity rule
- **THEN** detail and add-line remain usable without inventing a rule or querying unsupported fields

### Requirement: Market switch
The market switch MUST send a configured market ID to the BFF. The BFF MUST resolve the server-owned channel, country, and currency mapping and send the declared Thor `priceChannelId`, `priceCountry`, and `priceCurrency` variables. It MUST reject unknown markets and return refreshed prices. A market change MUST discard the previous local cart reference so a cart cannot retain a different price context.

#### Scenario: Price changes with market
- **WHEN** the operator switches market and Thor returns a different contextual price
- **THEN** the displayed price changes to that contextual price

### Requirement: Cart and hosted checkout
The storefront MUST request cart creation and add-line through the BFF, which MUST perform those operations on Thor Storefront GraphQL. Checkout MUST link to Thor hosted checkout. The repo MUST NOT take payment locally and MUST NOT store an order.

#### Scenario: Checkout handoff
- **WHEN** the operator adds a line and follows checkout
- **THEN** the browser calls the BFF for cart operations, the cart exists on Thor, and the browser is sent to Thor hosted checkout with no local order record

### Requirement: Sign-in fallback
The storefront MUST use the Better Auth plugin when its credentials exist. The server-side `.env` token MUST be the documented fallback.

#### Scenario: Token fallback
- **WHEN** Better Auth credentials are absent and `THOR_ACCESS_TOKEN` is set
- **THEN** the storefront uses the server-backed token path and the grid still lists products
