import {afterEach,describe,expect,it,vi} from 'vitest';
import {checkoutLink,formatMoney,mutationCart,operation,validQuantity,type Variant} from '../src/api';
const variant:Variant={id:'v1',name:'Small',sku:null,image:null,price:null,availability:null};
afterEach(()=>vi.unstubAllGlobals());
describe('safe checkout and Thor quantities',()=>{
 it('renders only absolute http checkout links',()=>{expect(checkoutLink('javascript:alert(1)')).toBeNull();expect(checkoutLink('/checkout')).toBeNull();expect(checkoutLink('https://store.example/checkout')).toBe('https://store.example/checkout');});
 it('formats fractional units without assuming cents',()=>{expect(formatMoney({centAmount:12345,currencyCode:'USD',fractionDigits:3})).toContain('12.345');});
 it('accepts ordinary positive quantities when Thor supplies no rule',()=>{expect(validQuantity(3,variant)).toBe(true);expect(validQuantity(1.5,variant)).toBe(false);expect(validQuantity(0,variant)).toBe(false);});
 it('honors optional quantity bounds and increments',()=>{const ruled={...variant,quantityRule:{minimum:2,maximum:8,increment:3}};expect(validQuantity(5,ruled)).toBe(true);expect(validQuantity(6,ruled)).toBe(false);expect(validQuantity(11,ruled)).toBe(false);});
 it('does not accept a cart alongside mutation errors',()=>{expect(()=>mutationCart({cart:{id:'bad'} as never,errors:[{message:'Inventory changed'}]})).toThrow('Inventory changed');});
});
describe('BFF operation transport',()=>{
 it('uses a named envelope and includes session credentials',async()=>{const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({data:{product:null}})));vi.stubGlobal('fetch',fetchMock);await operation('ProductDetail',{id:'p1'},'eu');const [url,options]=fetchMock.mock.calls[0];expect(url).toContain('/api/thor-bff/storefront/graphql');expect(options.credentials).toBe('include');expect(JSON.parse(options.body)).toEqual({operation:'ProductDetail',variables:{id:'p1'},marketId:'eu'});});
 it('fails on GraphQL errors even when HTTP succeeds',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({data:{product:null},errors:[{message:'Market unavailable'}]}))));await expect(operation('ProductDetail',{id:'p1'})).rejects.toThrow('Market unavailable');});
 it('provides a connection message for non-JSON responses',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('<html>Gateway unavailable</html>',{status:502})));await expect(operation('ProductGrid')).rejects.toThrow('store service is running');});
});
