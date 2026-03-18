import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { SeederInterface } from '../seeder.interface';
import { hash } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/database/entities/user.entity';
import { Role } from 'src/database/entities/role.entity';

@Injectable()
export class AdminSeeder implements SeederInterface {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly config: ConfigService,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async seed() {
    const data: Partial<User> = await this.generateData();
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      const userRepo = transactionalEntityManager.getRepository(User);
      
      // Find existing user or create new one
      let adminUser = await userRepo.findOne({
        where: { email: data.email },
        relations: ['roles'],
      });

      if (!adminUser) {
        // Create new user
        adminUser = userRepo.create({
          email: data.email,
          password: data.password,
        });
        adminUser = await userRepo.save(adminUser);
      } else {
        // Update password if changed
        adminUser.password = data.password;
        await userRepo.save(adminUser);
      }

      // Assign all roles
      adminUser.roles = data.roles;
      await userRepo.save(adminUser);
    });
  }

  async generateData(): Promise<Partial<User>> {
    const hashedPassword = await hash(
      this.config.get<string>('adminUser.password'),
      10,
    );
    const adminRoles = await this.rolesRepository.find();
    return {
      email: this.config.get<string>('adminUser.email'),
      password: hashedPassword,
      roles: adminRoles,
    };
  }
}
