import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from 'src/database/entities/inventory.entity';
import { ProductVariation } from 'src/database/entities/productVariation.entity';
import { Country } from 'src/database/entities/country.entity';
import { Size } from 'src/database/entities/size.entity';
import { Color } from 'src/database/entities/color.entity';
import { InventoryService } from './inventory.service';
import { InventoryListener } from './listeners/inventory.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventory,
      ProductVariation,
      Country,
      Size,
      Color,
    ]),
  ],
  providers: [InventoryService, InventoryListener],
  exports: [InventoryService],
})
export class InventoryModule {}
