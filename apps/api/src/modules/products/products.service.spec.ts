import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type ProductDetail } from '@calce/types';
import { type CreateProductDto } from './dto/create-product.dto';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

/**
 * El service se prueba con el repositorio mockeado: lo que se verifica son las
 * reglas de negocio, no el SQL. Que el repositorio traduzca bien a Drizzle es
 * responsabilidad de otro nivel de prueba.
 */
describe('ProductsService', () => {
  const repository = {
    findMany: jest.fn(),
    findById: jest.fn(),
    findIdBySku: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
  };

  let service: ProductsService;

  const detail = { id: 'product-1', sku: 'FIL-AC-0001' } as ProductDetail;

  const createDto: CreateProductDto = {
    sku: ' fil-ac-0001 ',
    description: 'Filtro de aceite Volkswagen Gol Trend 1.6',
    partBrandId: null,
    categoryId: null,
    listPrice: 8450,
    minStock: 12,
    warehouseLocation: 'A-01-03',
    codes: [{ type: 'OEM', code: '030115561an' }],
    applications: [],
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ProductsService, { provide: ProductsRepository, useValue: repository }],
    }).compile();

    service = moduleRef.get(ProductsService);
  });

  describe('findOne', () => {
    it('devuelve el producto cuando existe', async () => {
      repository.findById.mockResolvedValue(detail);

      await expect(service.findOne('product-1')).resolves.toBe(detail);
      expect(repository.findById).toHaveBeenCalledWith('product-1');
    });

    it('falla con NotFound cuando no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('inexistente')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('normaliza el SKU y la descripcion antes de persistir', async () => {
      repository.findIdBySku.mockResolvedValue(null);
      repository.create.mockResolvedValue('product-1');
      repository.findById.mockResolvedValue(detail);

      await service.create(createDto);

      expect(repository.findIdBySku).toHaveBeenCalledWith('FIL-AC-0001');
      expect(repository.create).toHaveBeenCalledWith({
        product: expect.objectContaining({
          sku: 'FIL-AC-0001',
          // Sin acentos, sin signos y en mayusculas: es lo que despues busca el
          // filtro por texto.
          normalizedDescription: 'FILTRO DE ACEITE VOLKSWAGEN GOL TREND 1 6',
        }),
        codes: [{ type: 'OEM', code: '030115561AN' }],
        applications: [],
      });
    });

    it('rechaza un SKU que ya existe', async () => {
      repository.findIdBySku.mockResolvedValue('otro-producto');

      await expect(service.create(createDto)).rejects.toBeInstanceOf(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deja pasar el mismo SKU cuando pertenece al producto que se edita', async () => {
      repository.findIdBySku.mockResolvedValue('product-1');
      repository.update.mockResolvedValue(true);
      repository.findById.mockResolvedValue(detail);

      await expect(service.update('product-1', { sku: 'FIL-AC-0001' })).resolves.toBe(detail);
    });

    it('recalcula la descripcion normalizada al cambiar la descripcion', async () => {
      repository.update.mockResolvedValue(true);
      repository.findById.mockResolvedValue(detail);

      await service.update('product-1', { description: 'Bujía de encendido' });

      expect(repository.update).toHaveBeenCalledWith('product-1', {
        product: {
          description: 'Bujía de encendido',
          normalizedDescription: 'BUJIA DE ENCENDIDO',
        },
      });
    });

    it('falla con NotFound cuando el producto no existe', async () => {
      repository.update.mockResolvedValue(false);

      await expect(service.update('inexistente', { minStock: 3 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('deactivate', () => {
    it('falla con NotFound cuando el producto no existe', async () => {
      repository.deactivate.mockResolvedValue(false);

      await expect(service.deactivate('inexistente')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
