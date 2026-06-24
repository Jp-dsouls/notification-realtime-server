import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventsService } from './events.service';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly eventsService: EventsService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    const correlationId = client.handshake.headers['x-correlation-id'] as string;

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'realtime-server',
        context: 'EventsGateway.handleConnection',
        correlationId: correlationId || 'N/A',
        clientId: client.id,
        message: 'Client connected',
      }),
    );

    this.eventsService.addClient(client.id);
  }

  async handleDisconnect(client: Socket) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'realtime-server',
        context: 'EventsGateway.handleDisconnect',
        clientId: client.id,
        message: 'Client disconnected',
      }),
    );

    this.eventsService.removeClient(client.id);
  }

  @SubscribeMessage('subscribe:product')
  async handleSubscribeProduct(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { productId: string; correlationId?: string },
  ) {
    const correlationId = data.correlationId || 'N/A';

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'realtime-server',
        context: 'EventsGateway.handleSubscribeProduct',
        correlationId,
        clientId: client.id,
        productId: data.productId,
        message: 'Client subscribed to product',
      }),
    );

    client.join(`product:${data.productId}`);

    return {
      event: 'subscribed',
      data: { productId: data.productId },
    };
  }

  @SubscribeMessage('unsubscribe:product')
  async handleUnsubscribeProduct(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { productId: string; correlationId?: string },
  ) {
    const correlationId = data.correlationId || 'N/A';

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'realtime-server',
        context: 'EventsGateway.handleUnsubscribeProduct',
        correlationId,
        clientId: client.id,
        productId: data.productId,
        message: 'Client unsubscribed from product',
      }),
    );

    client.leave(`product:${data.productId}`);

    return {
      event: 'unsubscribed',
      data: { productId: data.productId },
    };
  }

  emitNotificationUpdate(data: {
    notificationId: string;
    productId: string;
    channel: string;
    status: string;
    destination: string;
    correlationId: string;
    timestamp: string;
  }) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'realtime-server',
        context: 'EventsGateway.emitNotificationUpdate',
        correlationId: data.correlationId,
        notificationId: data.notificationId,
        productId: data.productId,
        channel: data.channel,
        status: data.status,
        message: 'Emitting notification:update event',
      }),
    );

    this.server.emit('notification:update', data);

    this.server.to(`product:${data.productId}`).emit('notification:update', data);
  }

  emitMetricsUpdate(data: {
    productId?: string;
    channel?: string;
    total: number;
    sent: number;
    failed: number;
    pending: number;
    correlationId: string;
    timestamp: string;
  }) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'realtime-server',
        context: 'EventsGateway.emitMetricsUpdate',
        correlationId: data.correlationId,
        productId: data.productId || 'all',
        channel: data.channel || 'all',
        total: data.total,
        sent: data.sent,
        failed: data.failed,
        pending: data.pending,
        message: 'Emitting metrics:update event',
      }),
    );

    this.server.emit('metrics:update', data);
  }
}
