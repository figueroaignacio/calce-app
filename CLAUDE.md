# CLAUDE.md

Convenciones de Calce. Están escritas para que una sesión nueva pueda sumar
código sin que haya que repetir las reglas.

Contexto de negocio y decisiones técnicas: `docs/modelo-de-dominio.md` y
`docs/decisiones.md`.

## Reglas que no se negocian

1. **Todo archivo y toda carpeta en kebab-case.** Sin excepciones:
   `products-table-widget.tsx`, `create-product.dto.ts`, `use-products.ts`.
   Está enforzado por `unicorn/filename-case` en la configuración de ESLint.
2. **Los componentes de React se declaran en PascalCase dentro de archivos
   kebab-case.** `export function ProductsTableWidget()` en
   `products-table-widget.tsx`.
3. **Cada carpeta de componente lleva un `index.ts` que reexporta**, para que
   los imports queden limpios:
   `import { ProductsTableWidget } from '@/features/products/widgets/products-table-widget'`.
4. **TypeScript en modo estricto y prohibido `any`.** Si hace falta un escape,
   usar `unknown` y estrechar el tipo con un type guard.
5. **Imports absolutos con alias `@/`** dentro de cada app. Los hermanos del
   mismo directorio pueden quedar relativos (`./products-table-ui-data`).
6. **`@calce/types` no depende de `@calce/db` ni de nada del backend.** Ver
   abajo.
7. **Nada de código muerto, comentarios de relleno ni archivos placeholder
   vacíos.** Un comentario explica _por qué_, no _qué_: el qué ya está en el
   código.

## Estructura

```
calce/
├── apps/
│   ├── web/      @calce/web  - React + Vite
│   └── api/      @calce/api  - NestJS
├── packages/
│   ├── types/    @calce/types - contratos Zod compartidos
│   └── db/       @calce/db    - esquema Drizzle, cliente y migraciones
└── docs/
```

## La regla de `@calce/types`

Es una regla dura, no una preferencia de estilo. El frontend importa ese
paquete: si arrastrara `@calce/db`, Drizzle y el driver de Neon terminarían en el
bundle del navegador.

- `@calce/types` **no** puede importar `@calce/db`, `@nestjs/*`, `drizzle-orm`
  ni nada de servidor. Su única dependencia es `zod`.
- `@calce/db` **sí** puede importar `@calce/types`, y lo hace: los enums de
  Postgres se generan desde la misma lista de valores que valida el frontend.
- Los contratos se definen de forma independiente del esquema, aunque lo
  reflejen. `products.embedding` existe en el esquema y no en el contrato.

Al agregar un contrato: el esquema Zod y el tipo inferido van juntos, y el
archivo se reexporta desde el `index.ts` de su carpeta.

```ts
export const productSchema = z.object({ ... });
export type Product = z.infer<typeof productSchema>;
```

## Frontend: arquitectura de cuatro capas

Cuatro capas con responsabilidades que no se mezclan. Si una capa hace el trabajo
de otra, la abstracción se rompe y deja de servir.

| Capa          | Hace                                                                       | No hace                                          |
| ------------- | -------------------------------------------------------------------------- | ------------------------------------------------ |
| **View**      | Estado compartido de la página y layout. Puede tener varios containers.    | No fetchea.                                      |
| **Container** | Fetchea y transforma la data para los widgets. Puede tener varios widgets. | No renderiza presentación.                       |
| **Widget**    | Recibe la data ya resuelta y despacha a una de sus **tres** UI.            | No fetchea ni transforma.                        |
| **UI**        | Solo presentación.                                                         | No tiene lógica ni estado más allá de lo visual. |

### El contrato `WidgetData`

Definido en `apps/web/src/shared/types/widget-data.ts`:

```ts
/**
 * undefined -> cargando        -> ui-skeleton
 * null      -> sin resultados  -> ui-empty
 * T         -> con datos       -> ui-data
 */
export type WidgetData<T> = T | null | undefined;
```

El **container** es el único responsable de mapear el estado de TanStack Query a
este contrato:

```ts
const { data, isLoading } = useProducts(query);

const widgetData: WidgetData<Product[]> = isLoading
  ? undefined
  : !data || data.items.length === 0
    ? null
    : data.items;
```

