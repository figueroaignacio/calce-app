import { useEffect, useState } from 'react';

/**
 * Retrasa la propagacion de un valor que cambia rapido.
 *
 * Se usa para el buscador: sin esto, cada tecla dispara una request contra la
 * API y llegan respuestas fuera de orden.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      clearTimeout(timeout);
    };
  }, [value, delayMs]);

  return debounced;
}
