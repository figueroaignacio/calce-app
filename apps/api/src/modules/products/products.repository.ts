import {
  categories,
  normalizeSearchText,
  partBrands,
  productApplications,
  productCodes,
  products,
  stockMovements,
  vehicleBrands,
  vehicleModels,
  vehicleVersions,
  type Database,
} from '@calce/db';
import {
  type PaginatedResponse,
  type ProductApplication,
  type ProductCode,
  type ProductDetail,
  type ProductListItem,
  type ProductSortField,
  buildPaginationMeta,
} from '@calce/types';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, exists, ilike, or, sql, type SQL, type SQLWrapper } from 'drizzle-orm';
import { DATABASE } from '@/database/database.provider';
import { type QueryProductsDto } from './dto/query-products.dto';

export interface ProductRecord {
  sku: string;
  description: string;
  normalizedDescription: string;
  partBrandId: string | null;
  categoryId: string | null;
  listPrice: number;
  minStock: number;
  warehouseLocation: string | null;
  isActive?: boolean;
}

export interface ProductCodeRecord {
  type: ProductCode['type'];
  code: string;
}

export interface ProductApplicationRecord {
  vehicleVersionId: string;
  yearFrom: number;
  yearTo: number | null;
}

export interface WriteProductRecord {
  product: ProductRecord;
  codes: ProductCodeRecord[];
  applications: ProductApplicationRecord[];
}

export interface UpdateProductRecord {
  product: Partial<ProductRecord>;
  codes?: ProductCodeRecord[];
  applications?: ProductApplicationRecord[];
}

const SORT_COLUMNS = {
  sku: products.sku,
  description: products.description,
  listPrice: products.listPrice,
  minStock: products.minStock,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
} as const satisfies Record<ProductSortField, SQLWrapper>;

/**
 * Existencia actual del producto.
 *
 * Se lee del ultimo asiento del libro de stock en lugar de sumar la serie
 * completa: `resulting_stock` es justamente la cache que evita ese recorrido.
 * El indice `stock_movements_product_created_idx` cubre el orden.
 */
const stockExpression = sql<number>`coalesce((
  select ${stockMovements.resultingStock}
  from ${stockMovements}
  where ${stockMovements.productId} = ${products.id}
  order by ${stockMovements.createdAt} desc
  limit 1
), 0)`;

interface ProductListRow {
  id: string;
  sku: string;
  description: string;
  normalizedDescription: string | null;
  partBrandId: string | null;
  categoryId: string | null;
  listPrice: number;
  minStock: number;
  warehouseLocation: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  partBrandName: string | null;
  categoryName: string | null;
  stock: number;
}

function toListItem(row: ProductListRow): ProductListItem {
  return {
    id: row.id,
    sku: row.sku,
    description: row.description,
    normalizedDescription: row.normalizedDescription,
    partBrandId: row.partBrandId,
    categoryId: row.categoryId,
    listPrice: row.listPrice,
    minStock: row.minStock,
    warehouseLocation: row.warehouseLocation,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    partBrandName: row.partBrandName,
    categoryName: row.categoryName,
    stock: Number(row.stock),
  };
}

/**
 * Unico lugar del modulo que toca Drizzle.
 *
 * Devuelve entidades del contrato (`ProductListItem`, `ProductDetail`), no filas
 * crudas: el service no tiene por que saber que las fechas vienen como `Date` o
 * que el stock sale de una subconsulta.
 */
@Injectable()
export class ProductsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findMany(query: QueryProductsDto): Promise<PaginatedResponse<ProductListItem>> {
    const conditions = this.buildConditions(query);
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const orderColumn = SORT_COLUMNS[query.sortBy];
    const orderBy = query.sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

    const rows = await this.db
      .select({
        id: products.id,
        sku: products.sku,
        description: products.description,
        normalizedDescription: products.normalizedDescription,
        partBrandId: products.partBrandId,
        categoryId: products.categoryId,
        listPrice: products.listPrice,
        minStock: products.minStock,
        warehouseLocation: products.warehouseLocation,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        partBrandName: partBrands.name,
        categoryName: categories.name,
        stock: stockExpression,
      })
      .from(products)
      .leftJoin(partBrands, eq(products.partBrandId, partBrands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(orderBy, asc(products.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);

    const [totals] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(products)
      .where(where);

    const total = totals?.total ?? 0;

    return {
      items: rows.map(toListItem),
      meta: buildPaginationMeta(query.page, query.pageSize, total),
    };
  }

  async findById(id: string): Promise<ProductDetail | null> {
    const [row] = await this.db
      .select({
        id: products.id,
        sku: products.sku,
        description: products.description,
        normalizedDescription: products.normalizedDescription,
        partBrandId: products.partBrandId,
        categoryId: products.categoryId,
        listPrice: products.listPrice,
        minStock: products.minStock,
        warehouseLocation: products.warehouseLocation,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        partBrandName: partBrands.name,
        categoryName: categories.name,
        stock: stockExpression,
      })
      .from(products)
      .leftJoin(partBrands, eq(products.partBrandId, partBrands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    const [codes, applications] = await Promise.all([
      this.findCodes(id),
      this.findApplications(id),
    ]);

    return { ...toListItem(row), codes, applications };
  }

  async findIdBySku(sku: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1);

    return row?.id ?? null;
  }

  /**
   * Crea el producto con sus codigos y aplicaciones en una sola transaccion: un
   * producto a medio cargar no puede quedar visible en el catalogo.
   */
  async create(record: WriteProductRecord): Promise<string> {
    return this.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(products)
        .values(record.product)
        .returning({ id: products.id });

      if (!inserted) {
        throw new Error('El motor no devolvio el producto recien creado');
      }

      if (record.codes.length > 0) {
        await tx
          .insert(productCodes)
          .values(record.codes.map((code) => ({ ...code, productId: inserted.id })));
      }

      if (record.applications.length > 0) {
        await tx.insert(productApplications).values(
          record.applications.map((application) => ({
            ...application,
            productId: inserted.id,
          })),
        );
      }

      return inserted.id;
    });
  }

  /**
   * Actualiza el producto. Codigos y aplicaciones se reemplazan por completo
   * cuando vienen en el payload: un PATCH parcial sobre colecciones anidadas
   * deja ambiguo si un elemento ausente hay que borrarlo o conservarlo.
   */
  async update(id: string, record: UpdateProductRecord): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(products)
        .set({ ...record.product, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning({ id: products.id });

      if (!updated) {
        return false;
      }

      if (record.codes) {
        await tx.delete(productCodes).where(eq(productCodes.productId, id));
        if (record.codes.length > 0) {
          await tx
            .insert(productCodes)
            .values(record.codes.map((code) => ({ ...code, productId: id })));
        }
      }

      if (record.applications) {
        await tx.delete(productApplications).where(eq(productApplications.productId, id));
        if (record.applications.length > 0) {
          await tx
            .insert(productApplications)
            .values(record.applications.map((application) => ({ ...application, productId: id })));
        }
      }

      return true;
    });
  }

