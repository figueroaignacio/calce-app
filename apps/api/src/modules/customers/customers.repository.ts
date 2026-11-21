import { customers, type CustomerRow, type Database } from '@calce/db';
import {
  buildPaginationMeta,
  type Customer,
  type CustomerSortField,
  type PaginatedResponse,
} from '@calce/types';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, ilike, or, sql, type SQL, type SQLWrapper } from 'drizzle-orm';
import { DATABASE } from '@/database/database.provider';
import { type QueryCustomersDto } from './dto/query-customers.dto';

export type CustomerWriteRecord = Pick<
  Customer,
  'businessName' | 'taxId' | 'taxCondition' | 'email' | 'phone' | 'address' | 'priceListId'
>;
export type CustomerUpdateRecord = Partial<CustomerWriteRecord> &
  Pick<Partial<Customer>, 'isActive'>;

const SORT_COLUMNS = {
  businessName: customers.businessName,
  taxId: customers.taxId,
  createdAt: customers.createdAt,
  updatedAt: customers.updatedAt,
} as const satisfies Record<CustomerSortField, SQLWrapper>;

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    businessName: row.businessName,
    taxId: row.taxId,
    taxCondition: row.taxCondition,
    email: row.email,
    phone: row.phone,
    address: row.address,
    priceListId: row.priceListId,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Toda consulta SQL del modulo queda aislada en el repositorio. */
@Injectable()
export class CustomersRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findMany(query: QueryCustomersDto): Promise<PaginatedResponse<Customer>> {
    const filters: SQL[] = [];
    if (query.isActive !== undefined) filters.push(eq(customers.isActive, query.isActive));

    if (query.search) {
      // Escapamos comodines SQL para que el buscador coincida con texto literal.
      const safe = query.search.replace(/[\\%_]/g, '\\$&');
      const searchCondition = or(
        ilike(customers.businessName, `%${safe}%`),
        ilike(customers.taxId, `%${safe}%`),
        ilike(customers.email, `%${safe}%`),
      );
      if (searchCondition) filters.push(searchCondition);
    }

    const where = filters.length > 0 ? and(...filters) : undefined;
    const column = SORT_COLUMNS[query.sortBy];
    const order = query.sortOrder === 'asc' ? asc(column) : desc(column);

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select()
        .from(customers)
        .where(where)
        .orderBy(order, asc(customers.id))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db
        .select({ total: sql<number>`count(*)::int` })
        .from(customers)
        .where(where),
    ]);

    const total = countRow?.total ?? 0;
    return {
      items: rows.map(toCustomer),
      meta: buildPaginationMeta(query.page, query.pageSize, total),
    };
  }

  async findById(id: string): Promise<Customer | null> {
    const [row] = await this.db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return row ? toCustomer(row) : null;
  }

  async findIdByTaxId(taxId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.taxId, taxId))
      .limit(1);
    return row?.id ?? null;
  }

  async create(data: CustomerWriteRecord): Promise<string> {
    const [created] = await this.db.insert(customers).values(data).returning({ id: customers.id });
    if (!created) throw new Error('La base no devolvio el cliente creado');
    return created.id;
  }

  async update(id: string, data: CustomerUpdateRecord): Promise<boolean> {
    const [updated] = await this.db
      .update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning({ id: customers.id });
    return updated !== undefined;
  }

  /** Baja logica: conserva pedidos y referencias historicas. */
  async deactivate(id: string): Promise<boolean> {
    const [updated] = await this.db
      .update(customers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning({ id: customers.id });
    return updated !== undefined;
  }
}
