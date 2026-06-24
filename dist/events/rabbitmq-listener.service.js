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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQListenerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const events_gateway_1 = require("./events.gateway");
const amqplib = require("amqplib");
let RabbitMQListenerService = class RabbitMQListenerService {
    constructor(configService, eventsGateway) {
        this.configService = configService;
        this.eventsGateway = eventsGateway;
        this.connection = null;
        this.channel = null;
    }
    async onModuleInit() {
        await this.connect();
        await this.setupQueues();
        await this.startListening();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async connect() {
        const host = this.configService.get('RABBITMQ_HOST') || 'localhost';
        const port = this.configService.get('RABBITMQ_PORT') || '5672';
        const user = this.configService.get('RABBITMQ_USER') || 'guest';
        const password = this.configService.get('RABBITMQ_PASSWORD') || 'guest';
        const url = `amqp://${user}:${password}@${host}:${port}`;
        try {
            this.connection = await amqplib.connect(url);
            this.channel = await this.connection.createChannel();
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'realtime-server',
                context: 'RabbitMQListenerService',
                message: 'Connected to RabbitMQ',
            }));
        }
        catch (error) {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                service: 'realtime-server',
                context: 'RabbitMQListenerService',
                message: 'Failed to connect to RabbitMQ',
                error: error.message,
            }));
            throw error;
        }
    }
    async setupQueues() {
        const eventsQueue = this.configService.get('RABBITMQ_EVENTS_QUEUE') || 'notification-events';
        if (!this.channel) {
            throw new Error('Channel not initialized');
        }
        await this.channel.assertQueue(eventsQueue, {
            durable: true,
        });
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            service: 'realtime-server',
            context: 'RabbitMQListenerService',
            message: `Queue "${eventsQueue}" setup`,
        }));
    }
    async startListening() {
        const eventsQueue = this.configService.get('RABBITMQ_EVENTS_QUEUE') || 'notification-events';
        if (!this.channel) {
            throw new Error('Channel not initialized');
        }
        await this.channel.consume(eventsQueue, async (message) => {
            if (message) {
                try {
                    const content = JSON.parse(message.content.toString());
                    console.log(JSON.stringify({
                        timestamp: new Date().toISOString(),
                        level: 'INFO',
                        service: 'realtime-server',
                        context: 'RabbitMQListenerService',
                        correlationId: content.correlationId || 'N/A',
                        eventType: content.type,
                        message: 'Event received from RabbitMQ',
                    }));
                    if (content.type === 'notification:update') {
                        this.eventsGateway.emitNotificationUpdate(content.data);
                    }
                    else if (content.type === 'metrics:update') {
                        this.eventsGateway.emitMetricsUpdate(content.data);
                    }
                    this.channel.ack(message);
                }
                catch (error) {
                    console.error(JSON.stringify({
                        timestamp: new Date().toISOString(),
                        level: 'ERROR',
                        service: 'realtime-server',
                        context: 'RabbitMQListenerService',
                        message: 'Failed to process event',
                        error: error.message,
                    }));
                    this.channel.nack(message, false, false);
                }
            }
        }, {
            noAck: false,
        });
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            service: 'realtime-server',
            context: 'RabbitMQListenerService',
            message: `Listening for events on queue "${eventsQueue}"`,
        }));
    }
    async disconnect() {
        if (this.connection) {
            await this.connection.close();
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'realtime-server',
                context: 'RabbitMQListenerService',
                message: 'Disconnected from RabbitMQ',
            }));
        }
    }
};
exports.RabbitMQListenerService = RabbitMQListenerService;
exports.RabbitMQListenerService = RabbitMQListenerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        events_gateway_1.EventsGateway])
], RabbitMQListenerService);
//# sourceMappingURL=rabbitmq-listener.service.js.map