import { normalizeSearchText } from '@calce/db';
import { type PaginatedResponse, type ProductDetail, type ProductListItem } from '@calce/types';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { type CreateProductDto } from './dto/create-product.dto';
import { type QueryProductsDto } from './dto/query-products.dto';
import { type UpdateProductDto } from './dto/update-product.dto';
import {
  ProductsRepository,
  type ProductRecord,
  type UpdateProductRecord,
} from './products.repository';

/**
 * Reglas de negocio del catalogo.
 *
 * No sabe nada de HTTP ni de Drizzle: recibe DTO ya validados y delega la
 * persistencia en el repositorio. Es el patron que replican el resto de los
 * modulos.
 */
@Injectable()
export class ProductsService {
  constructor(private readonly repository: ProductsRepository) {}

  list(query: QueryProductsDto): Promise<PaginatedResponse<ProductListItem>> {
    return this.repository.findMany(query);
  }

  async findOne(id: string): Promise<ProductDetail> {
    const product = await this.repository.findById(id);

    if (!product) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `No existe un producto con id ${id}`,
      });
    }

    return product;
  }

  async create(dto: CreateProductDto): Promise<ProductDetail> {
    const sku = this.normalizeSku(dto.sku);
    await this.assertSkuIsFree(sku);

    const id = await this.repository.create({
      product: {
        sku,
        description: dto.description,
        normalizedDescription: normalizeSearchText(dto.description),
        partBrandId: dto.partBrandId,
        categoryId: dto.categoryId,
        listPrice: dto.listPrice,
        minStock: dto.minStock,
        warehouseLocation: dto.warehouseLocation,
      },
      codes: dto.codes.map((code) => ({ type: code.type, code: code.code.toUpperCase() })),
      applications: dto.applications,
    });

    return this.findOne(id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDetail> {
    const product: Partial<ProductRecord> = {};

    if (dto.sku !== undefined) {
      const sku = this.normalizeSku(dto.sku);
      await this.assertSkuIsFree(sku, id);
      product.sku = sku;
    }

    if (dto.description !== undefined) {
      product.description = dto.description;
      // La descripcion normalizada es derivada: se recalcula siempre junto con
      // la original, nunca se acepta desde afuera.
      product.normalizedDescription = normalizeSearchText(dto.description);
    }

    if (dto.partBrandId !== undefined) product.partBrandId = dto.partBrandId;
    if (dto.categoryId !== undefined) product.categoryId = dto.categoryId;
    if (dto.listPrice !== undefined) product.listPrice = dto.listPrice;
    if (dto.minStock !== undefined) product.minStock = dto.minStock;
    if (dto.warehouseLocation !== undefined) product.warehouseLocation = dto.warehouseLocation;
    if (dto.isActive !== undefined) product.isActive = dto.isActive;

    const record: UpdateProductRecord = { product };

    if (dto.codes) {
      record.codes = dto.codes.map((code) => ({ type: code.type, code: code.code.toUpperCase() }));
    }

    if (dto.applications) {
      record.applications = dto.applications;
    }

    const updated = await this.repository.update(id, record);

    if (!updated) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `No existe un producto con id ${id}`,
      });
    }

    return this.findOne(id);
  }

  /**
   * Baja logica.
   *
   * Un producto puede estar referenciado por pedidos historicos y por asientos
   * de stock; borrarlo de verdad rompe la trazabilidad. Se marca inactivo y
   * deja de aparecer en el catalogo.
   */
  async deactivate(id: string): Promise<void> {
    const deactivated = await this.repository.deactivate(id);

    if (!deactivated) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `No existe un producto con id ${id}`,
      });
    }
  }

  /** El SKU es la clave con la que trabaja el deposito: siempre en mayusculas. */
  private normalizeSku(sku: string): string {
    return sku.trim().toUpperCase();
  }

  private async assertSkuIsFree(sku: string, allowedId?: string): Promise<void> {
    const existingId = await this.repository.findIdBySku(sku);

    if (existingId && existingId !== allowedId) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: `Ya existe un producto con el SKU ${sku}`,
      });
    }
  }
}
