# CALCE — Módulo de Clientes

## Alcance implementado (propuesto en la rama de Santiago)

- CRUD NestJS + Drizzle: listado, detalle, alta, modificación y baja lógica.
- Búsqueda por razón social, CUIT o email; paginación y ordenamiento manual en PostgreSQL.
- Validación Zod del CUIT de 11 dígitos y su dígito verificador.
- Detección de CUIT duplicado (validación de negocio y restricción UNIQUE en PostgreSQL).
- `GET` accesible con JWT a usuarios autenticados; `POST`, `PATCH` y `DELETE` requieren `ADMIN`.
- Frontend React en `/clientes`, tabla TanStack Table, consultas/mutaciones TanStack Query, validación del formulario y reactivación.
- Registros inactivos se conservan para mantener los pedidos históricos.

## Arquitectura

- `packages/types/src/entities/customer.ts`: contratos Zod compartidos.
- `packages/db/src/schema/customers.ts`: tabla y relaciones ya creadas en el proyecto.
- `apps/api/src/modules/customers/customers.controller.ts`: transporte HTTP + Swagger + guards + pipes.
- `apps/api/src/modules/customers/customers.service.ts`: reglas de negocio, duplicados y errores.
- `apps/api/src/modules/customers/customers.repository.ts`: único acceso SQL con Drizzle.
- `apps/web/src/features/customers`: view, container, widget/UI, hooks y servicio HTTP.

## Contrato HTTP

| Método | Ruta | Autorización | Resultado |
|---|---|---|---|
| GET | `/api/customers` | Sesión válida | Lista paginada |
| GET | `/api/customers/:id` | Sesión válida | Ficha del cliente |
| POST | `/api/customers` | ADMIN | Crear cliente |
| PATCH | `/api/customers/:id` | ADMIN | Actualizar/reactivar |
| DELETE | `/api/customers/:id` | ADMIN | Desactivar (204) |

El prefijo `/api` está definido en el bootstrap de NestJS. Los cuerpos de respuesta siguen el sobre global de `TransformResponseInterceptor`.

### Filtros

`page`, `pageSize`, `search`, `isActive=true|false`, `sortBy=businessName|taxId|createdAt|updatedAt` y `sortOrder=asc|desc`.

### Ejemplo para crear (ADMIN)

```json
{
  "businessName": "Repuestos del Sur",
  "taxId": "20329642330",
  "taxCondition": "RESPONSABLE_INSCRIPTO",
  "email": "ventas@example.com",
  "phone": null,
  "address": null,
  "priceListId": null
}
```

## Limitaciones explícitas

- La columna `priceListId` existe, pero **todavía no hay tabla de listas de precios**; por ello el servicio rechaza asignaciones no nulas. No se anuncia esa funcionalidad como terminada.
- No se incluyen importaciones masivas ni facturación ARCA.
- La validación de CUIT comprueba el dígito verificador, no la existencia fiscal real del contribuyente.
- La búsqueda es `ILIKE`, no un buscador semántico.
- La prueba integral con la base Neon y el despliegue debe realizarse en un entorno de prueba antes de fusionar a `main`.

## Evidencia y comandos de aceptación

Desde la raíz:

```bash
pnpm build:packages
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Si el `format:check` global falla por archivos ajenos, no reformatear todo el proyecto en esta rama. Registrar el resultado y coordinar el arreglo con el responsable de CI.

### Recorrido de prueba recomendado

1. Iniciar sesión como `ADMIN` con las credenciales de desarrollo **solo en entorno local**.
2. Ir a `/clientes`, crear uno con CUIT válido, comprobar que figure en la lista.
3. Buscarlo por CUIT y razón social; cambiar el orden y la página.
4. Editar razón social o contacto; comprobar persistencia tras recargar.
5. Intentar duplicar un CUIT y comprobar respuesta 409.
6. Intentar un CUIT con dígito verificador inválido y comprobar validación.
7. Darlo de baja; filtrar inactivos; reactivarlo.
8. Iniciar sesión como `SELLER`: puede consultar, pero no puede usar endpoints de escritura (403).
9. Comprobar que los tests y el build sean correctos.

## Explicación para la defensa individual

> "Implementé Clientes manteniendo el patrón de Productos: el controller valida HTTP con Zod; el service aplica reglas de negocio como CUIT único y baja lógica; el repository se encarga de SQL con Drizzle. En React separé view, container, widget y UI. TanStack Query mantiene las consultas y las invalida tras las mutaciones. El backend protege escrituras con RolesGuard para ADMIN y preserva los pedidos históricos desactivando clientes en vez de borrarlos físicamente."
