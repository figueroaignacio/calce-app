import { queryProductsSchema, type QueryProductsInput } from '@calce/types';

export const queryProductsDtoSchema = queryProductsSchema;

/** Ya viene con page, pageSize, sortBy y sortOrder resueltos por el default. */
export type QueryProductsDto = QueryProductsInput;
