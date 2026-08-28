import { type ProductListItem } from '@calce/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProductsTableWidget, type ProductsTableWidgetProps } from './products-table-widget';

/**
 * El widget es un despacho de tres ramas sobre `WidgetData`. Esta prueba fija
 * ese contrato: es la regla que replican todos los widgets del frontend.
 */
const product: ProductListItem = {
  id: '11111111-1111-4111-8111-111111111111',
  sku: 'FIL-AC-0001',
  description: 'Filtro de aceite Volkswagen Gol Trend 1.6',
  normalizedDescription: 'FILTRO DE ACEITE VOLKSWAGEN GOL TREND 1 6',
  partBrandId: null,
  categoryId: null,
  listPrice: 8450,
  minStock: 12,
  warehouseLocation: 'A-01-03',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  partBrandName: 'Fram',
  categoryName: 'Filtro de aceite',
  stock: 48,
};

function renderWidget(data: ProductsTableWidgetProps['data']) {
  return render(
    <ProductsTableWidget
      data={data}
      search=""
      page={1}
      pageSize={10}
      totalItems={data ? data.length : 0}
      totalPages={1}
      sortBy="sku"
      sortOrder="asc"
      isRefreshing={false}
      onSortChange={vi.fn()}
      onPageChange={vi.fn()}
      onClearSearch={vi.fn()}
    />,
  );
}

describe('ProductsTableWidget', () => {
  it('undefined muestra el esqueleto de carga', () => {
    renderWidget(undefined);

    expect(screen.getByText('Cargando productos')).toBeInTheDocument();
    expect(screen.queryByText(product.sku)).not.toBeInTheDocument();
  });

  it('null muestra el estado sin resultados', () => {
    renderWidget(null);

    expect(screen.getByText('Todavia no hay productos')).toBeInTheDocument();
  });

  it('un array con datos muestra la tabla', () => {
    renderWidget([product]);

    expect(screen.getByText(product.sku)).toBeInTheDocument();
    expect(screen.getByText(product.description)).toBeInTheDocument();
    // El stock derivado del libro de movimientos se muestra tal cual.
    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeDisabled();
  });
});
