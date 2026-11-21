import { z } from 'zod';
import { auditFieldsSchema, idSchema } from '../common/primitives.js';
import { paginationQuerySchema, sortOrderSchema } from '../common/pagination.js';
import { taxConditionSchema } from '../enums/tax-condition.js';

/** Valida el digito verificador ARCA de un CUIT (11 digitos, sin guiones). */
export function isValidCuit(value: string): boolean {
  if (!/^\d{11}$/.test(value)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((total, weight, index) => total + weight * Number(value[index]), 0);
  const remainder = 11 - (sum % 11);
  const checkDigit = remainder === 11 ? 0 : remainder === 10 ? 9 : remainder;
  return checkDigit === Number(value[10]);
}

/** CUIT sin guiones, con longitud y digito verificador correctos. */
export const taxIdSchema = z
  .string()
  .regex(/^\d{11}$/, 'El CUIT debe tener 11 digitos sin guiones')
  .refine(isValidCuit, 'El digito verificador del CUIT no es valido');

export const customerSchema = z
  .object({
    id: idSchema,
    businessName: z.string().min(1).max(200),
    taxId: taxIdSchema,
    taxCondition: taxConditionSchema,
    email: z.email().nullable(),
    phone: z.string().max(40).nullable(),
    address: z.string().max(200).nullable(),
    priceListId: idSchema.nullable(),
    isActive: z.boolean(),
  })
  .extend(auditFieldsSchema.shape);
export type Customer = z.infer<typeof customerSchema>;

/** Los campos opcionales se completan con null para preservar el contrato HTTP. */
export const createCustomerSchema = z.object({
  businessName: z.string().trim().min(1, 'La razon social es obligatoria').max(200),
  taxId: taxIdSchema,
  taxCondition: taxConditionSchema,
  email: z.email().nullable().default(null),
  phone: z.string().trim().max(40).nullable().default(null),
  address: z.string().trim().max(200).nullable().default(null),
  priceListId: idSchema.nullable().default(null),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const CUSTOMER_SORT_FIELDS = ['businessName', 'taxId', 'createdAt', 'updatedAt'] as const;
export const customerSortFieldSchema = z.enum(CUSTOMER_SORT_FIELDS);
export type CustomerSortField = z.infer<typeof customerSortFieldSchema>;

export const queryCustomersSchema = paginationQuerySchema.extend({
  search: z.string().trim().max(120).optional(),
  isActive: z.stringbool().optional(),
  sortBy: customerSortFieldSchema.default('businessName'),
  sortOrder: sortOrderSchema.default('asc'),
});
export type QueryCustomersInput = z.infer<typeof queryCustomersSchema>;
