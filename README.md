# README en Espanol - Challenge Tecnico Microservicios

Este documento resume la solucion implementada para el challenge, con foco en arquitectura, decisiones tecnicas, problemas detectados y forma de ejecucion.

## Documentacion complementaria

- [`CAMBIOS_REALIZADOS.md`](./CAMBIOS_REALIZADOS.md)
- [`Challenge Sr Fullstack (Microservicios).pdf`](./Challenge%20Sr%20Fullstack%20%28Microservicios%29.pdf)


## Resumen

Se tomo un backend monolitico de NestJS + TypeORM y se lo llevo a una base event-driven con cambios incrementales, priorizando:

- estabilizar autenticacion/autorizacion,
- corregir puntos de acoplamiento y validacion,
- implementar eventos de dominio con consumidores desacoplados,
- exponer el flujo asincronico en frontend React,
- dejar trazabilidad de decisiones y alcance.

## Problemas detectados (alto nivel)

1. Uso inconsistente del patron repositorio en servicios (mezcla con `EntityManager`).
2. Acoplamiento implicito entre Auth y User en cada request autenticada.
3. Bypass de validaciones con updates directos (`QueryBuilder`).
4. Flujos de autorizacion inconsistentes luego de pasar roles al JWT.
5. Inventario y variaciones sin flujo funcional en la API principal.

El detalle tecnico, con fix aplicado y estado, esta en [`CAMBIOS_REALIZADOS.md`](./CAMBIOS_REALIZADOS.md).

## Eventos implementados y por que

### 1) `product.activated`

**Cuando se emite:** al activar un producto.

**Por que existe:**
- Es un punto natural de dominio para disparar procesos derivados.
- Permite desacoplar la activacion comercial de la actualizacion de inventario.

**Que habilita:**
- Persistencia en `event_log` para trazabilidad.
- Consumo por `InventoryListener` para crear/actualizar stock inicial.

### 2) `role.assigned`

**Cuando se emite:** al asignar un rol a un usuario.

**Por que existe:**
- Refleja un cambio relevante de permisos dentro del dominio.
- Deja audit trail y habilita integraciones futuras (notificaciones, compliance, etc.).

**Que habilita:**
- Persistencia en `event_log`.
- Base lista para sumar consumidores sin acoplar modulo de roles con otros modulos.

## Decisiones tecnicas relevantes

### Por que `@nestjs/event-emitter` y no RabbitMQ/Redis ahora

Se eligio un bus in-process con `@nestjs/event-emitter` por criterio de alcance:

- El desafio pide demostrar criterio event-driven, asincronia y desacople, no montar una plataforma distribuida completa.
- Reduce complejidad operativa inicial (infra, retries, DLQ, observabilidad distribuida, contratos versionados, etc.).
- Acelera validacion funcional end-to-end y deja el dominio modelado por eventos desde ya.

### Produccion y microservicios

Para una arquitectura de microservicios en produccion, la idea es migrar a un broker externo (por ejemplo, SQS, RabbitMQ o Kafka).

En esta entrega usamos `@nestjs/event-emitter` porque el objetivo era validar rapido el flujo de dominio, asincronia y desacople sin sumar complejidad de infraestructura.

## Como levantar el proyecto

### 1) Backend

```bash
cd backend
npm install
npm run migration:run
npm run seed:run
npm run start:dev
```

Backend por defecto: `http://localhost:3000`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend por defecto: `http://localhost:5173`

## Variables de entorno

- Backend: `.env` con credenciales de DB/JWT (Neon en este caso).
- Frontend: variable `VITE_API_BASE` (si no se define, usa `http://localhost:3000`).

## URLs publicas (deploy)

Backend (Render): `https://challenge-sr-fullstack-microservicios.onrender.com`
Frontend (Vercel): `https://challenge-sr-fullstack-microservici.vercel.app/`


## Estado actual

- Flujo backend/frontend funcional de punta a punta.
- Eventos de dominio implementados y persistidos.
- Inventario basico disparado por evento al activar producto.
- Test e2e para validar flujo event-driven.

## Nota final

El objetivo no fue "dejarlo enterprise de una", sino dejar una base prolija, defendible y extensible. Con esta linea, la siguiente etapa (broker externo + split de servicios) se puede hacer sin tirar trabajo.
