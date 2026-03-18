# Cambios Realizados

Este documento concentra los cambios tecnicos implementados sobre la base original del challenge.

## Backend

### Arquitectura y capas

- Refactor de `ProductService` para usar repositorios (`Repository<Product>`, `Repository<Category>`) en lugar de `EntityManager` directo.
- Correccion de operaciones de update para no saltear lifecycle/validaciones de TypeORM.

### Seguridad y autorizacion

- JWT con `roleIds` embebidos para evitar lookup de usuario en cada request autenticada.
- `AuthGuard` y `RolesGuard` alineados al nuevo payload JWT.
- Uso de `ConfigService` para secretos en lugar de acceso directo por `process.env` dentro de guards.

### Event-driven

- Integracion de `@nestjs/event-emitter` como event bus in-process.
- Eventos de dominio implementados:
  - `product.activated`
  - `role.assigned`
- Consumidor desacoplado para persistencia de eventos en `event_log`.
- Endpoint `GET /events` para observar flujo asincronico.

### Inventario basico por evento

- Se agrego stock al flujo de activacion de producto.
- Al emitir `product.activated`, `InventoryListener` consume el evento.
- `InventoryService` crea/actualiza inventario para la variacion por defecto y pais por defecto (`EG`).

### Estabilidad operativa

- Se desactivo logging de queries SQL en caliente (`logging: false`) para evitar ruido constante.
- Ajustes de seed de admin para asegurar roles correctos en ambientes de prueba.


## Testing

- E2E para validar flujo event-driven y persistencia de eventos.
- Ajustes de limpieza de datos para respetar FK en tests.


## Pendientes / Proxima etapa recomendada

- Reemplazar event bus in-process por broker externo (RabbitMQ/Kafka/Redis Streams) cuando haya despliegue distribuido real.

