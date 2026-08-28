/**
 * Contrato de estados de un widget.
 *
 * Los tres estados que puede tener la data que baja de un container:
 *
 * undefined -> cargando        -> ui-skeleton
 * null      -> sin resultados  -> ui-empty
 * T         -> con datos       -> ui-data
 *
 * El container es el unico responsable de mapear el estado de TanStack Query a
 * este contrato. El widget queda reducido a un despacho de tres ramas.
 */
export type WidgetData<T> = T | null | undefined;

/**
 * Traduce el resultado de una query al contrato del widget.
 *
 * `isEmpty` decide que cuenta como "sin resultados" para ese caso concreto: en
 * una lista suele ser un array vacio, pero en un detalle puede ser otra cosa.
 */
export function toWidgetData<TData, TItem>(
  data: TData | undefined,
  isLoading: boolean,
  select: (data: TData) => TItem,
  isEmpty: (value: TItem) => boolean,
): WidgetData<TItem> {
  if (isLoading) {
    return undefined;
  }

  if (data === undefined) {
    return null;
  }

  const value = select(data);
  return isEmpty(value) ? null : value;
}
