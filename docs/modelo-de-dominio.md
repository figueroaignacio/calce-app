# Modelo de dominio

Este documento explica por qué el esquema tiene la forma que tiene. Para el
detalle de columnas y tipos, la fuente de verdad es `packages/db/src/schema/`.

## El eje del sistema: la aplicación vehicular

Una autoparte no se identifica por su nombre. "Filtro de aceite" describe cientos
de piezas distintas y no alcanza para vender ninguna. Lo que la identifica es
para qué vehículo sirve: marca, modelo, versión y rango de años.

Por eso el modelo separa el árbol vehicular en tres niveles:

```
vehicle_brands  -> vehicle_models -> vehicle_versions
(Volkswagen)       (Gol Trend)       (1.6 MSI, motor 1.6 8v nafta)
```

La compatibilidad se ata a la **versión**, no al modelo. Dos versiones del mismo
auto pueden llevar piezas distintas, y colapsarlas en el modelo produce
recomendaciones equivocadas, que en el mostrador significan una devolución.

`product_applications` es la tabla que materializa esa relación:

```
product_applications (product_id, vehicle_version_id, year_from, year_to)
```

`year_to` en `NULL` significa "hasta la actualidad". Un producto tiene tantas
filas como combinaciones de versión y rango de años admita.

## Nomenclatura: un producto, muchos códigos

El mismo repuesto convive con al menos tres códigos:

- **OEM**: el de la terminal automotriz (`030115561AN`).
- **MANUFACTURER**: el del fabricante de la pieza (`PH5796` de Fram).
- **INTERNAL**: el que le puso la distribuidora (`FA-GOL16`).

`product_codes` los guarda todos con su tipo, y la búsqueda resuelve los tres.
Además, `products.normalized_description` guarda la descripción sin acentos, sin
signos y en mayúsculas. La normalización la produce `normalizeSearchText()` en
`packages/db/src/normalize.ts`: cualquier código que escriba esa columna tiene
que usar esa misma función, o la búsqueda deja de encontrar.

El buscador parte el término en tokens y exige que cada uno aparezca en el SKU,
en la descripción normalizada o en algún código. Así "filtro aceite gol"
encuentra "Filtro de aceite Volkswagen Gol Trend 1.6", que es como pregunta el
vendedor de mostrador y no como está escrito el registro.

`product_equivalences` cierra el circuito: relaciona piezas de fabricantes
distintos que cumplen la misma función, para poder ofrecer una alternativa
cuando la primera no está en stock.

## Stock: un libro de movimientos, no un contador

**`products` no tiene columna de stock.** La existencia se deriva de
`stock_movements`, que registra cada entrada, salida, ajuste y reserva.

Cada asiento persiste `resulting_stock`: la existencia que quedó después de
aplicarlo. Es una caché de lectura, no la verdad. La verdad es la serie completa
de movimientos; `resulting_stock` evita tener que recorrerla en cada consulta.

Los movimientos son inmutables. Un error se corrige con un asiento nuevo de tipo
`ADJUSTMENT` que lo compensa, nunca editando o borrando el original.

La razón es que el problema a resolver no era "no sabemos cuánto hay" sino "no
sabemos por qué dice lo que dice". Un contador mutable responde lo primero y
pierde lo segundo.

Consecuencia técnica directa: escribir stock exige una transacción. Leer el
último `resulting_stock`, validar que alcance y escribir el asiento nuevo tienen
que ser atómicos, o dos confirmaciones simultáneas sobre el mismo producto lo
dejan en negativo. Por eso el cliente usa el driver WebSocket de Neon y no el
HTTP (ver `docs/decisiones.md`).

## Pedidos

```
orders (number, customer_id, user_id, status, date, subtotal, discount, total)
order_items (order_id, product_id, quantity, unit_price, discount, subtotal)
```

El precio unitario se copia al renglón en el momento de la carga. Si mañana
cambia la lista de precios, el pedido histórico tiene que seguir mostrando lo que
efectivamente se cobró.

El ciclo de vida está en el enum `order_status`:

| Estado           | Qué significa                                 |
| ---------------- | --------------------------------------------- |
| `DRAFT`          | Editable libremente. No compromete stock.     |
| `CONFIRMED`      | Reserva stock (`RESERVATION`).                |
| `IN_PREPARATION` | En armado en depósito.                        |
| `SHIPPED`        | Descuenta stock definitivamente (`OUTBOUND`). |
| `DELIVERED`      | Entregado y conforme.                         |
| `CANCELLED`      | Libera lo reservado.                          |

Todo cambio de estado que toque stock corre en la misma transacción que los
asientos de `stock_movements`.

## Bajas lógicas

Productos, clientes y usuarios se dan de baja con `is_active = false`, nunca con
`DELETE`. Están referenciados por pedidos históricos y por asientos de stock:
borrarlos rompe la trazabilidad que el sistema existe para dar.

## Preparado para búsqueda semántica

`products.embedding` es una columna `vector(1536)` con índice HNSW y distancia
coseno, creada por la migración inicial junto con `CREATE EXTENSION IF NOT EXISTS
vector`.

Hoy queda en `NULL`. El módulo `ai` del backend tiene los stubs de
`EmbeddingsService` y `SemanticSearchService` con la firma prevista y las
decisiones pendientes anotadas. El modelo de embeddings ya es inyectable a través
del token `AI_MODELS`, así que implementarlos no requiere tocar configuración ni
esquema.
