import ProductGrid from './graphql/storefront/ProductGrid.graphql' with { type:'text' };
import ProductDetail from './graphql/storefront/ProductDetail.graphql' with { type:'text' };
import ProductPrice from './graphql/storefront/ProductPrice.graphql' with { type:'text' };
import CartCreate from './graphql/storefront/CartCreate.graphql' with { type:'text' };
import CartAddLine from './graphql/storefront/CartAddLine.graphql' with { type:'text' };
import collectionsQuery from './graphql/admin/Collections.graphql' with { type:'text' };
// These are the only browser-invoked Storefront operations. The browser supplies
// validated values, never a query string, document, URL, or upstream credential.
export const operations={ProductGrid,ProductDetail,ProductPrice,CartCreate,CartAddLine} as const;
export { collectionsQuery };
