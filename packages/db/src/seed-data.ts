import type { ProductCodeType, TaxCondition, UserRole } from '@calce/types';

/**
 * Dataset de desarrollo.
 *
 * Los datos son verosimiles del rubro autopartes argentino: modelos que
 * circulan aca, marcas de repuesto que se consiguen en el mercado de reposicion
 * y codigos con la forma que tienen en los catalogos reales.
 */

export interface SeedVehicleVersion {
  name: string;
  engine: string;
}

export interface SeedVehicleModel {
  name: string;
  versions: SeedVehicleVersion[];
}

export interface SeedVehicleBrand {
  name: string;
  models: SeedVehicleModel[];
}

export const VEHICLE_TREE: SeedVehicleBrand[] = [
  {
    name: 'Volkswagen',
    models: [
      { name: 'Gol Trend', versions: [{ name: '1.6 MSI', engine: '1.6 8v nafta' }] },
      { name: 'Suran', versions: [{ name: '1.6 Highline', engine: '1.6 8v nafta' }] },
      { name: 'Amarok', versions: [{ name: '2.0 TDI 4x4', engine: '2.0 TDI diesel' }] },
    ],
  },
  {
    name: 'Ford',
    models: [
      { name: 'Ka', versions: [{ name: '1.5 Ti-VCT SE', engine: '1.5 16v nafta' }] },
      { name: 'Focus', versions: [{ name: '2.0 SE Plus', engine: '2.0 16v nafta' }] },
      { name: 'Ranger', versions: [{ name: '3.2 TDCi Limited', engine: '3.2 TDCi diesel' }] },
    ],
  },
  {
    name: 'Renault',
    models: [
      { name: 'Kangoo', versions: [{ name: '1.6 Confort', engine: '1.6 16v nafta' }] },
      { name: 'Sandero', versions: [{ name: '1.6 Privilege', engine: '1.6 8v nafta' }] },
      { name: 'Duster', versions: [{ name: '1.6 Dynamique', engine: '1.6 16v nafta' }] },
    ],
  },
  {
    name: 'Chevrolet',
    models: [
      { name: 'Corsa Classic', versions: [{ name: '1.4 LS', engine: '1.4 8v nafta' }] },
      { name: 'Onix', versions: [{ name: '1.4 LTZ', engine: '1.4 8v nafta' }] },
      { name: 'S10', versions: [{ name: '2.8 CTDi LTZ', engine: '2.8 CTDi diesel' }] },
    ],
  },
  {
    name: 'Peugeot',
    models: [
      { name: '208', versions: [{ name: '1.6 Feline', engine: '1.6 16v nafta' }] },
      { name: 'Partner', versions: [{ name: '1.6 HDi Furgon', engine: '1.6 HDi diesel' }] },
    ],
  },
  {
    name: 'Fiat',
    models: [
      { name: 'Cronos', versions: [{ name: '1.3 Firefly Drive', engine: '1.3 Firefly nafta' }] },
      { name: 'Toro', versions: [{ name: '2.0 Multijet Volcano', engine: '2.0 Multijet diesel' }] },
    ],
  },
  {
    name: 'Toyota',
    models: [
      { name: 'Hilux', versions: [{ name: '2.8 TDi SRX', engine: '2.8 GD-6 diesel' }] },
      { name: 'Etios', versions: [{ name: '1.5 XLS', engine: '1.5 16v nafta' }] },
    ],
  },
];

export interface SeedCategory {
  name: string;
  children: string[];
}

export const CATEGORY_TREE: SeedCategory[] = [
  {
    name: 'Filtros',
    children: [
      'Filtro de aceite',
      'Filtro de aire',
      'Filtro de combustible',
      'Filtro de habitáculo',
    ],
  },
  { name: 'Frenos', children: ['Pastillas de freno', 'Discos de freno'] },
  { name: 'Suspensión', children: ['Amortiguadores', 'Espirales'] },
  { name: 'Distribución', children: ['Correas', 'Kits de distribución'] },
  { name: 'Encendido', children: ['Bujías', 'Cables de bujía'] },
];

