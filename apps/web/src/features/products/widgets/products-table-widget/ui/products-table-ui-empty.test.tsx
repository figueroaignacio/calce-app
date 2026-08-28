import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProductsTableUiEmpty } from './products-table-ui-empty';

describe('ProductsTableUiEmpty', () => {
  it('distingue el catalogo vacio de una busqueda sin resultados', () => {
    const { rerender } = render(<ProductsTableUiEmpty search="" onClearSearch={vi.fn()} />);

    expect(screen.getByText('Todavia no hay productos')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /limpiar/i })).not.toBeInTheDocument();

    rerender(<ProductsTableUiEmpty search="pastillas gol" onClearSearch={vi.fn()} />);

    expect(screen.getByText(/ningun producto coincide con "pastillas gol"/i)).toBeInTheDocument();
  });

  it('ofrece limpiar la busqueda cuando hay un termino aplicado', () => {
    const onClearSearch = vi.fn();

    render(<ProductsTableUiEmpty search="zzz" onClearSearch={onClearSearch} />);
    fireEvent.click(screen.getByRole('button', { name: /limpiar busqueda/i }));

    expect(onClearSearch).toHaveBeenCalledTimes(1);
  });
});