El **widget** queda reducido a un despacho de tres ramas, sin lógica adicional:

```tsx
if (data === undefined) return <ProductsTableUiSkeleton />;
if (data === null) return <ProductsTableUiEmpty />;
return <ProductsTableUiData products={data} />;
```

Si en un widget aparece un `if` que no es uno de estos tres, la lógica está en la
capa equivocada.

**No hay cuarto estado para errores.** Los errores de red suben al error boundary
y los de negocio los muestra el container junto al formulario que los provocó.

**Los formularios no llevan widget.** El widget existe porque hay data
asincrónica con tres estados posibles; un formulario no los tiene. Van de view a
container a ui, como en `features/auth`.

### Feature de referencia

`apps/web/src/features/products` es el patrón a copiar. Antes de escribir una
feature nueva, leerla entera: tiene la view, el container, el widget con sus tres
UI, el hook de TanStack Query y el service.

### Cómo agregar una feature nueva en el frontend

Ejemplo con `customers`:

1. **Contratos.** Si faltan, agregarlos en `packages/types/src/entities/` y
   reexportarlos. Después `pnpm build:packages`.
2. **Service** en `features/customers/services/customers.service.ts`. Es la única
   capa que conoce las rutas de la API. Usa `apiClient`, nunca `fetch` directo.
3. **Hook** en `features/customers/hooks/use-customers.ts`. Envuelve el service
   en `useQuery` y exporta la fábrica de claves de caché (`customersKeys`).
4. **UI** en `features/customers/widgets/<widget>/ui/`: las tres, siempre.
   `-ui-skeleton`, `-ui-empty`, `-ui-data`. Reciben props y no importan hooks de
   datos.
5. **Widget** en `features/customers/widgets/<widget>/`. Solo el despacho de tres
   ramas sobre `WidgetData`.
6. **Container** en `features/customers/containers/<container>/`. Llama al hook,
   mapea a `WidgetData`, administra el estado propio del listado (página, orden)
   y pasa todo al widget.
7. **View** en `features/customers/views/<view>/`. Estado compartido de la página
   (búsqueda, filtros) y layout.
8. **Ruta** en `routes/index.tsx`, colgando de `ProtectedRoute`. Si la sección
   necesita rol, pasarle `roles={['ADMIN']}`.
9. **Navegación**: marcar la sección como `available: true` en
   `shared/components/layout/app-sidebar/navigation-items.ts`.
10. Cada carpeta creada lleva su `index.ts`.

## Backend: anatomía de un módulo

```
products/
├── products.module.ts
├── products.controller.ts
├── products.service.ts
├── products.repository.ts
└── dto/
    ├── create-product.dto.ts
    ├── update-product.dto.ts
    ├── query-products.dto.ts
    └── index.ts
```

Separación estricta:

- **Controller**: rutas HTTP, validación de entrada con `ZodValidationPipe`,
  documentación Swagger, roles con `@Roles()`. **Nada de lógica de negocio.**
- **Service**: lógica de negocio. **No conoce HTTP ni Drizzle.** Recibe DTO ya
  validados y devuelve entidades del dominio. Lanza excepciones de Nest con un
  cuerpo `{ code, message }`.
- **Repository**: **el único lugar que toca Drizzle.** Devuelve entidades del
  contrato ya mapeadas, nunca filas crudas.
- **DTO**: reexportan el esquema Zod de `@calce/types` y su tipo inferido. No
  redefinen el contrato.

`apps/api/src/modules/products` es el módulo de referencia.

### Cómo agregar un módulo nuevo en el backend

Los módulos `users`, `vehicles`, `customers`, `orders`, `stock` y `reports` ya
existen registrados en `app.module.ts` con un `TODO` que describe su alcance.
Para implementar uno:

1. **DTO** en `dto/`, reexportando los contratos de `@calce/types`.
2. **Repository**: inyecta el cliente con `@Inject(DATABASE)`. Escribe funciones
   de mapeo `row -> entidad` y no deja escapar tipos de Drizzle hacia afuera.
   Cualquier operación de varios pasos va dentro de `db.transaction()`.
