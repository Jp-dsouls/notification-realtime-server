import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
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
export declare class RabbitMQListenerService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly eventsGateway;
    private connection;
    private channel;
    constructor(configService: ConfigService, eventsGateway: EventsGateway);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connect;
    private setupQueues;
    private startListening;
    private disconnect;
}
