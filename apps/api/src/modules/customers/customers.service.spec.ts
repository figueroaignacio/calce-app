import {
  createCustomerSchema,
  isValidCuit,
  queryCustomersSchema,
  type Customer,
  type CreateCustomerInput,
} from '@calce/types';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { CustomersService } from './customers.service';

const customer: Customer = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  businessName: 'Repuestos del Sur',
  taxId: '20329642330',
  taxCondition: 'RESPONSABLE_INSCRIPTO',
  email: 'contacto@example.com',
  phone: null,
  address: null,
  priceListId: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const dto: CreateCustomerInput = {
  businessName: customer.businessName,
  taxId: customer.taxId,
  taxCondition: customer.taxCondition,
  email: customer.email,
  phone: null,
  address: null,
  priceListId: null,
};

describe('CustomersService', () => {
  const repository = {
    findMany: jest.fn(),
    findById: jest.fn(),
    findIdByTaxId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
  };
  let service: CustomersService;

  beforeEach(() => {
    jest.resetAllMocks();
    repository.findById.mockResolvedValue(customer);
    repository.findIdByTaxId.mockResolvedValue(null);
    repository.create.mockResolvedValue(customer.id);
    repository.update.mockResolvedValue(true);
    repository.deactivate.mockResolvedValue(true);
    service = new CustomersService(repository as unknown as CustomersRepository);
  });

  it('crea el cliente con los datos comerciales y fiscales', async () => {
    await expect(service.create(dto)).resolves.toEqual(customer);
    expect(repository.create).toHaveBeenCalledWith(dto);
  });

  it('rechaza un CUIT ya utilizado', async () => {
    repository.findIdByTaxId.mockResolvedValue('otro-id');
    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('traduce la colision del indice unico de PostgreSQL', async () => {
    repository.create.mockRejectedValue({ cause: { code: '23505' } });
    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('permite actualizar manteniendo el CUIT propio', async () => {
    repository.findIdByTaxId.mockResolvedValue(customer.id);
    await service.update(customer.id, { taxId: customer.taxId, businessName: 'Nombre nuevo' });
    expect(repository.update).toHaveBeenCalledWith(customer.id, {
      taxId: customer.taxId,
      businessName: 'Nombre nuevo',
    });
  });

  it('rechaza actualizar el CUIT a uno ajeno', async () => {
    repository.findIdByTaxId.mockResolvedValue('otro-id');
    await expect(service.update(customer.id, { taxId: customer.taxId })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('no acepta listas de precios inexistentes', async () => {
    await expect(service.create({ ...dto, priceListId: customer.id })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('da de baja logicamente al cliente', async () => {
    await service.deactivate(customer.id);
    expect(repository.deactivate).toHaveBeenCalledWith(customer.id);
  });

  it('devuelve NotFound al consultar o modificar clientes inexistentes', async () => {
    repository.findById.mockResolvedValue(null);
    repository.deactivate.mockResolvedValue(false);
    await expect(service.findOne(customer.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.deactivate(customer.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('Contratos de Clientes', () => {
  it('valida el digito verificador del CUIT', () => {
    expect(isValidCuit('20329642330')).toBe(true);
    expect(isValidCuit('20329642331')).toBe(false);
    expect(createCustomerSchema.safeParse({ ...dto, taxId: '20329642331' }).success).toBe(false);
  });

  it('interpreta el filtro isActive=false correctamente', () => {
    const parsed = queryCustomersSchema.parse({ isActive: 'false' });
    expect(parsed.isActive).toBe(false);
    expect(parsed.page).toBe(1);
  });
});
