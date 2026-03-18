import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/database/entities/role.entity';
import { AssignRoleDto } from '../dto/role.dto';
import { UserService } from 'src/api/user/services/user.service';
import { errorMessages } from 'src/errors/custom';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RoleAssignedEvent } from 'src/events/role-assigned.event';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) private readonly rolesRepository: Repository<Role>,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async assignRoleToUser(data: AssignRoleDto) {
    const role = await this.findById(data.roleId);
    const user = await this.userService.findById(data.userId, { roles: true });
    if (!user.roles.some((userRole) => userRole.id === data.roleId)) {
      user.roles.push(role);
    }
    const savedUser = await this.userService.save(user);

    this.eventEmitter.emit(
      RoleAssignedEvent.eventName,
      new RoleAssignedEvent(savedUser.id, role.id),
    );

    return savedUser;
  }

  async findById(roleId: number) {
    const role = await this.rolesRepository.findOne({
      where: {
        id: roleId,
      },
    });
    if (!role) {
      throw new NotFoundException(errorMessages.role.notFound);
    }
    return role;
  }
}
