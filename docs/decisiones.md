# Decisiones técnicas

Registro de las decisiones que no son obvias leyendo el código, con el motivo y
lo que costaron. Si alguna se revierte, conviene actualizar la entrada en lugar
de borrarla.

## 1. Driver WebSocket de Neon en lugar de HTTP

`packages/db/src/client.ts` usa `drizzle-orm/neon-serverless` con `Pool` y `ws`,
no `neon-http`.

El driver HTTP abre una conexión por sentencia y por eso **no soporta
transacciones**. Los módulos de pedidos y stock las necesitan: confirmar un
pedido implica leer el último `resulting_stock` de cada producto, validar que
alcance y escribir los asientos nuevos, todo o nada. Con HTTP, dos
confirmaciones concurrentes sobre el mismo producto leen el mismo stock y lo
dejan en negativo.

Costo: hay que inyectar una implementación de WebSocket, porque Node no trae una
compatible con el protocolo que espera Neon.

## 2. El stock es un libro de movimientos

`products` no tiene columna de stock. Ver `docs/modelo-de-dominio.md` para el
detalle. Resumen: da trazabilidad completa a cambio de una consulta más cara,
mitigada con `resulting_stock` como caché de lectura y un índice sobre
`(product_id, created_at)`.

## 3. `@calce/types` no depende de nada del backend

Es una regla dura, no una preferencia de estilo. El frontend importa ese paquete,
así que si arrastrara `@calce/db` metería Drizzle y el driver de Neon en el
bundle del navegador.

Los contratos se definen con Zod de forma independiente del esquema de base de
datos, aunque lo reflejen. La duplicación es intencional: son dos cosas distintas
que suelen coincidir. `products.embedding`, por ejemplo, existe en el esquema y
no en el contrato.

La dirección inversa sí está permitida: `@calce/db` importa `@calce/types` para
que los enums de Postgres se generen desde la misma lista de valores.

## 4. TypeScript fijado en 6.0.3, no en la última

Al momento de armar el proyecto, la última estable de TypeScript era 7.0.2 (el
compilador nativo). No se puede usar todavía:

- `typescript-eslint@8.68.0` declara `typescript >=4.8.4 <6.1.0`.
- `ts-jest@29.4.12` declara `typescript >=4.3 <7`.

Con TypeScript 7 el lint y los tests del backend quedan sin soporte. 6.0.3 es la
estable más alta que satisface a ambos.

Consecuencias de estar en 6.x, ya aplicadas en la configuración:

- `moduleResolution: "node10"` está deprecado: el backend usa `nodenext` y el
  frontend `bundler`.
- `baseUrl` está deprecado: los `paths` se resuelven relativos al `tsconfig.json`.

Cuando typescript-eslint y ts-jest soporten TypeScript 7, la migración es
cambiar la versión y revisar esos dos puntos.

## 5. `@calce/types` se publica como CommonJS y ESM

El backend es CommonJS (NestJS con decoradores y Jest) y el frontend consume ESM
a través de Vite. Un solo formato obliga a uno de los dos a hacer malabares.

El paquete compila dos veces (`tsconfig.cjs.json` y `tsconfig.esm.json`) y
declara ambas entradas en `exports`. Por eso los imports internos del paquete
llevan extensión `.js` explícita: es lo que hace que la salida ESM sea resoluble
por Node.

`@calce/db` compila solo a CommonJS: únicamente lo consume el backend.

## 6. Swagger se genera desde los esquemas Zod

`apps/api/src/common/swagger/zod-openapi.ts` convierte los contratos a OpenAPI
con `z.toJSONSchema()`.

La alternativa habitual es declarar clases DTO con `@ApiProperty` en cada campo,
lo que significa escribir cada campo dos veces: una para validar y otra para
documentar. Las dos definiciones se separan sola en cuestión de semanas.

## 7. El Vercel AI SDK se carga de forma perezosa

`ai` y `@ai-sdk/*` se publican solo como ESM y el backend es CommonJS. Node 22
resuelve `require` de ESM, pero el runtime de Jest no.

Los modelos se construyen dentro de `AiModels.language()` / `.embedding()` con
`import()` dinámico, en vez de resolverse al arrancar. Eso además permite que la
app levante sin credenciales de IA: sin API key funciona todo salvo el módulo
`ai`, que devuelve un error explícito nombrando la variable que falta.

## 8. Las credenciales de IA no se exigen en el arranque

`env.config.ts` valida el entorno y mata el proceso si falta algo requerido, pero
`GOOGLE_GENERATIVE_AI_API_KEY` y `OPENAI_API_KEY` son opcionales. Exigirlas
obligaría a tener una API key para poder trabajar en el catálogo o en pedidos.

En la misma línea: una variable declarada vacía en el `.env` se trata como
ausente. Sin eso, copiar `.env.example` tal cual haría fallar el arranque por
cada clave opcional sin completar, que es el caso normal.

## 9. El alias `@/` en el backend se resuelve con `module-alias`

TypeScript no reescribe los `paths` al emitir. `nest build` compila con `tsc`, y
`nest start` ejecuta la salida en `dist/`, así que el alias tiene que existir en
runtime.

`module-alias/register` en la primera línea de `main.ts` más `_moduleAliases` en
el `package.json` lo resuelve igual en desarrollo y en producción. Las
alternativas (`tsc-alias` en el build, `tsconfig-paths` en runtime) obligaban a
tratar `nest start --watch` distinto que `node dist/main.js`.

## 10. `WidgetData` con tres estados, no cuatro

El contrato del frontend no tiene rama de error: `undefined` es cargando, `null`
es sin resultados y `T` es con datos.

Los errores de red suben al error boundary y los de negocio los muestra el
container junto al formulario que los provocó. Meter una cuarta rama en el widget
lo convertiría en un lugar donde se decide algo, y el punto del widget es que no
decida nada.

## 11. `localStorage` para los tokens

`apps/web/src/shared/lib/token-storage.ts` guarda el par de tokens en
`localStorage` para que la sesión sobreviva a un refresh del navegador.

Es una decisión con contrapartida conocida: un XSS puede leer el token. Antes de
salir a producción, el refresh token debería moverse a una cookie `httpOnly` y el
access token quedar solo en memoria.

Pendiente relacionado: hoy el refresh token no se rota ni se revoca. Uno robado
sirve hasta que expira. Está anotado como TODO en `AuthService.refresh()`.

## 12. `docker-compose.yml` es opcional

El destino del proyecto es Neon. El compose levanta un PostgreSQL con pgvector y
el proxy WebSocket de Neon para poder trabajar sin conexión ni cuenta.

Se activa con `NEON_WS_PROXY` en el `.env`. Contra Neon esa variable va vacía y
el cliente usa el endpoint real.
