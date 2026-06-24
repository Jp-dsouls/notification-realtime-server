import { HttpException, HttpStatus } from '@nestjs/common';

export class RabbitMQConnectionException extends HttpException {
  constructor(error?: string) {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'Service Unavailable',
        message: `Failed to connect to RabbitMQ${error ? `: ${error}` : ''}`,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class WebSocketConnectionException extends HttpException {
  constructor(clientId?: string) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: `WebSocket connection failed${clientId ? ` for client "${clientId}"` : ''}`,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class EventEmissionException extends HttpException {
  constructor(event: string, error?: string) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: `Failed to emit event "${event}"${error ? `: ${error}` : ''}`,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
