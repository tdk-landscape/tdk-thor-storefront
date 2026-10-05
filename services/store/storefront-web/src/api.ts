export interface Money {centAmount:number;currencyCode:string;fractionDigits:number}
export interface Variant {id:string;name:string;sku:string|null;image:{src:string;altText:string|null}|null;price:{value:Money}|null;availability:{availableForSale:boolean;availableQuantity:number}|null;quantityRule?:{minimum:number;maximum:number|null;increment:number}|null}
export interface Product {id:string;name:string;slug:string;description:string|null;heroVariant:Variant|null;variants:{nodes:Variant[]};categories:{nodes:{id:string;name:string}[]}}
export interface Cart {id:string;currency:string;checkoutUrl:string;total:Money;subtotal:Money;lineItems:{nodes:{id:string;productName:string;variantName:string;quantity:number;total:Money;unitPrice:{value:Money};variant:{image:{src:string;altText:string|null}|null}|null}[]}}
export interface Context {channel:string;market:string;country:string;currency:string;storeId:string;companyLocationId:string|null;markets:{id:string;label:string;channel:string;country:string;currency:string}[];authEnabled:boolean}
export interface User {id:string;email:string;name:string}
export type Operation='ProductGrid'|'ProductDetail'|'ProductPrice'|'CartCreate'|'CartAddLine';
const browserOrigin=typeof window==='undefined'?'http://api.tdk-thor-storefront.localhost:8080':window.location.origin.replace('://app.', '://api.');
const base=(import.meta.env.VITE_THOR_BFF_URL || `${browserOrigin}/api/thor-bff`).replace(/\/$/,'');
export async function request<T>(path:string,body?:unknown,signal?:AbortSignal):Promise<T> {
 let response:Response;try {response=await fetch(`${base}${path}`,{method:body===undefined?'GET':'POST',credentials:'include',headers:body===undefined?undefined:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal});}catch(error){if(signal?.aborted)throw error;throw new Error('The store connection is unavailable. Please try again shortly.');}
 let payload:any;try{payload=await response.json();}catch{throw new Error('The store did not return a usable response. Check that the store service is running.');}
 if(!response.ok || payload.error)throw new Error(payload.error?.message || 'The store could not complete this request.');
 if(payload.errors?.length)throw new Error(payload.errors.map((item:{message?:string})=>item.message || 'Request failed').join(' '));return payload as T;
}
export function operation<T>(operation:Operation,variables:Record<string,unknown>={},marketId?:string,signal?:AbortSignal){return request<T>('/storefront/graphql',{operation,variables,...(marketId?{marketId}:{})},signal);}
export function formatMoney(value:Money){return new Intl.NumberFormat(undefined,{style:'currency',currency:value.currencyCode,minimumFractionDigits:value.fractionDigits,maximumFractionDigits:value.fractionDigits}).format(value.centAmount/10**value.fractionDigits);}
export function checkoutLink(value:string):string|null{try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:null;}catch{return null;}}
export function validQuantity(quantity:number,variant:Variant){const rule=variant.quantityRule;return Number.isSafeInteger(quantity)&&quantity>0&&quantity<=10000&&(!rule||(quantity>=rule.minimum&&(rule.maximum===null||quantity<=rule.maximum)&&(quantity-rule.minimum)%rule.increment===0));}
export function mutationCart(result:{cart:Cart|null;errors:{message?:string;__typename?:string}[]|null}):Cart{if(result.errors?.length)throw new Error(result.errors.map(item=>item.message?.trim() || 'The store could not update your bag. Please try again.').join(' '));if(!result.cart)throw new Error('Your bag could not be updated. Please try again.');return result.cart;}
