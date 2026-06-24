import { HttpException } from '@nestjs/common';
export declare class RabbitMQConnectionException extends HttpException {
    constructor(error?: string);
}
export declare class WebSocketConnectionException extends HttpException {
    constructor(clientId?: string);
}
export declare class EventEmissionException extends HttpException {
    constructor(event: string, error?: string);
}
