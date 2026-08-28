import { z } from 'zod';
import { auditFieldsSchema, idSchema } from '../common/primitives.js';
import { taxConditionSchema } from '../enums/tax-condition.js';

/** CUIT sin guiones: 11 digitos. */
export const taxIdSchema = z.string().regex(/^\d{11}$/, 'El CUIT debe tener 11 digitos');

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

export const createCustomerSchema = customerSchema.omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