  async deactivate(id: string): Promise<boolean> {
    const [row] = await this.db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning({ id: products.id });

    return row !== undefined;
  }

  private async findCodes(productId: string): Promise<ProductCode[]> {
    return this.db
      .select({
        id: productCodes.id,
        productId: productCodes.productId,
        type: productCodes.type,
        code: productCodes.code,
      })
      .from(productCodes)
      .where(eq(productCodes.productId, productId))
      .orderBy(asc(productCodes.type), asc(productCodes.code));
  }

  private async findApplications(productId: string): Promise<ProductApplication[]> {
    return this.db
      .select({
        id: productApplications.id,
        productId: productApplications.productId,
        vehicleVersionId: productApplications.vehicleVersionId,
        vehicleBrandName: vehicleBrands.name,
        vehicleModelName: vehicleModels.name,
        vehicleVersionName: vehicleVersions.name,
        engine: vehicleVersions.engine,
        yearFrom: productApplications.yearFrom,
        yearTo: productApplications.yearTo,
      })
      .from(productApplications)
      .innerJoin(vehicleVersions, eq(productApplications.vehicleVersionId, vehicleVersions.id))
      .innerJoin(vehicleModels, eq(vehicleVersions.vehicleModelId, vehicleModels.id))
      .innerJoin(vehicleBrands, eq(vehicleModels.vehicleBrandId, vehicleBrands.id))
      .where(eq(productApplications.productId, productId))
      .orderBy(asc(vehicleBrands.name), asc(vehicleModels.name), asc(vehicleVersions.name));
  }

  private buildConditions(query: QueryProductsDto): SQL[] {
    const conditions: SQL[] = [];

    if (query.isActive !== undefined) {
      conditions.push(eq(products.isActive, query.isActive));
    }

    if (query.categoryId) {
      conditions.push(eq(products.categoryId, query.categoryId));
    }

    if (query.partBrandId) {
      conditions.push(eq(products.partBrandId, query.partBrandId));
    }

    if (query.vehicleVersionId) {
      conditions.push(this.appliesToVersion(query.vehicleVersionId));
    }

    const search = this.buildSearchCondition(query.search);
    if (search) {
      conditions.push(search);
    }

    return conditions;
  }

  /** Compatibilidad: el producto tiene una aplicacion para esa version. */
  private appliesToVersion(vehicleVersionId: string): SQL {
    return exists(
      this.db
        .select({ one: sql`1` })
        .from(productApplications)
        .where(
          and(
            eq(productApplications.productId, products.id),
            eq(productApplications.vehicleVersionId, vehicleVersionId),
          ),
        ),
    );
  }

  /**
   * Busqueda por texto libre.
   *
   * El termino se normaliza igual que `normalized_description` y se parte en
   * tokens: cada token tiene que aparecer en el SKU, en la descripcion o en
   * alguno de los codigos. Asi "filtro aceite gol" encuentra "Filtro de aceite
   * Volkswagen Gol Trend 1.6", que es como pregunta el vendedor de mostrador.
   */
  private buildSearchCondition(search: string | undefined): SQL | undefined {
    if (!search) {
      return undefined;
    }

    const tokens = normalizeSearchText(search)
      .split(' ')
      .filter((token) => token.length > 0);

    if (tokens.length === 0) {
      return undefined;
    }

    const perToken = tokens.map((token) => {
      const pattern = `%${token}%`;

      return or(
        ilike(products.sku, pattern),
        ilike(products.normalizedDescription, pattern),
        exists(
          this.db
            .select({ one: sql`1` })
            .from(productCodes)
            .where(and(eq(productCodes.productId, products.id), ilike(productCodes.code, pattern))),
        ),
      );
    });

    return and(...perToken);
  }
}
