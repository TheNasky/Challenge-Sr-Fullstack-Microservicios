import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventLog } from './event-log.entity';

@Injectable()
export class EventLogService {
  constructor(
    @InjectRepository(EventLog)
    private readonly eventLogRepository: Repository<EventLog>,
  ) {}

  async append(type: string, payload: Record<string, unknown>) {
    const log = this.eventLogRepository.create({ type, payload });
    return this.eventLogRepository.save(log);
  }
}

