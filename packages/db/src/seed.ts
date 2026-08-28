import * as argon2 from 'argon2';
import { createDatabaseConnection, type Database } from './client.js';
import { readCliEnv } from './env.js';
import { normalizeSearchText } from './normalize.js';
import {
  CATEGORY_TREE,
  CUSTOMERS,
  PART_BRANDS,
  PRODUCTS,
  USERS,
  VEHICLE_TREE,
} from './seed-data.js';
import {
  categories,
  customers,
  orderItems,
  orders,
  partBrands,
  productApplications,
  productCodes,
  productEquivalences,
  products,
  stockMovements,
  users,
  vehicleBrands,
  vehicleModels,
  vehicleVersions,
} from './schema/index.js';

/**
 * Carga de datos de desarrollo.
 *
 * El seed es destructivo: vacia las tablas antes de escribir para que correrlo
 * dos veces deje siempre el mismo estado. No debe ejecutarse contra produccion.
 */

function requireId(map: Map<string, string>, key: string, kind: string): string {
  const id = map.get(key);
  if (!id) {
    throw new Error(`El seed referencia ${kind} inexistente: "${key}"`);
  }
  return id;
}

async function wipe(db: Database): Promise<void> {
  // Orden inverso a las dependencias de clave foranea.
  await db.delete(stockMovements);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(productEquivalences);
  await db.delete(productApplications);
  await db.delete(productCodes);
  await db.delete(products);
  await db.delete(vehicleVersions);
  await db.delete(vehicleModels);
  await db.delete(vehicleBrands);
  await db.delete(categories);
  await db.delete(partBrands);
  await db.delete(customers);
  await db.delete(users);
}

async function seedUsers(db: Database): Promise<string[]> {
  const rows = await Promise.all(
    USERS.map(async (user) => ({
      email: user.email,
      name: user.name,
      role: user.role,
      passwordHash: await argon2.hash(user.password, { type: argon2.argon2id }),
    })),
  );

  const inserted = await db.insert(users).values(rows).returning({ id: users.id });
  return inserted.map((row) => row.id);
}

async function seedPartBrands(db: Database): Promise<Map<string, string>> {
  const inserted = await db
    .insert(partBrands)
    .values(PART_BRANDS.map((name) => ({ name })))
    .returning({ id: partBrands.id, name: partBrands.name });

  return new Map(inserted.map((row) => [row.name, row.id]));
}

async function seedCategories(db: Database): Promise<Map<string, string>> {
  const parents = await db
    .insert(categories)
    .values(CATEGORY_TREE.map((category) => ({ name: category.name, parentId: null })))
    .returning({ id: categories.id, name: categories.name });

  const byName = new Map(parents.map((row) => [row.name, row.id]));

  const childRows = CATEGORY_TREE.flatMap((category) =>
    category.children.map((child) => ({
      name: child,
      parentId: requireId(byName, category.name, 'categoria padre'),
    })),
  );

  const children = await db
    .insert(categories)
    .values(childRows)
    .returning({ id: categories.id, name: categories.name });

  for (const row of children) {
    byName.set(row.name, row.id);
  }

  return byName;
}

/** Devuelve las versiones indexadas por la clave `Marca|Modelo|Version`. */
async function seedVehicles(db: Database): Promise<Map<string, string>> {
  const brands = await db
    .insert(vehicleBrands)
    .values(VEHICLE_TREE.map((brand) => ({ name: brand.name })))
    .returning({ id: vehicleBrands.id, name: vehicleBrands.name });

  const brandIds = new Map(brands.map((row) => [row.name, row.id]));

  const modelRows = VEHICLE_TREE.flatMap((brand) =>
    brand.models.map((model) => ({
      name: model.name,
      vehicleBrandId: requireId(brandIds, brand.name, 'marca de vehiculo'),
      lookupKey: `${brand.name}|${model.name}`,
    })),
  );

  const insertedModels = await db
    .insert(vehicleModels)
    .values(modelRows.map(({ lookupKey: _lookupKey, ...row }) => row))
    .returning({ id: vehicleModels.id, name: vehicleModels.name });

  const modelIds = new Map<string, string>();
  modelRows.forEach((row, position) => {
    const inserted = insertedModels[position];
    if (!inserted) {
      throw new Error('El motor devolvio menos modelos de los insertados');
    }
    modelIds.set(row.lookupKey, inserted.id);
  });

  const versionRows = VEHICLE_TREE.flatMap((brand) =>
    brand.models.flatMap((model) =>
      model.versions.map((version) => ({
        name: version.name,
        engine: version.engine,
        vehicleModelId: requireId(modelIds, `${brand.name}|${model.name}`, 'modelo de vehiculo'),
        lookupKey: `${brand.name}|${model.name}|${version.name}`,
      })),
    ),
  );

  const insertedVersions = await db
    .insert(vehicleVersions)
    .values(versionRows.map(({ lookupKey: _lookupKey, ...row }) => row))
    .returning({ id: vehicleVersions.id });

  const versionIds = new Map<string, string>();
  versionRows.forEach((row, position) => {
    const inserted = insertedVersions[position];
    if (!inserted) {
      throw new Error('El motor devolvio menos versiones de las insertadas');
    }
    versionIds.set(row.lookupKey, inserted.id);
  });

  return versionIds;
}

