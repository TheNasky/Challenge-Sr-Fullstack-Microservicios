import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto, ProductDetailsDto } from '../dto/product.dto';
import { Category } from '../../../database/entities/category.entity';
import { Product } from 'src/database/entities/product.entity';
import { errorMessages } from 'src/errors/custom';
import { validate } from 'class-validator';
import { successObject } from 'src/common/helper/sucess-response.interceptor';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductActivatedEvent } from 'src/events/product-activated.event';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getProduct(productId: number) {
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
      },
    });

    if (!product) throw new NotFoundException(errorMessages.product.notFound);

    return product;
  }

  async createProduct(data: CreateProductDto, merchantId: number) {
    const category = await this.categoryRepository.findOne({
      where: {
        id: data.categoryId,
      },
    });

    if (!category) throw new NotFoundException(errorMessages.category.notFound);

    const product = this.productRepository.create({
      category,
      merchantId,
    });

    return this.productRepository.save(product);
  }

  async addProductDetails(
    productId: number,
    body: ProductDetailsDto,
    merchantId: number,
  ) {
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
        merchantId,
      },
    });

    if (!product)
      throw new NotFoundException(errorMessages.product.notFound);

    Object.assign(product, body);
    const savedProduct = await this.productRepository.save(product);

    return { id: savedProduct.id };
  }

  async activateProduct(productId: number, merchantId: number, stock: number) {
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
        merchantId,
      },
    });

    if (!product)
      throw new NotFoundException(errorMessages.product.notFound);

    if (!(await this.validate(productId)))
      throw new ConflictException(errorMessages.product.notFulfilled);

    product.isActive = true;
    const savedProduct = await this.productRepository.save(product);

    this.eventEmitter.emit(
      ProductActivatedEvent.eventName,
      new ProductActivatedEvent(savedProduct.id, merchantId, stock),
    );

    return { id: savedProduct.id, isActive: savedProduct.isActive };
  }

  async validate(productId: number) {
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
      },
    });
    if (!product) throw new NotFoundException(errorMessages.product.notFound);
    const errors = await validate(product);

    if (errors.length > 0) return false;

    return true;
  }

  async deleteProduct(productId: number, merchantId: number) {
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
        merchantId,
      },
    });

    if (!product)
      throw new NotFoundException(errorMessages.product.notFound);

    await this.productRepository.remove(product);

    return successObject;
  }
}
