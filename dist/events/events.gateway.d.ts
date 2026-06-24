import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventsService } from './events.service';
import { ConfigService } from '@nestjs/config';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly eventsService;
    private readonly configService;
    server: Server;
    constructor(eventsService: EventsService, configService: ConfigService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleSubscribeProduct(client: Socket, data: {
        productId: string;
        correlationId?: string;
    }): Promise<{
        event: string;
        data: {
            productId: string;
        };
    }>;
    handleUnsubscribeProduct(client: Socket, data: {
        productId: string;
        correlationId?: string;
    }): Promise<{
        event: string;
        data: {
            productId: string;
        };
    }>;
    emitNotificationUpdate(data: {
        notificationId: string;
        productId: string;
        channel: string;
        status: string;
        destination: string;
        correlationId: string;
        timestamp: string;
    }): void;
    emitMetricsUpdate(data: {
        productId?: string;
        channel?: string;
        total: number;
        sent: number;
        failed: number;
        pending: number;
        correlationId: string;
        timestamp: string;
    }): void;
}
