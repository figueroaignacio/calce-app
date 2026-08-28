import { z } from 'zod';

/** Situacion del cliente frente al IVA segun la categorizacion de ARCA. */
export const TAX_CONDITIONS = [
  'RESPONSABLE_INSCRIPTO',
  'MONOTRIBUTO',
  'EXENTO',
  'CONSUMIDOR_FINAL',
] as const;

export const taxConditionSchema = z.enum(TAX_CONDITIONS);

export type TaxCondition = z.infer<typeof taxConditionSchema>;
