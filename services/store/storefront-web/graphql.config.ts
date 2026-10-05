import { ApiType, thorCommerceApiProject } from '@thor-commerce/graphql-codegen-preset';
export default {
  projects:{
    storefront:thorCommerceApiProject({apiType:ApiType.Storefront,outputDir:'./src/generated/storefront',documents:['../thor-bff/src/graphql/storefront/*.graphql']}),
    admin:thorCommerceApiProject({apiType:ApiType.Admin,outputDir:'./src/generated/admin',documents:['../thor-bff/src/graphql/admin/*.graphql']}),
  },
};
