import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventLog } from './event-log.entity';

@Controller('events')
export class EventLogController {
  constructor(
    @InjectRepository(EventLog)
    private readonly eventLogRepository: Repository<EventLog>,
  ) {}

  @Get()
  async list(@Query('afterId') afterId?: string, @Query('limit') limit?: string) {
    const after = afterId ? Number(afterId) : 0;
    const take = limit ? Math.min(Number(limit) || 50, 200) : 50;

    const qb = this.eventLogRepository
      .createQueryBuilder('e')
      .orderBy('e.id', 'ASC')
      .take(take);

    if (after && Number.isFinite(after)) {
      qb.where('e.id > :after', { after });
    }

    const events = await qb.getMany();
    return { events };
  }
}

