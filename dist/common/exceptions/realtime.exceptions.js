"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmissionException = exports.WebSocketConnectionException = exports.RabbitMQConnectionException = void 0;
const common_1 = require("@nestjs/common");
class RabbitMQConnectionException extends common_1.HttpException {
    constructor(error) {
        super({
            statusCode: common_1.HttpStatus.SERVICE_UNAVAILABLE,
            error: 'Service Unavailable',
            message: `Failed to connect to RabbitMQ${error ? `: ${error}` : ''}`,
        }, common_1.HttpStatus.SERVICE_UNAVAILABLE);
    }
}
exports.RabbitMQConnectionException = RabbitMQConnectionException;
class WebSocketConnectionException extends common_1.HttpException {
    constructor(clientId) {
        super({
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
            message: `WebSocket connection failed${clientId ? ` for client "${clientId}"` : ''}`,
        }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
exports.WebSocketConnectionException = WebSocketConnectionException;
class EventEmissionException extends common_1.HttpException {
    constructor(event, error) {
        super({
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
            message: `Failed to emit event "${event}"${error ? `: ${error}` : ''}`,
        }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
exports.EventEmissionException = EventEmissionException;
//# sourceMappingURL=realtime.exceptions.js.map