import { type Customer, type PaginatedResponse } from '@calce/types';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CustomersRepository, type CustomerUpdateRecord } from './customers.repository';
import { type CreateCustomerDto } from './dto/create-customer.dto';
import { type QueryCustomersDto } from './dto/query-customers.dto';
import { type UpdateCustomerDto } from './dto/update-customer.dto';

/** Identifica una colision de indice unico aun si Drizzle envuelve el error. */
function isUniqueViolation(error: unknown): boolean {
  let current = error;
  for (let i = 0; i < 4; i += 1) {
    if (typeof current !== 'object' || current === null) return false;
    const details = current as { code?: unknown; cause?: unknown };
    if (details.code === '23505') return true;
    current = details.cause;
  }
  return false;
}

@Injectable()
export class CustomersService {
  constructor(private readonly repository: CustomersRepository) {}

  list(query: QueryCustomersDto): Promise<PaginatedResponse<Customer>> {
    return this.repository.findMany(query);
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.repository.findById(id);
    if (!customer) this.throwNotFound(id);
    return customer;
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    this.assertPriceListSupported(dto.priceListId);
    await this.assertTaxIdAvailable(dto.taxId);
    try {
      const id = await this.repository.create({
        businessName: dto.businessName,
        taxId: dto.taxId,
        taxCondition: dto.taxCondition,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        priceListId: dto.priceListId,
      });
      return this.findOne(id);
    } catch (error) {
      if (isUniqueViolation(error)) this.throwTaxIdConflict(dto.taxId);
      throw error;
    }
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    if (dto.priceListId !== undefined) this.assertPriceListSupported(dto.priceListId);
    if (dto.taxId !== undefined) await this.assertTaxIdAvailable(dto.taxId, id);
    const changes: CustomerUpdateRecord = { ...dto };
    try {
      const updated = await this.repository.update(id, changes);
      if (!updated) this.throwNotFound(id);
      return this.findOne(id);
    } catch (error) {
      if (isUniqueViolation(error)) this.throwTaxIdConflict(dto.taxId ?? '');
      throw error;
    }
  }

  async deactivate(id: string): Promise<void> {
    const updated = await this.repository.deactivate(id);
    if (!updated) this.throwNotFound(id);
  }

  private async assertTaxIdAvailable(taxId: string, allowedId?: string): Promise<void> {
    const existingId = await this.repository.findIdByTaxId(taxId);
    if (existingId && existingId !== allowedId) this.throwTaxIdConflict(taxId);
  }

  /** price_lists no existe: no aceptamos IDs que aparenten referencias validas. */
  private assertPriceListSupported(priceListId: string | null): void {
    if (priceListId !== null) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'La asignacion de lista de precios todavia no esta disponible',
      });
    }
  }

  private throwTaxIdConflict(taxId: string): never {
    throw new ConflictException({
      code: 'CONFLICT',
      message: `Ya existe un cliente con CUIT ${taxId}`,
    });
  }

  private throwNotFound(id: string): never {
    throw new NotFoundException({
      code: 'NOT_FOUND',
      message: `No existe un cliente con id ${id}`,
    });
  }
}
