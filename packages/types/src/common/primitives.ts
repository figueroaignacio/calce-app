import { z } from 'zod';

/** Identificador de entidad. Todas las tablas usan UUID v4 como clave primaria. */
export const idSchema = z.uuid();
export type Id = z.infer<typeof idSchema>;

/**
 * Importe monetario en pesos.
 *
 * Se transporta como numero en el contrato HTTP. La base lo persiste como
 * `numeric(12, 2)`; la conversion es responsabilidad de la capa de repositorio.
 */
export const moneySchema = z.number().nonnegative().finite();
export type Money = z.infer<typeof moneySchema>;

/** Porcentaje de descuento sobre un importe, de 0 a 100. */
export const percentageSchema = z.number().min(0).max(100);
export type Percentage = z.infer<typeof percentageSchema>;

/** Marca temporal en formato ISO 8601 UTC. */
export const timestampSchema = z.iso.datetime();
export type Timestamp = z.infer<typeof timestampSchema>;

/** Anio de fabricacion de un vehiculo. */
export const modelYearSchema = z.number().int().min(1950).max(2100);
export type ModelYear = z.infer<typeof modelYearSchema>;

/** Campos de auditoria presentes en las entidades principales. */
export const auditFieldsSchema = z.object({
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type AuditFields = z.infer<typeof auditFieldsSchema>;
