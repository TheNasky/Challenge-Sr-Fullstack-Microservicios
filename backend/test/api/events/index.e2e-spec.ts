import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from 'src/app.module';
import { EventLog } from 'src/event-log/event-log.entity';
import { Role } from 'src/database/entities/role.entity';
import { User } from 'src/database/entities/user.entity';
import { Category } from 'src/database/entities/category.entity';
import { Product } from 'src/database/entities/product.entity';
import { Country, CountryCodes, Countries } from 'src/database/entities/country.entity';
import { Size, SizeCodes } from 'src/database/entities/size.entity';
import { Color } from 'src/database/entities/color.entity';
import { generateMockToken } from 'test/mocks/jwt';
import { ProductActivatedEvent } from 'src/events/product-activated.event';
import { RoleAssignedEvent } from 'src/events/role-assigned.event';

describe('Domain events (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let eventLogRepository: Repository<EventLog>;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;
  let categoryRepository: Repository<Category>;
  let productRepository: Repository<Product>;
  let countryRepository: Repository<Country>;
  let sizeRepository: Repository<Size>;
  let colorRepository: Repository<Color>;

  const waitForEventTypes = async (
    expectedTypes: string[],
    timeoutMs = 2000,
    pollEveryMs = 50,
  ) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const logs = await eventLogRepository.find({ order: { id: 'ASC' } });
      const types = logs.map((l) => l.type);
      const hasAll = expectedTypes.every((t) => types.includes(t));
      if (hasAll) return { logs, types };
      await new Promise((r) => setTimeout(r, pollEveryMs));
    }
    const logs = await eventLogRepository.find({ order: { id: 'ASC' } });
    const types = logs.map((l) => l.type);
    return { logs, types };
  };

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    eventLogRepository = moduleFixture.get('EventLogRepository');
    userRepository = moduleFixture.get('UserRepository');
    roleRepository = moduleFixture.get('RoleRepository');
    categoryRepository = moduleFixture.get('CategoryRepository');
    productRepository = moduleFixture.get('ProductRepository');
    countryRepository = moduleFixture.get('CountryRepository');
    sizeRepository = moduleFixture.get('SizeRepository');
    colorRepository = moduleFixture.get('ColorRepository');

    // Ensure baseline data exists for tests (roles + a category)
    await roleRepository.upsert(
      [
        { id: 1, name: 'Customer' },
        { id: 2, name: 'Merchant' },
        { id: 3, name: 'Admin' },
      ],
      { conflictPaths: ['id'] },
    );
    await categoryRepository.upsert(
      [{ id: 1, name: 'Computers' }],
      { conflictPaths: ['id'] },
    );
    await countryRepository.upsert(
      [{ code: CountryCodes.Egypt, name: Countries.Egypt }],
      { conflictPaths: ['code'] },
    );
    await sizeRepository.upsert([{ code: SizeCodes.NA }], {
      conflictPaths: ['code'],
    });
    await colorRepository.upsert([{ name: 'NA', hexCode: '#FFFFFF' }], {
      conflictPaths: ['name'],
    });

    const inventoryRepository = moduleFixture.get('InventoryRepository');
    const productVariationRepository = moduleFixture.get('ProductVariationRepository');
    
    // Clean tables for deterministic assertions (order matters due to FKs)
    await eventLogRepository.delete({});
    await inventoryRepository.delete({});
    await productVariationRepository.delete({});
    await productRepository.delete({});
    await userRepository.delete({});

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('emits product.activated and role.assigned and persists them to event_log', async () => {
    // Create an admin user with Admin role
    const adminRole = await roleRepository.findOne({ where: { id: 3 } });
    const admin = userRepository.create({
      email: `admin_test_${Date.now()}@example.com`,
      password: 'irrelevant-for-mock-token',
      roles: [adminRole],
    });
    const savedAdmin = await userRepository.save(admin);
    const adminToken = await generateMockToken(moduleFixture, savedAdmin);

    // Create product
    const created = await request(app.getHttpServer())
      .post('/product/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoryId: 1 });
    expect(created.status).toBe(201);
    expect(created.body.isSuccess).toBe(true);
    const productId = created.body.data?.id ?? created.body.id;
    expect(productId).toBeDefined();

    // Add details required to activate
    const details = await request(app.getHttpServer())
      .post(`/product/${productId}/details`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Laptop',
        code: `LAP-${Date.now()}`,
        variationType: 'NONE',
        details: {
          category: 'Computers',
          capacity: 512,
          capacityUnit: 'GB',
          capacityType: 'SSD',
          brand: 'Acme',
          series: 'Pro',
        },
        about: ['Fast'],
        description: 'Test product',
      });
    expect(details.status).toBe(201);
    expect(details.body.isSuccess).toBe(true);

    // Activate product (should emit ProductActivatedEvent)
    const activated = await request(app.getHttpServer())
      .post(`/product/${productId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stock: 50 });
    expect(activated.status).toBe(201);
    expect(activated.body.isSuccess).toBe(true);

    // Create another user and assign Merchant role (should emit RoleAssignedEvent)
    const customerRole = await roleRepository.findOne({ where: { id: 1 } });
    const user = userRepository.create({
      email: `user_test_${Date.now()}@example.com`,
      password: 'irrelevant-for-mock-token',
      roles: [customerRole],
    });
    const savedUser = await userRepository.save(user);

    const assigned = await request(app.getHttpServer())
      .post('/role/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: savedUser.id, roleId: 2 });
    expect(assigned.status).toBe(201);
    expect(assigned.body.isSuccess).toBe(true);

    // Verify event log persisted both event types (listeners are async)
    const { types } = await waitForEventTypes(
      [ProductActivatedEvent.eventName, RoleAssignedEvent.eventName],
      3000,
      50,
    );
    expect(types).toContain(ProductActivatedEvent.eventName);
    expect(types).toContain(RoleAssignedEvent.eventName);
  });
});

