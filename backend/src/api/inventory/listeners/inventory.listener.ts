import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ProductActivatedEvent } from 'src/events/product-activated.event';
import { InventoryService } from '../inventory.service';

@Injectable()
export class InventoryListener {
  private readonly logger = new Logger(InventoryListener.name);

  constructor(private readonly inventoryService: InventoryService) {}

  @OnEvent(ProductActivatedEvent.eventName, { async: true })
  async onProductActivated(event: ProductActivatedEvent) {
    this.logger.log(
      `ProductActivatedEvent received for product ${event.productId} with stock ${event.stock}`,
    );

    try {
      await this.inventoryService.createInventoryForProduct(
        event.productId,
        event.stock,
      );
      this.logger.log(
        `Inventory created/updated for product ${event.productId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create inventory for product ${event.productId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
