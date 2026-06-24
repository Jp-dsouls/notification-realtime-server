"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const events_service_1 = require("./events.service");
const config_1 = require("@nestjs/config");
let EventsGateway = class EventsGateway {
    constructor(eventsService, configService) {
        this.eventsService = eventsService;
        this.configService = configService;
    }
    async handleConnection(client) {
        const correlationId = client.handshake.headers['x-correlation-id'];
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            service: 'realtime-server',
            context: 'EventsGateway.handleConnection',
            correlationId: correlationId || 'N/A',
            clientId: client.id,
            message: 'Client connected',
        }));
        this.eventsService.addClient(client.id);
    }
    async handleDisconnect(client) {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            service: 'realtime-server',
            context: 'EventsGateway.handleDisconnect',
            clientId: client.id,
            message: 'Client disconnected',
        }));
        this.eventsService.removeClient(client.id);
    }
    async handleSubscribeProduct(client, data) {
        const correlationId = data.correlationId || 'N/A';
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            service: 'realtime-server',
            context: 'EventsGateway.handleSubscribeProduct',
            correlationId,
            clientId: client.id,
            productId: data.productId,
            message: 'Client subscribed to product',
        }));
        client.join(`product:${data.productId}`);
        return {
            event: 'subscribed',
            data: { productId: data.productId },
        };
    }
    async handleUnsubscribeProduct(client, data) {
        const correlationId = data.correlationId || 'N/A';
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            service: 'realtime-server',
            context: 'EventsGateway.handleUnsubscribeProduct',
            correlationId,
            clientId: client.id,
            productId: data.productId,
            message: 'Client unsubscribed from product',
        }));
        client.leave(`product:${data.productId}`);
        return {
            event: 'unsubscribed',
            data: { productId: data.productId },
        };
    }
    emitNotificationUpdate(data) {
        console.log(JSON.stringify({
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
        }));
        this.server.emit('notification:update', data);
        this.server.to(`product:${data.productId}`).emit('notification:update', data);
    }
    emitMetricsUpdate(data) {
        console.log(JSON.stringify({
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
        }));
        this.server.emit('metrics:update', data);
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe:product'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleSubscribeProduct", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe:product'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleUnsubscribeProduct", null);
exports.EventsGateway = EventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/',
    }),
    __metadata("design:paramtypes", [events_service_1.EventsService,
        config_1.ConfigService])
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map