export class ProductActivatedEvent {
  static readonly eventName = 'product.activated';

  constructor(
    public readonly productId: number,
    public readonly merchantId: number,
    public readonly stock: number,
    public readonly activatedAt: Date = new Date(),
  ) {}
}

