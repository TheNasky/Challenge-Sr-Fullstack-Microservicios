import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from 'src/database/entities/inventory.entity';
import { ProductVariation } from 'src/database/entities/productVariation.entity';
import { Country, CountryCodes } from 'src/database/entities/country.entity';
import { Size } from 'src/database/entities/size.entity';
import { Color } from 'src/database/entities/color.entity';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(ProductVariation)
    private readonly productVariationRepository: Repository<ProductVariation>,
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,
    @InjectRepository(Color)
    private readonly colorRepository: Repository<Color>,
  ) {}

  async createInventoryForProduct(
    productId: number,
    stock: number,
  ): Promise<Inventory> {
    // Get or create default ProductVariation for this product
    let productVariation = await this.productVariationRepository.findOne({
      where: { productId },
    });

    if (!productVariation) {
      // Get first available size and color (for simplicity - using 'NA' as default)
      const defaultSize = await this.sizeRepository.findOne({
        where: { code: 'NA' },
      });
      const defaultColor = await this.colorRepository.findOne({
        where: { name: 'NA' },
      });

      if (!defaultSize || !defaultColor) {
        throw new Error('Default Size or Color (NA) not found. Please run seeders.');
      }

      // Create a default variation
      productVariation = this.productVariationRepository.create({
        productId,
        sizeCode: defaultSize.code,
        colorName: defaultColor.name,
        imageUrls: [],
      });
      productVariation = await this.productVariationRepository.save(
        productVariation,
      );
      this.logger.log(
        `Created default ProductVariation for product ${productId}`,
      );
    }

    // Get default country (Egypt - EG)
    const country = await this.countryRepository.findOne({
      where: { code: CountryCodes.Egypt },
    });

    if (!country) {
      throw new Error('Default country (EG) not found. Please run seeders.');
    }

    // Check if inventory already exists for this variation and country
    let inventory = await this.inventoryRepository.findOne({
      where: {
        productVariationId: productVariation.id,
        countryCode: country.code,
      },
    });

    if (inventory) {
      // Update existing inventory
      inventory.quantity = stock;
      inventory = await this.inventoryRepository.save(inventory);
      this.logger.log(
        `Updated inventory for product ${productId}: ${stock} units`,
      );
    } else {
      // Create new inventory
      inventory = this.inventoryRepository.create({
        productVariationId: productVariation.id,
        countryCode: country.code,
        quantity: stock,
      });
      inventory = await this.inventoryRepository.save(inventory);
      this.logger.log(
        `Created inventory for product ${productId}: ${stock} units`,
      );
    }

    return inventory;
  }
}
