import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CustomerForm } from './customer-form';

describe('CustomerForm', () => {
  it('rechaza el CUIT con digito verificador incorrecto', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<CustomerForm busy={false} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Razon social *'), {
      target: { value: 'Repuestos Sur' },
    });
    fireEvent.change(screen.getByLabelText('CUIT (11 digitos, sin guiones) *'), {
      target: { value: '20329642331' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cliente' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('digito verificador');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('permite guardar un CUIT valido con datos requeridos', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<CustomerForm busy={false} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Razon social *'), {
      target: { value: 'Repuestos Sur' },
    });
    fireEvent.change(screen.getByLabelText('CUIT (11 digitos, sin guiones) *'), {
      target: { value: '20329642330' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cliente' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          taxId: '20329642330',
          businessName: 'Repuestos Sur',
          priceListId: null,
        }),
      ),
    );
  });
});
