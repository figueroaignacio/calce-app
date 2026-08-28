# Calce

Sistema de gestión comercial para distribuidoras de autopartes, construido
alrededor de la compatibilidad vehicular.

## El problema

**La búsqueda de repuestos depende del conocimiento tácito del vendedor.** Una
autoparte no se identifica por su nombre. "Filtro de aceite" describe cientos de
piezas distintas y no alcanza para vender ninguna: lo que la identifica es para
qué vehículo sirve, con qué marca, modelo, versión y rango de años es compatible.
Ese conocimiento hoy vive en la cabeza del vendedor de mostrador, que sabe que el
filtro que entra en un Gol Trend 1.6 también sirve para un Suran de determinados
años. No está escrito en ningún lado, no se puede consultar y se va con la
persona el día que renuncia.

**La nomenclatura del catálogo es inconsistente.** El mismo repuesto convive con
el código de la terminal automotriz, el del fabricante de la pieza y el interno
de la distribuidora, más una descripción libre que cargó quien tuvo el producto
en la mano. Diez personas escriben "Filtro de aceite VW Gol" de diez maneras
distintas. Buscar por texto exacto no encuentra nada, y buscar por código exige
saber de antemano cuál de los tres códigos usó quien lo cargó.

**Los pedidos ingresan por WhatsApp en texto libre.** Llegan como mensajes que
mezclan códigos, descripciones aproximadas, cantidades y aclaraciones, y alguien
los transcribe a mano al sistema. Cada transcripción es una oportunidad de
equivocar un código o una cantidad, y el tiempo que consume es tiempo que no se
dedica a vender.

**El stock no es confiable.** No existe un registro transaccional de movimientos:
hay un número que alguien ajusta cuando nota una diferencia. Cuando el sistema
dice que hay tres unidades y en el estante hay una, no hay forma de reconstruir
qué pasó. El problema no es que el número esté mal, es que nadie puede explicar
por qué dice lo que dice.

Calce ataca los cuatro: modela la compatibilidad vehicular como dato de primera
clase, normaliza y unifica los códigos y descripciones en un solo índice de
búsqueda, y convierte el stock en un libro de movimientos inmutable donde cada
existencia se explica por su historia.

## Alcance

Módulos incluidos:

- **Catálogo**: productos, códigos OEM, de fabricante e internos, categorías,
  marcas de repuesto, equivalencias entre piezas.
- **Compatibilidad vehicular**: árbol de marcas, modelos y versiones, y las
  aplicaciones que vinculan cada repuesto con las versiones y años que admite.
- **Clientes**: datos comerciales y fiscales.
- **Pedidos**: carga, cálculo de totales y ciclo de estados.
- **Stock**: libro de movimientos con trazabilidad completa.
- **Usuarios y permisos**: roles de administración, ventas y depósito.
- **Reportes**: ventas, rotación y stock bajo mínimo.
- **Asistencia con IA**: búsqueda semántica sobre el catálogo y extracción de
  pedidos desde texto libre.

Queda explícitamente fuera del alcance:

- Facturación electrónica ARCA
- Integración con marketplaces
- Aplicación móvil nativa
- Operación multi-sucursal
- Pagos en línea
- Cuenta corriente de clientes
- Logística de reparto

## Stack tecnológico