3. **Service**: reglas de negocio. Para errores usa las excepciones de Nest con
   cuerpo estructurado, que el filtro global convierte al formato `ApiError`:

   ```ts
   throw new NotFoundException({ code: 'NOT_FOUND', message: '...' });
   ```

4. **Controller**: una ruta por operación. Validar con
   `@Body(new ZodValidationPipe(esquema))` y documentar con `ApiZodBody`,
   `ApiZodQuery`, `ApiZodResponse` y `ApiZodErrorResponse` de `common/swagger`.
   Marcar `@ApiBearerAuth()` en la clase y `@Roles(...)` donde corresponda.
5. **Module**: declarar controller, service y repository, y exportar el service
   si otro módulo lo necesita.
6. **Test**: unitario del service con el repositorio mockeado, como
   `products.service.spec.ts`.

### Autenticación y autorización

`JwtAuthGuard` está registrado globalmente: **toda ruta nueva nace protegida.**
Para abrirla hay que marcarla con `@Public()` a propósito. El olvido falla del
lado seguro.

`RolesGuard` corre después y solo actúa si el handler declara `@Roles(...)`.

### Formato de respuesta

`TransformResponseInterceptor` envuelve todo lo que devuelve un controller:

```json
{ "success": true, "data": { ... }, "timestamp": "..." }
```

`HttpExceptionFilter` hace lo mismo con los errores, con la forma de `ApiError`.
Los controllers devuelven el dato pelado; el sobre se arma en un solo lugar.

## Base de datos

- El esquema vive en `packages/db/src/schema/`, un archivo por dominio.
- Después de tocar el esquema: `pnpm db:generate` y revisar el SQL generado
  **antes** de aplicarlo.
- `products` no tiene columna de stock. La existencia se deriva de
  `stock_movements`. No agregar un contador mutable.
- Bajas lógicas (`is_active = false`), nunca `DELETE`.
- El cliente usa el driver WebSocket de Neon porque el HTTP no soporta
  transacciones. No cambiarlo sin leer `docs/decisiones.md`.

## Comandos

| Comando               | Qué hace                                             |
| --------------------- | ---------------------------------------------------- |
| `pnpm dev`            | Compila los paquetes y levanta web y api en paralelo |
| `pnpm build`          | Construye todo en orden topológico                   |
| `pnpm typecheck`      | `tsc --noEmit` en los cuatro paquetes                |
| `pnpm lint`           | ESLint sobre todo el workspace                       |
| `pnpm format`         | Prettier con escritura                               |
| `pnpm test`           | Jest en la api, Vitest en la web                     |
| `pnpm build:packages` | Compila solo `@calce/types` y `@calce/db`            |
| `pnpm db:generate`    | Genera la migración a partir del esquema             |
| `pnpm db:migrate`     | Aplica las migraciones pendientes                    |
| `pnpm db:seed`        | Carga datos de desarrollo (destructivo)              |
| `pnpm db:studio`      | Abre Drizzle Studio                                  |

Antes de dar por terminado un cambio: `pnpm lint`, `pnpm typecheck` y
`pnpm test` tienen que pasar los tres.

## Detalles del toolchain que conviene saber

- **TypeScript está fijado en 6.0.3**, no en la última. `typescript-eslint` y
  `ts-jest` todavía no soportan la 7. No actualizar sin leer `docs/decisiones.md`.
- `moduleResolution` es `nodenext` en la api y `bundler` en la web. `node10` está
  deprecado en TypeScript 6.
- `baseUrl` está deprecado: los `paths` se resuelven relativos al `tsconfig.json`.
- El alias `@/` del backend se resuelve en runtime con `module-alias`, registrado
  en la primera línea de `main.ts`. No mover ese import.
- Los imports internos de `@calce/types` y `@calce/db` llevan extensión `.js`
  explícita, porque esos paquetes emiten a `dist/`.
- ESLint vive en `eslint.config.base.mjs` (bloques compartidos) más un
  `eslint.config.mjs` por app. En flat config los patrones de `files` se
  resuelven contra el directorio del archivo de configuración en uso, así que
  los bloques específicos se exportan como funciones que reciben un prefijo de
  ruta. Al agregar un bloque nuevo hay que respetar ese esquema, o la regla se
  aplicará desde la raíz y no desde la app.
