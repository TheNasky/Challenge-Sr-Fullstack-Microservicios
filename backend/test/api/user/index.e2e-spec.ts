import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { generateMockToken } from 'test/mocks/jwt';
import { User } from 'src/database/entities/user.entity';
import { Product } from 'src/database/entities/product.entity';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  const user = {
    email: 'testy@test.com',
    password: 'password',
  };
  let currentUser: User;
  let userRepository: Repository<User>;
  let productRepository: Repository<Product>;
  let token: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get('UserRepository');
    productRepository = moduleFixture.get('ProductRepository');

    // Cleanup order matters (inventory -> variation -> product -> user) due to FKs
    await moduleFixture.get('InventoryRepository').delete({});
    await moduleFixture.get('ProductVariationRepository').delete({});
    await productRepository.delete({});
    await userRepository.delete({});
    currentUser = await userRepository.create(user);
    currentUser = await userRepository.save(currentUser);
    token = await generateMockToken(moduleFixture, currentUser);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/user/profile (GET)', () => {
    it('should success', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(user);
      expect(response.body.isSuccess).toBe(true);
    });
  });
});