export const PART_BRANDS: string[] = [
  'Bosch',
  'Corven',
  'Dayco',
  'Ferodo',
  'Fram',
  'Fremax',
  'Gates',
  'Mahle',
  'Mann Filter',
  'Monroe',
  'NGK',
  'Wega',
];

export interface SeedProductCode {
  type: ProductCodeType;
  code: string;
}

/** Clave de version: `Marca|Modelo|Version`. */
export interface SeedApplication {
  version: string;
  yearFrom: number;
  yearTo: number | null;
}

export interface SeedProduct {
  sku: string;
  description: string;
  category: string;
  partBrand: string;
  listPrice: number;
  minStock: number;
  warehouseLocation: string;
  initialStock: number;
  codes: SeedProductCode[];
  applications: SeedApplication[];
}

export const PRODUCTS: SeedProduct[] = [
  {
    sku: 'FIL-AC-0001',
    description: 'Filtro de aceite Volkswagen Gol Trend 1.6',
    category: 'Filtro de aceite',
    partBrand: 'Fram',
    listPrice: 8450,
    minStock: 12,
    warehouseLocation: 'A-01-03',
    initialStock: 48,
    codes: [
      { type: 'OEM', code: '030115561AN' },
      { type: 'MANUFACTURER', code: 'PH5796' },
      { type: 'INTERNAL', code: 'FA-GOL16' },
    ],
    applications: [
      { version: 'Volkswagen|Gol Trend|1.6 MSI', yearFrom: 2013, yearTo: null },
      { version: 'Volkswagen|Suran|1.6 Highline', yearFrom: 2010, yearTo: 2019 },
    ],
  },
  {
    sku: 'FIL-AC-0002',
    description: 'Filtro de aceite Ford Ka 1.5 Ti-VCT',
    category: 'Filtro de aceite',
    partBrand: 'Mann Filter',
    listPrice: 9900,
    minStock: 10,
    warehouseLocation: 'A-01-04',
    initialStock: 26,
    codes: [
      { type: 'OEM', code: 'CN1G6714AA' },
      { type: 'MANUFACTURER', code: 'W71225' },
    ],
    applications: [{ version: 'Ford|Ka|1.5 Ti-VCT SE', yearFrom: 2018, yearTo: null }],
  },
  {
    sku: 'FIL-AC-0003',
    description: 'Filtro de aceite Toyota Hilux 2.8 GD-6',
    category: 'Filtro de aceite',
    partBrand: 'Wega',
    listPrice: 14300,
    minStock: 8,
    warehouseLocation: 'A-01-07',
    initialStock: 19,
    codes: [
      { type: 'OEM', code: '0415231090' },
      { type: 'MANUFACTURER', code: 'WOE1102' },
    ],
    applications: [{ version: 'Toyota|Hilux|2.8 TDi SRX', yearFrom: 2016, yearTo: null }],
  },
  {
    sku: 'FIL-AI-0011',
    description: 'Filtro de aire Renault Kangoo 1.6 16v',
    category: 'Filtro de aire',
    partBrand: 'Mahle',
    listPrice: 15600,
    minStock: 6,
    warehouseLocation: 'A-02-01',
    initialStock: 14,
    codes: [
      { type: 'OEM', code: '165467674R' },
      { type: 'MANUFACTURER', code: 'LX1780' },
    ],
    applications: [
      { version: 'Renault|Kangoo|1.6 Confort', yearFrom: 2008, yearTo: null },
      { version: 'Renault|Sandero|1.6 Privilege', yearFrom: 2008, yearTo: 2020 },
    ],
  },
  {
    sku: 'FIL-AI-0012',
    description: 'Filtro de aire Chevrolet Onix 1.4',
    category: 'Filtro de aire',
    partBrand: 'Fram',
    listPrice: 12750,
    minStock: 8,
    warehouseLocation: 'A-02-02',
    initialStock: 31,
    codes: [
      { type: 'OEM', code: '52034061' },
      { type: 'MANUFACTURER', code: 'CA12154' },
    ],
    applications: [{ version: 'Chevrolet|Onix|1.4 LTZ', yearFrom: 2016, yearTo: null }],
  },
  {
    sku: 'FIL-AI-0013',
    description: 'Filtro de aire Ford Ranger 3.2 TDCi',
    category: 'Filtro de aire',
    partBrand: 'Mann Filter',
    listPrice: 28900,
    minStock: 4,
    warehouseLocation: 'A-02-06',
    initialStock: 9,
    codes: [
      { type: 'OEM', code: 'AB3912B579AA' },
      { type: 'MANUFACTURER', code: 'C25008' },
    ],
    applications: [{ version: 'Ford|Ranger|3.2 TDCi Limited', yearFrom: 2012, yearTo: null }],
  },
  {
    sku: 'FIL-CO-0021',
    description: 'Filtro de combustible Peugeot Partner 1.6 HDi',
    category: 'Filtro de combustible',
    partBrand: 'Bosch',
    listPrice: 32400,
    minStock: 5,
    warehouseLocation: 'A-03-02',
    initialStock: 11,
    codes: [
      { type: 'OEM', code: '190190' },
      { type: 'MANUFACTURER', code: 'F026402085' },
    ],
    applications: [{ version: 'Peugeot|Partner|1.6 HDi Furgon', yearFrom: 2011, yearTo: null }],
  },
  {
    sku: 'FIL-CO-0022',
    description: 'Filtro de combustible Volkswagen Amarok 2.0 TDI',
    category: 'Filtro de combustible',
    partBrand: 'Mahle',
    listPrice: 41200,
    minStock: 4,
    warehouseLocation: 'A-03-05',
    initialStock: 7,
    codes: [
      { type: 'OEM', code: '2H0127401' },
      { type: 'MANUFACTURER', code: 'KL764' },
    ],
    applications: [{ version: 'Volkswagen|Amarok|2.0 TDI 4x4', yearFrom: 2010, yearTo: null }],
  },
  {
    sku: 'FIL-HA-0031',
    description: 'Filtro de habitáculo Fiat Cronos 1.3 Firefly',
    category: 'Filtro de habitáculo',
    partBrand: 'Wega',
    listPrice: 11800,
    minStock: 6,
    warehouseLocation: 'A-04-01',
    initialStock: 22,
    codes: [
      { type: 'OEM', code: '52102923' },
      { type: 'MANUFACTURER', code: 'AKX3521' },
    ],
    applications: [{ version: 'Fiat|Cronos|1.3 Firefly Drive', yearFrom: 2018, yearTo: null }],
  },
  {
    sku: 'FIL-HA-0032',
    description: 'Filtro de habitáculo Peugeot 208 1.6',
    category: 'Filtro de habitáculo',
    partBrand: 'Corven',
    listPrice: 10450,
    minStock: 6,
    warehouseLocation: 'A-04-02',
    initialStock: 0,
    codes: [
      { type: 'OEM', code: '6447XE' },
      { type: 'INTERNAL', code: 'FH-208' },
    ],
    applications: [{ version: 'Peugeot|208|1.6 Feline', yearFrom: 2013, yearTo: null }],
  },
  {
    sku: 'FRE-PA-0101',
    description: 'Pastillas de freno delanteras Volkswagen Gol Trend',
    category: 'Pastillas de freno',
    partBrand: 'Ferodo',
    listPrice: 48900,
    minStock: 6,
    warehouseLocation: 'B-01-01',
    initialStock: 18,
    codes: [
      { type: 'OEM', code: '5U0698151' },
      { type: 'MANUFACTURER', code: 'FDB1717' },
      { type: 'INTERNAL', code: 'PF-GOL-D' },
    ],
    applications: [
      { version: 'Volkswagen|Gol Trend|1.6 MSI', yearFrom: 2008, yearTo: null },
      { version: 'Volkswagen|Suran|1.6 Highline', yearFrom: 2010, yearTo: 2019 },
    ],
  },
  {
    sku: 'FRE-PA-0102',
    description: 'Pastillas de freno delanteras Chevrolet Corsa Classic',
    category: 'Pastillas de freno',
    partBrand: 'Corven',
    listPrice: 39500,
    minStock: 6,
    warehouseLocation: 'B-01-02',
    initialStock: 12,
    codes: [
      { type: 'OEM', code: '93331565' },
      { type: 'MANUFACTURER', code: 'CV0142' },
    ],
    applications: [{ version: 'Chevrolet|Corsa Classic|1.4 LS', yearFrom: 2004, yearTo: 2016 }],
  },
  {
    sku: 'FRE-PA-0103',
    description: 'Pastillas de freno delanteras Toyota Hilux 2.8',
    category: 'Pastillas de freno',
    partBrand: 'Ferodo',
    listPrice: 92300,
    minStock: 4,
    warehouseLocation: 'B-01-06',
    initialStock: 8,
    codes: [
      { type: 'OEM', code: '0446571080' },
      { type: 'MANUFACTURER', code: 'FDB5045' },
    ],
    applications: [{ version: 'Toyota|Hilux|2.8 TDi SRX', yearFrom: 2016, yearTo: null }],
  },
  {
    sku: 'FRE-PA-0104',
    description: 'Pastillas de freno traseras Ford Focus 2.0',
    category: 'Pastillas de freno',
    partBrand: 'Bosch',
    listPrice: 54600,
    minStock: 4,
    warehouseLocation: 'B-01-08',
    initialStock: 0,
    codes: [
      { type: 'OEM', code: 'BV6J2M008AA' },
      { type: 'MANUFACTURER', code: '0986494601' },
    ],
    applications: [{ version: 'Ford|Focus|2.0 SE Plus', yearFrom: 2013, yearTo: 2019 }],
  },
  {
    sku: 'FRE-DI-0121',
    description: 'Disco de freno delantero ventilado Renault Duster',
    category: 'Discos de freno',
    partBrand: 'Fremax',
    listPrice: 67800,
    minStock: 4,
    warehouseLocation: 'B-02-03',
    initialStock: 10,
    codes: [
      { type: 'OEM', code: '402060010R' },
      { type: 'MANUFACTURER', code: 'BD5410' },
    ],
    applications: [{ version: 'Renault|Duster|1.6 Dynamique', yearFrom: 2011, yearTo: null }],
  },
  {
    sku: 'FRE-DI-0122',
    description: 'Disco de freno delantero ventilado Chevrolet S10 2.8',
    category: 'Discos de freno',
    partBrand: 'Fremax',
    listPrice: 118500,
    minStock: 2,
    warehouseLocation: 'B-02-05',
    initialStock: 5,
    codes: [
      { type: 'OEM', code: '94737632' },
      { type: 'MANUFACTURER', code: 'BD5806' },
    ],
    applications: [{ version: 'Chevrolet|S10|2.8 CTDi LTZ', yearFrom: 2012, yearTo: null }],
  },
  {
    sku: 'SUS-AM-0201',
    description: 'Amortiguador delantero Volkswagen Gol Trend',
    category: 'Amortiguadores',
    partBrand: 'Monroe',
    listPrice: 96400,
    minStock: 4,
    warehouseLocation: 'C-01-01',
    initialStock: 14,
    codes: [
      { type: 'OEM', code: '5U0413031H' },
      { type: 'MANUFACTURER', code: 'G16571' },
    ],
    applications: [{ version: 'Volkswagen|Gol Trend|1.6 MSI', yearFrom: 2008, yearTo: null }],
  },
  {
    sku: 'SUS-AM-0202',
    description: 'Amortiguador trasero Renault Sandero 1.6',
    category: 'Amortiguadores',
    partBrand: 'Corven',
    listPrice: 71200,
    minStock: 4,
    warehouseLocation: 'C-01-04',
    initialStock: 9,
    codes: [
      { type: 'OEM', code: '562100011R' },
      { type: 'INTERNAL', code: 'AM-SAND-T' },
    ],
    applications: [{ version: 'Renault|Sandero|1.6 Privilege', yearFrom: 2008, yearTo: 2020 }],
  },
  {
    sku: 'SUS-AM-0203',
    description: 'Amortiguador delantero Fiat Toro 2.0 Multijet',
    category: 'Amortiguadores',
    partBrand: 'Monroe',
    listPrice: 154700,
    minStock: 2,
    warehouseLocation: 'C-01-07',
    initialStock: 4,
    codes: [
      { type: 'OEM', code: '52069123' },
      { type: 'MANUFACTURER', code: 'G8168' },
    ],
    applications: [{ version: 'Fiat|Toro|2.0 Multijet Volcano', yearFrom: 2016, yearTo: null }],
  },
  {
    sku: 'SUS-ES-0221',
    description: 'Espiral delantero Chevrolet Onix 1.4',
    category: 'Espirales',
    partBrand: 'Corven',
    listPrice: 43800,
    minStock: 4,
    warehouseLocation: 'C-02-02',
    initialStock: 6,
    codes: [
      { type: 'OEM', code: '52089291' },
      { type: 'INTERNAL', code: 'ES-ONIX-D' },
    ],
    applications: [{ version: 'Chevrolet|Onix|1.4 LTZ', yearFrom: 2016, yearTo: null }],
  },
  {
    sku: 'DIS-CO-0301',
    description: 'Correa de distribución Peugeot 208 1.6 16v',
    category: 'Correas',
    partBrand: 'Gates',
    listPrice: 37600,
    minStock: 5,
    warehouseLocation: 'D-01-01',
    initialStock: 16,
    codes: [
      { type: 'OEM', code: '0816L4' },
      { type: 'MANUFACTURER', code: '5670XS' },
    ],
    applications: [
      { version: 'Peugeot|208|1.6 Feline', yearFrom: 2013, yearTo: null },
      { version: 'Peugeot|Partner|1.6 HDi Furgon', yearFrom: 2011, yearTo: null },
    ],
  },
  {
    sku: 'DIS-CO-0302',
    description: 'Correa poly V alternador Volkswagen Gol Trend',
    category: 'Correas',
    partBrand: 'Dayco',
    listPrice: 21900,
    minStock: 6,
    warehouseLocation: 'D-01-03',
    initialStock: 23,
    codes: [
      { type: 'OEM', code: '030903137T' },
      { type: 'MANUFACTURER', code: '6PK1030' },
    ],
    applications: [{ version: 'Volkswagen|Gol Trend|1.6 MSI', yearFrom: 2008, yearTo: null }],
  },
  {
    sku: 'DIS-KT-0321',
    description: 'Kit de distribución Renault Kangoo 1.6 16v',
    category: 'Kits de distribución',
    partBrand: 'Gates',
    listPrice: 184300,
    minStock: 2,
    warehouseLocation: 'D-02-01',
    initialStock: 5,
    codes: [
      { type: 'OEM', code: '7701477028' },
      { type: 'MANUFACTURER', code: 'K015578XS' },
    ],
    applications: [{ version: 'Renault|Kangoo|1.6 Confort', yearFrom: 2008, yearTo: null }],
  },
  {
    sku: 'DIS-KT-0322',
    description: 'Kit de distribución Ford Focus 2.0 16v',
    category: 'Kits de distribución',
    partBrand: 'Dayco',
    listPrice: 213500,
    minStock: 2,
    warehouseLocation: 'D-02-03',
    initialStock: 3,
    codes: [
      { type: 'OEM', code: 'BM5G6K288AA' },
      { type: 'MANUFACTURER', code: 'KTB962' },
    ],
    applications: [{ version: 'Ford|Focus|2.0 SE Plus', yearFrom: 2013, yearTo: 2019 }],
  },
  {
    sku: 'ENC-BU-0401',
    description: 'Bujía de encendido Chevrolet Corsa Classic 1.4',
    category: 'Bujías',
    partBrand: 'NGK',
    listPrice: 7300,
    minStock: 16,
    warehouseLocation: 'E-01-01',
    initialStock: 64,
    codes: [
      { type: 'OEM', code: '93248861' },
      { type: 'MANUFACTURER', code: 'BKR6E11' },
      { type: 'INTERNAL', code: 'BU-CORSA' },
    ],
    applications: [{ version: 'Chevrolet|Corsa Classic|1.4 LS', yearFrom: 2004, yearTo: 2016 }],
  },
  {
    sku: 'ENC-BU-0402',
    description: 'Bujía de encendido iridio Toyota Etios 1.5',
    category: 'Bujías',
    partBrand: 'NGK',
    listPrice: 18700,
    minStock: 12,
    warehouseLocation: 'E-01-04',
    initialStock: 40,
    codes: [
      { type: 'OEM', code: '9091901253' },
      { type: 'MANUFACTURER', code: 'ILKAR7B11' },
    ],
    applications: [{ version: 'Toyota|Etios|1.5 XLS', yearFrom: 2013, yearTo: null }],
  },
  {
    sku: 'ENC-CA-0421',
    description: 'Juego de cables de bujía Volkswagen Suran 1.6',
    category: 'Cables de bujía',
    partBrand: 'Bosch',
    listPrice: 46200,
    minStock: 4,
    warehouseLocation: 'E-02-02',
    initialStock: 7,
    codes: [
      { type: 'OEM', code: '032905409AK' },
      { type: 'MANUFACTURER', code: '0986357277' },
    ],
    applications: [
      { version: 'Volkswagen|Suran|1.6 Highline', yearFrom: 2010, yearTo: 2019 },
      { version: 'Volkswagen|Gol Trend|1.6 MSI', yearFrom: 2008, yearTo: 2016 },
    ],
  },
];

