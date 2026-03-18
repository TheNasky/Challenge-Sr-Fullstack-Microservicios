# Ecommerce App with Nest.js and Postgres - Updated Backend

## Description
This is the **updated version** of the ecommerce application, evolved from a monolithic NestJS/PostgreSQL backend to an **event-driven architecture**. 

The original backend is preserved in `../original-backend/` for reference.

**Main Goals:**
- Fix critical structural issues (minimal necessary changes)
- Convert to event-driven architecture
- Implement domain events and decoupled consumers
- Prepare for microservices evolution

## Changes & Decisions

See [CHANGES.md](./CHANGES.md) for detailed tracking of all modifications.

### Key Decisions

1. **Repository Pattern**: Fixed `ProductService` to use repositories for consistency
2. **Inventory/ProductVariation**: Acknowledged but not implemented - these will be added as part of the event-driven architecture implementation
3. **Minimal Changes**: Only fixing what's necessary to establish a solid foundation for event-driven conversion

## Technology Stack

- Nest.js
- PostgreSQL
- TypeORM
- Jest

## Getting Started

To get started with this project, follow these steps:

1. **Navigate to the backend directory:**
```bash 
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure database:**
   - Copy `.env` file or create one from `src/common/envs/development.env`
   - Update with your database credentials (currently configured for Neon PostgreSQL)

4. **Run database migrations:**
```bash
npm run migration:run
```

5. **Run database seeders** (creates roles, admin user, categories, etc.):
```bash
npm run seed:run
```

6. **Start the application:**
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

### Database Migrations

To generate a new migration:
```bash
npm run migration:generate --name=<migrationName>
```

To revert the last migration:
```bash
npm run migration:revert
```

## API Documentation

### Available Endpoints

- **Auth**: `/auth/login`, `/auth/register`
- **User**: `/user/profile` (requires auth)
- **Product**: `/product/:id`, `/product/create`, `/product/:id/details`, `/product/:id/activate`, `/product/:id` (DELETE)
- **Role**: `/role/assign` (requires Admin role)

See `documentation/Nestjs Ecommerce.postman_collection.json` for a complete Postman collection.

### Default Admin Credentials

After running seeds:
- Email: `admin@admin.com`
- Password: `12345678`

## Testing

To run the tests:
```bash
npm run test
```

For E2E tests:
```bash
npm run test:e2e
```

## Architecture Notes

### Current State
- Monolithic NestJS application
- PostgreSQL database with TypeORM
- JWT-based authentication
- Role-based access control (RBAC)

### Target State (In Progress)
- Event-driven architecture
- Domain events for decoupled communication
- Event consumers/handlers
- Preparation for microservices split

## Known Limitations

1. **Inventory & ProductVariation**: Entities exist but no API endpoints yet - will be implemented as part of event-driven architecture
2. See [CHANGES.md](./CHANGES.md) for full list of identified issues and decisions
