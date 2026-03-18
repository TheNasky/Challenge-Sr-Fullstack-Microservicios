import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventLog } from './event-log.entity';
import { EventLogService } from './event-log.service';
import { DomainEventsListener } from './listeners/domain-events.listener';
import { EventLogController } from './event-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EventLog])],
  controllers: [EventLogController],
  providers: [EventLogService, DomainEventsListener],
  exports: [EventLogService],
})
export class EventLogModule {}

