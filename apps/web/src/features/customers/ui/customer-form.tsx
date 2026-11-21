import {
  TAX_CONDITIONS,
  createCustomerSchema,
  type CreateCustomerInput,
  type Customer,
  type TaxCondition,
} from '@calce/types';
import { useState, type FormEvent } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

const TAX_LABELS: Record<TaxCondition, string> = {
  RESPONSABLE_INSCRIPTO: 'Responsable inscripto',
  MONOTRIBUTO: 'Monotributo',
  EXENTO: 'Exento',
  CONSUMIDOR_FINAL: 'Consumidor final',
};

export interface CustomerFormProps {
  initial?: Customer | null;
  busy: boolean;
  onSave: (data: CreateCustomerInput) => Promise<void>;
  onCancel: () => void;
}

/** Formulario validado con el mismo contrato Zod que usa la API. */
export function CustomerForm({ initial, busy, onSave, onCancel }: CustomerFormProps) {
  const [form, setForm] = useState<CreateCustomerInput>({
    businessName: initial?.businessName ?? '',
    taxId: initial?.taxId ?? '',
    taxCondition: initial?.taxCondition ?? 'RESPONSABLE_INSCRIPTO',
    email: initial?.email ?? null,
    phone: initial?.phone ?? null,
    address: initial?.address ?? null,
    priceListId: null, // Listas de precios: modulo aun no implementado.
  });
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createCustomerSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados');
      return;
    }

    setError('');
    try {
      await onSave(parsed.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar el cliente');
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className="rounded-xl border bg-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{initial ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        <span className="text-xs text-muted-foreground">Los campos con * son obligatorios</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="customer-business-name">Razon social *</Label>
          <Input
            id="customer-business-name"
            required
            maxLength={200}
            value={form.businessName}
            onChange={(event) => setForm({ ...form, businessName: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-tax-id">CUIT (11 digitos, sin guiones) *</Label>
          <Input
            id="customer-tax-id"
            required
            inputMode="numeric"
            maxLength={11}
            value={form.taxId}
            onChange={(event) =>
              setForm({ ...form, taxId: event.target.value.replace(/\D/g, '').slice(0, 11) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-tax-condition">Condicion frente al IVA *</Label>
          <select
            id="customer-tax-condition"
            value={form.taxCondition}
            onChange={(event) =>
              setForm({ ...form, taxCondition: event.target.value as TaxCondition })
            }
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {TAX_CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {TAX_LABELS[condition]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-email">Correo electronico</Label>
          <Input
            id="customer-email"
            type="email"
            value={form.email ?? ''}
            onChange={(event) => setForm({ ...form, email: event.target.value || null })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-phone">Telefono</Label>
          <Input
            id="customer-phone"
            maxLength={40}
            value={form.phone ?? ''}
            onChange={(event) => setForm({ ...form, phone: event.target.value || null })}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="customer-address">Direccion</Label>
          <Input
            id="customer-address"
            maxLength={200}
            value={form.address ?? ''}
            onChange={(event) => setForm({ ...form, address: event.target.value || null })}
          />
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? 'Guardando...' : 'Guardar cliente'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