interface ProductSeedContext {
  categoryIds: Map<string, string>;
  partBrandIds: Map<string, string>;
  versionIds: Map<string, string>;
  warehouseUserId: string;
}

async function seedProducts(db: Database, context: ProductSeedContext): Promise<void> {
  for (const product of PRODUCTS) {
    const [inserted] = await db
      .insert(products)
      .values({
        sku: product.sku,
        description: product.description,
        normalizedDescription: normalizeSearchText(product.description),
        partBrandId: requireId(context.partBrandIds, product.partBrand, 'marca de repuesto'),
        categoryId: requireId(context.categoryIds, product.category, 'categoria'),
        listPrice: product.listPrice,
        minStock: product.minStock,
        warehouseLocation: product.warehouseLocation,
      })
      .returning({ id: products.id });

    if (!inserted) {
      throw new Error(`No se pudo insertar el producto ${product.sku}`);
    }

    await db.insert(productCodes).values(
      product.codes.map((code) => ({
        productId: inserted.id,
        type: code.type,
        code: code.code,
      })),
    );

    await db.insert(productApplications).values(
      product.applications.map((application) => ({
        productId: inserted.id,
        vehicleVersionId: requireId(context.versionIds, application.version, 'version de vehiculo'),
        yearFrom: application.yearFrom,
        yearTo: application.yearTo,
      })),
    );

    // La existencia inicial entra como un asiento del libro de stock, igual que
    // cualquier ingreso posterior: no hay forma de "setear" stock por afuera.
    if (product.initialStock > 0) {
      await db.insert(stockMovements).values({
        productId: inserted.id,
        type: 'INBOUND',
        quantity: product.initialStock,
        resultingStock: product.initialStock,
        userId: context.warehouseUserId,
        reason: 'Carga inicial de inventario',
      });
    }
  }
}

async function seedCustomers(db: Database): Promise<void> {
  await db.insert(customers).values(
    CUSTOMERS.map((customer) => ({
      businessName: customer.businessName,
      taxId: customer.taxId,
      taxCondition: customer.taxCondition,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    })),
  );
}

async function main(): Promise<void> {
  const env = readCliEnv();
  const connection = createDatabaseConnection({
    connectionString: env.databaseUrl,
    wsProxy: env.wsProxy,
  });

  try {
    await connection.db.transaction(async (tx) => {
      console.warn('Vaciando tablas...');
      await wipe(tx);

      console.warn('Cargando usuarios...');
      const userIds = await seedUsers(tx);
      const warehouseUserId = userIds.at(-1);
      if (!warehouseUserId) {
        throw new Error('El seed no pudo crear usuarios');
      }

      console.warn('Cargando marcas de repuesto y categorias...');
      const partBrandIds = await seedPartBrands(tx);
      const categoryIds = await seedCategories(tx);

      console.warn('Cargando arbol de vehiculos...');
      const versionIds = await seedVehicles(tx);

      console.warn(`Cargando ${PRODUCTS.length} productos con sus aplicaciones...`);
      await seedProducts(tx, { categoryIds, partBrandIds, versionIds, warehouseUserId });

      console.warn('Cargando clientes...');
      await seedCustomers(tx);
    });

    console.warn('Seed completo.');
    for (const user of USERS) {
      console.warn(`  ${user.role.padEnd(9)} ${user.email}  /  ${user.password}`);
    }
  } finally {
    await connection.close();
  }
}

main().catch((error: unknown) => {
  console.error('El seed fallo:', error);
  process.exitCode = 1;
});
