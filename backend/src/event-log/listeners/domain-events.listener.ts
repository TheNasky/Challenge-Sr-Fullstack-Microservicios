import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventLogService } from '../event-log.service';
import { ProductActivatedEvent } from '../../events/product-activated.event';
import { RoleAssignedEvent } from '../../events/role-assigned.event';

@Injectable()
export class DomainEventsListener {
  constructor(private readonly eventLogService: EventLogService) {}

  @OnEvent(ProductActivatedEvent.eventName, { async: true })
  async onProductActivated(event: ProductActivatedEvent) {
    await this.eventLogService.append(ProductActivatedEvent.eventName, {
      productId: event.productId,
      merchantId: event.merchantId,
      stock: event.stock,
      activatedAt: event.activatedAt.toISOString(),
    });
  }

  @OnEvent(RoleAssignedEvent.eventName, { async: true })
  async onRoleAssigned(event: RoleAssignedEvent) {
    await this.eventLogService.append(RoleAssignedEvent.eventName, {
      userId: event.userId,
      roleId: event.roleId,
      assignedByUserId: event.assignedByUserId ?? null,
      assignedAt: event.assignedAt.toISOString(),
    });
  }
}

