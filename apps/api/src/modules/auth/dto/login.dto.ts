import { loginSchema, type LoginInput } from '@calce/types';

/**
 * Los DTO no redefinen el contrato: lo toman de @calce/types, que es lo mismo
 * que valida el formulario del frontend. Duplicar el esquema aca garantizaria
 * que tarde o temprano las dos definiciones se separen.
 */
export const loginDtoSchema = loginSchema;

export type LoginDto = LoginInput;