| Tecnología                 | Rol                     | Por qué                                                                                                        |
| -------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| pnpm workspaces            | Monorepo                | Enlaces simbólicos reales entre paquetes y una sola instalación de dependencias para todo el proyecto.         |
| TypeScript (modo estricto) | Lenguaje                | Un contrato roto entre frontend y backend se detecta al compilar, no en producción.                            |
| React + Vite               | Frontend                | Arranque en frío inmediato y recarga en caliente, que es lo que define la velocidad del trabajo diario.        |
| TanStack Query             | Estado del servidor     | Caché, revalidación y estados de carga resueltos, sin escribir un reducer por endpoint.                        |
| TanStack Table             | Tablas                  | Headless: aporta la lógica de orden y paginación y deja el marcado bajo control del proyecto.                  |
| Tailwind CSS + shadcn/ui   | Estilos y componentes   | Componentes que se copian al repositorio y se modifican, en lugar de una dependencia que hay que sobrescribir. |
| React Hook Form + Zod      | Formularios             | El mismo esquema que valida el formulario valida el request en el backend.                                     |
| NestJS                     | Backend                 | Modularidad e inyección de dependencias por defecto, que es lo que hace testeable la separación por capas.     |
| Passport + JWT             | Autenticación           | Access token de vida corta y refresh token, con guards globales por defecto.                                   |
| argon2                     | Hash de contraseñas     | Ganador del Password Hashing Competition; `argon2id` resiste ataques por GPU y por canal lateral.              |
| Neon (PostgreSQL)          | Base de datos           | PostgreSQL serverless con ramas por entorno y soporte de pgvector.                                             |
| Drizzle ORM                | Acceso a datos          | SQL explícito y tipado, sin la capa de magia que vuelve impredecible el plan de ejecución.                     |
| pgvector                   | Búsqueda semántica      | Los embeddings viven en la misma base que el catálogo: sin servicio aparte que sincronizar.                    |
| Vercel AI SDK              | Integración con modelos | Una interfaz común sobre varios proveedores, configurable por variable de entorno.                             |
| Vitest / Jest + Supertest  | Tests                   | Vitest comparte la configuración de Vite en el frontend; Jest y Supertest son el camino estándar en Nest.      |
| ESLint + Prettier          | Calidad                 | Las convenciones se verifican solas, incluida la de nombres de archivo.                                        |
| GitHub Actions             | Integración continua    | Formato, lint, tipos, tests y build en cada pull request hacia `main`.                                         |

## Arquitectura

```
calce/
├── apps/
│   ├── web/                 @calce/web    React + Vite
│   │   └── src/
│   │       ├── features/    views, containers, widgets, ui, hooks, services
│   │       ├── shared/      componentes, lib, config, tipos transversales
│   │       └── routes/      router y rutas protegidas
│   └── api/                 @calce/api    NestJS
│       └── src/
│           ├── common/      guards, filtros, interceptores, pipes, decoradores
│           ├── config/      validación de entorno
│           ├── database/    provider del cliente Drizzle
│           └── modules/     un módulo por dominio
├── packages/
│   ├── types/               @calce/types  contratos Zod compartidos
│   └── db/                  @calce/db     esquema Drizzle, cliente, migraciones
├── docs/                    modelo de dominio y decisiones técnicas
└── .github/workflows/       integración continua
```

La dependencia entre paquetes es dirigida y no admite ciclos:

```
@calce/web ──┐
             ├──> @calce/types
@calce/api ──┤
             └──> @calce/db ──> @calce/types
```

`@calce/types` no depende de `@calce/db` ni de nada del backend. El frontend
importa los contratos, así que arrastrar Drizzle o el driver de Neon al bundle
del navegador no es una opción.

### Frontend: cuatro capas

La responsabilidad de cada capa está delimitada y no se mezcla.

- **View**: administra el estado compartido de la página y arma el layout. Puede
  contener más de un container. No fetchea datos.
- **Container**: orquesta la información. Fetchea y la transforma para pasársela
  a los widgets. Puede contener más de un widget. No renderiza presentación.
- **Widget**: recibe la data ya resuelta y, según el estado en que llegue,
  renderiza el UI correspondiente. Siempre tiene exactamente tres UI. No fetchea
  ni transforma.
- **UI**: el componente más chico. Solo presentación, sin lógica ni estado propio
  más allá de lo visual.

El contrato que une container y widget es un único tipo:

```ts
/**
 * undefined -> cargando        -> ui-skeleton
 * null      -> sin resultados  -> ui-empty
 * T         -> con datos       -> ui-data
 */
export type WidgetData<T> = T | null | undefined;
```

