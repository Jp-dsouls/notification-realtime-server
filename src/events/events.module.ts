import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';
import { RabbitMQListenerService } from './rabbitmq-listener.service';

@Module({
  providers: [EventsGateway, EventsService, RabbitMQListenerService],
})
export class EventsModule {}