export interface SeedUser {
  email: string;
  name: string;
  role: UserRole;
  password: string;
}

/** Contrasenas de desarrollo. Nunca deben existir fuera de un entorno local. */
export const USERS: SeedUser[] = [
  { email: 'admin@calce.test', name: 'Laura Benitez', role: 'ADMIN', password: 'calce-admin-2026' },
  {
    email: 'vendedor@calce.test',
    name: 'Marcos Sosa',
    role: 'SELLER',
    password: 'calce-seller-2026',
  },
  {
    email: 'deposito@calce.test',
    name: 'Nadia Ferreyra',
    role: 'WAREHOUSE',
    password: 'calce-warehouse-2026',
  },
];

export interface SeedCustomer {
  businessName: string;
  taxId: string;
  taxCondition: TaxCondition;
  email: string;
  phone: string;
  address: string;
}

export const CUSTOMERS: SeedCustomer[] = [
  {
    businessName: 'Taller Mecánico El Torno SRL',
    taxId: '30712345678',
    taxCondition: 'RESPONSABLE_INSCRIPTO',
    email: 'compras@eltorno.test',
    phone: '+54 351 555-0114',
    address: 'Av. Colón 1840, Córdoba',
  },
  {
    businessName: 'Repuestos del Sur',
    taxId: '30698765432',
    taxCondition: 'RESPONSABLE_INSCRIPTO',
    email: 'ventas@repuestosdelsur.test',
    phone: '+54 291 555-0187',
    address: 'Zelarrayán 2210, Bahía Blanca',
  },
  {
    businessName: 'Gomería y Servicios Rivadavia',
    taxId: '27354879015',
    taxCondition: 'MONOTRIBUTO',
    email: 'rivadavia.servicios@test.com',
    phone: '+54 11 5555-0163',
    address: 'Rivadavia 7420, CABA',
  },
  {
    businessName: 'Transporte Los Álamos SA',
    taxId: '30601122334',
    taxCondition: 'RESPONSABLE_INSCRIPTO',
    email: 'mantenimiento@losalamos.test',
    phone: '+54 341 555-0132',
    address: 'Ruta 9 Km 285, Rosario',
  },
];
