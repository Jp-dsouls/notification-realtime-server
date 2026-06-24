import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
import * as amqplib from 'amqplib';

export interface NotificationEvent {
  notificationId: string;
  productId: string;
  channel: string;
  status: string;
  destination: string;
  correlationId: string;
  timestamp: string;
}

export interface MetricsEvent {
  productId?: string;
  channel?: string;
  total: number;
  sent: number;
  failed: number;
  pending: number;
  correlationId: string;
  timestamp: string;
}

@Injectable()
export class RabbitMQListenerService implements OnModuleInit, OnModuleDestroy {
  private connection: any = null;
  private channel: any = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.setupQueues();
    await this.startListening();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    const host = this.configService.get<string>('RABBITMQ_HOST') || 'localhost';
    const port = this.configService.get<string>('RABBITMQ_PORT') || '5672';
    const user = this.configService.get<string>('RABBITMQ_USER') || 'guest';
    const password = this.configService.get<string>('RABBITMQ_PASSWORD') || 'guest';

    const url = `amqp://${user}:${password}@${host}:${port}`;

    try {
      this.connection = await amqplib.connect(url);
      this.channel = await this.connection.createChannel();

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'realtime-server',
          context: 'RabbitMQListenerService',
          message: 'Connected to RabbitMQ',
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          service: 'realtime-server',
          context: 'RabbitMQListenerService',
          message: 'Failed to connect to RabbitMQ',
          error: error.message,
        }),
      );
      throw error;
    }
  }

  private async setupQueues() {
    const eventsQueue = this.configService.get<string>('RABBITMQ_EVENTS_QUEUE') || 'notification-events';

    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.assertQueue(eventsQueue, {
      durable: true,
    });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'realtime-server',
        context: 'RabbitMQListenerService',
        message: `Queue "${eventsQueue}" setup`,
      }),
    );
  }

  private async startListening() {
    const eventsQueue = this.configService.get<string>('RABBITMQ_EVENTS_QUEUE') || 'notification-events';

    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.consume(
      eventsQueue,
      async (message: any) => {
        if (message) {
          try {
            const content = JSON.parse(message.content.toString());

            console.log(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'realtime-server',
                context: 'RabbitMQListenerService',
                correlationId: content.correlationId || 'N/A',
                eventType: content.type,
                message: 'Event received from RabbitMQ',
              }),
            );

            if (content.type === 'notification:update') {
              this.eventsGateway.emitNotificationUpdate(content.data);
            } else if (content.type === 'metrics:update') {
              this.eventsGateway.emitMetricsUpdate(content.data);
            }

            this.channel.ack(message);
          } catch (error) {
            console.error(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                service: 'realtime-server',
                context: 'RabbitMQListenerService',
                message: 'Failed to process event',
                error: error.message,
              }),
            );

            this.channel.nack(message, false, false);
          }
        }
      },
      {
        noAck: false,
      },
    );

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'realtime-server',
        context: 'RabbitMQListenerService',
        message: `Listening for events on queue "${eventsQueue}"`,
      }),
    );
  }

  private async disconnect() {
    if (this.connection) {
      await this.connection.close();
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'realtime-server',
          context: 'RabbitMQListenerService',
          message: 'Disconnected from RabbitMQ',
        }),
      );
    }
  }
}
