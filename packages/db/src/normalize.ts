/**
 * Normalizacion de texto del catalogo.
 *
 * Vive junto al esquema porque define el contenido de la columna
 * `products.normalized_description`: cualquier consumidor que escriba esa
 * columna tiene que usar esta misma funcion, o la busqueda deja de encontrar.
 *
 * Saca acentos, colapsa espacios, unifica separadores y pasa a mayusculas para
 * que "Filtro de Aceite", "filtro aceite" y "FILTRO  DE  ACEITE" caigan en la
 * misma forma comparable.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}