El container mapea el estado de TanStack Query a ese contrato y el widget queda
reducido a un despacho de tres ramas. La consecuencia práctica es que los estados
de carga y vacío dejan de ser algo que cada pantalla resuelve como puede: son
parte de la firma del componente.

`apps/web/src/features/products` implementa el patrón completo y es la
referencia para las features siguientes.

### Backend: modularidad y separación por capas

Cada dominio es un módulo de NestJS con la misma anatomía y una separación de
responsabilidades estricta:

- **Controller**: rutas HTTP, validación de entrada y documentación Swagger. Sin
  lógica de negocio.
- **Service**: lógica de negocio. No conoce HTTP ni Drizzle.
- **Repository**: el único lugar que toca Drizzle. Devuelve entidades del
  dominio, no filas crudas.

Sobre esa base hay tres piezas transversales: un guard JWT global que deja toda
ruta protegida salvo las marcadas explícitamente como públicas, un interceptor
que envuelve las respuestas exitosas en un formato único, y un filtro que hace lo
mismo con los errores.

`apps/api/src/modules/products` implementa el patrón completo.

## Puesta en marcha

### Requisitos previos

- Node.js 22 o superior
- pnpm 11 o superior
- Una base PostgreSQL con la extensión `pgvector`. Lo esperado es una instancia
  de [Neon](https://neon.tech); alternativamente hay un entorno local en
  `docker-compose.yml`.

### Instalación

```bash
pnpm install
```

### Variables de entorno

```bash
cp .env.example .env
```

Completar en `.env`:

- `DATABASE_URL`: cadena de conexión de Neon.
- `JWT_SECRET` y `REFRESH_TOKEN_SECRET`: mínimo 32 caracteres cada uno. Se
  generan con `openssl rand -base64 48`.
- Las credenciales de IA son opcionales: sin ellas la aplicación funciona
  completa salvo el módulo `ai`.

La API valida el entorno al arrancar. Si falta o es inválida cualquier variable
requerida, el proceso termina indicando cuál y por qué, en lugar de levantar roto
y fallar en la primera consulta.

### Base de datos

```bash
pnpm db:migrate   # aplica las migraciones, incluida CREATE EXTENSION vector
pnpm db:seed      # carga datos de prueba (destructivo: vacía las tablas antes)
```

El seed deja tres usuarios de desarrollo:

| Rol         | Correo              | Contraseña           |
| ----------- | ------------------- | -------------------- |
| `ADMIN`     | admin@calce.test    | calce-admin-2026     |
| `SELLER`    | vendedor@calce.test | calce-seller-2026    |
| `WAREHOUSE` | deposito@calce.test | calce-warehouse-2026 |

Junto con 27 productos con sus aplicaciones vehiculares, el árbol de marcas y
modelos, categorías, marcas de repuesto y clientes.

### Desarrollo

```bash
pnpm dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000/api`
- Documentación OpenAPI: `http://localhost:3000/api/docs`

### Entorno local sin Neon

El driver de Neon habla WebSocket, así que un PostgreSQL común necesita un proxy
en el medio. `docker-compose.yml` levanta ambos:

```bash
docker compose up -d
```

Y en el `.env`:

```
DATABASE_URL=postgresql://calce:calce@localhost:5432/calce
NEON_WS_PROXY=localhost:5433/v1
```

Contra Neon, `NEON_WS_PROXY` va vacía.

## Scripts disponibles

| Script                | Qué hace                                              |
| --------------------- | ----------------------------------------------------- |
| `pnpm dev`            | Compila los paquetes y levanta web y api en paralelo  |
| `pnpm build`          | Construye todo el monorepo en orden topológico        |
| `pnpm build:packages` | Compila solo `@calce/types` y `@calce/db`             |
| `pnpm typecheck`      | Verificación de tipos en los cuatro paquetes          |
| `pnpm lint`           | ESLint sobre todo el workspace                        |
| `pnpm format`         | Aplica Prettier                                       |
| `pnpm format:check`   | Verifica formato sin escribir                         |
| `pnpm test`           | Jest en la api, Vitest en la web                      |
| `pnpm db:generate`    | Genera una migración a partir del esquema             |
| `pnpm db:migrate`     | Aplica las migraciones pendientes                     |
| `pnpm db:push`        | Sincroniza el esquema sin migración (solo desarrollo) |
| `pnpm db:studio`      | Abre Drizzle Studio                                   |
| `pnpm db:seed`        | Carga los datos de prueba                             |

## Convenciones

**Nombres de archivo.** Todos los archivos y carpetas en kebab-case, sin
excepciones: `products-table-widget.tsx`, `create-product.dto.ts`,
`use-products.ts`. Los componentes de React se declaran en PascalCase dentro de
archivos kebab-case. La regla está verificada por ESLint.

**Commits.** [Conventional Commits](https://www.conventionalcommits.org):

```
feat(products): filtro por compatibilidad vehicular
fix(stock): evitar existencias negativas en confirmación concurrente
docs(readme): documentar entorno local con docker
chore(deps): actualizar drizzle-orm a 0.45.2
```

**Ramas.** Prefijo según el tipo de trabajo: `feat/`, `fix/`, `docs/`, `chore/`.
El resto del nombre describe el cambio en kebab-case:
`feat/busqueda-por-compatibilidad`.

**Pull requests.** Contra `main`, con revisión cruzada obligatoria. La
integración continua verifica formato, lint, tipos, tests y build; ningún PR se
mergea con la corrida en rojo. La descripción explica qué cambia y por qué, no
qué archivos se tocaron: eso ya está en el diff.

El detalle completo de las convenciones de código está en `CLAUDE.md`.

## Estado del proyecto

El proyecto es un scaffolding con una porción vertical de referencia funcionando
de punta a punta. El catálogo está implementado completo para que el resto de los
módulos se construya copiando ese patrón.

### Backend

| Módulo      | Estado       | Detalle                                                                             |
| ----------- | ------------ | ----------------------------------------------------------------------------------- |
| `config`    | Implementado | Validación de entorno con Zod y fallo en el arranque                                |
| `database`  | Implementado | Provider global del cliente Drizzle sobre el driver WebSocket de Neon               |
| `health`    | Implementado | `GET /health` con verificación de conectividad                                      |
| `auth`      | Implementado | Registro, login, refresh, `JwtAuthGuard` global y `RolesGuard`                      |
| `products`  | Implementado | CRUD con paginación, filtros, orden y búsqueda por códigos                          |
| `ai`        | Parcial      | Proveedor configurado y `POST /ai/ping`; embeddings y búsqueda semántica como stubs |
| `users`     | Pendiente    | Módulo registrado con el alcance documentado                                        |
| `vehicles`  | Pendiente    | Módulo registrado con el alcance documentado                                        |
| `customers` | Pendiente    | Módulo registrado con el alcance documentado                                        |
| `orders`    | Pendiente    | Módulo registrado con el alcance documentado                                        |
| `stock`     | Pendiente    | Módulo registrado con el alcance documentado                                        |
| `reports`   | Pendiente    | Módulo registrado con el alcance documentado                                        |

### Frontend

| Área                   | Estado       | Detalle                                                               |
| ---------------------- | ------------ | --------------------------------------------------------------------- |
| `api-client`           | Implementado | Cliente tipado con inyección de token y refresh automático ante 401   |
| `auth`                 | Implementado | Login con React Hook Form y Zod, sesión y rutas protegidas por rol    |
| `products`             | Implementado | Las cuatro capas completas, con TanStack Table sobre el endpoint real |
| Layout                 | Implementado | App shell con barra lateral y encabezado                              |
| Resto de las secciones | Pendiente    | Listadas en la navegación, deshabilitadas hasta tener pantalla        |

### Base de datos

| Elemento                               | Estado       |
| -------------------------------------- | ------------ |
| Esquema completo                       | Implementado |
| Migración inicial                      | Implementado |
| Índice HNSW sobre `products.embedding` | Implementado |
| Seed de desarrollo                     | Implementado |
| Cálculo de embeddings                  | Pendiente    |
