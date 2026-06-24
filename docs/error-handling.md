# Manejo de Errores y Trazabilidad - Realtime Server

## Códigos HTTP Utilizados

### Errores del Servidor (5xx)

| Código | Excepción | Cuándo se usa |
|--------|-----------|---------------|
| 500 Internal Server Error | `WebSocketConnectionException` | Fallo en conexión WebSocket |
| 500 Internal Server Error | `EventEmissionException` | Fallo al emitir evento |
| 503 Service Unavailable | `RabbitMQConnectionException` | Fallo al conectar con RabbitMQ |

---

## Formato de Respuesta de Error

```json
{
  "statusCode": 503,
  "error": "Service Unavailable",
  "message": "Failed to connect to RabbitMQ: Connection refused",
  "timestamp": "2026-06-22T10:30:00.000Z",
  "path": "/socket.io/",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Trazabilidad con Correlation ID

### ¿Cómo Funciona?

El `realtime-server` **recibe** eventos del `channel-worker` vía RabbitMQ y los emite a los clientes WebSocket. El correlation ID viene en el evento y se propaga a:

1. **Logs del servidor** - Todos los logs incluyen el correlation ID
2. **Eventos emitidos** - Los clientes reciben el correlation ID en cada evento
3. **Suscripciones** - Los clientes pueden enviar correlation ID al suscribirse

### Flujo de Trazabilidad

```
channel-worker → RabbitMQ → realtime-server → WebSocket → Dashboard
                                                      │
                                              correlationId: abc-123
```

### Recepción de Eventos

```typescript
// Evento recibido de RabbitMQ
{
  "type": "notification:update",
  "data": {
    "notificationId": "660e8400-e29b-41d4-a716-446655440001",
    "productId": "prod-123",
    "channel": "email",
    "status": "sent",
    "destination": "user@example.com",
    "correlationId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-06-22T10:30:00.000Z"
  }
}
```

### Emisión a Clientes

```typescript
// Evento emitido a clientes WebSocket
{
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "productId": "prod-123",
  "channel": "email",
  "status": "sent",
  "destination": "user@example.com",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-06-22T10:30:00.000Z"
}
```

---

## Excepciones Personalizadas

### RabbitMQ

| Excepción | Código | Descripción |
|-----------|--------|-------------|
| `RabbitMQConnectionException` | 503 | Fallo al conectar con RabbitMQ |

### WebSocket

| Excepción | Código | Descripción |
|-----------|--------|-------------|
| `WebSocketConnectionException` | 500 | Fallo en conexión WebSocket |

### Eventos

| Excepción | Código | Descripción |
|-----------|--------|-------------|
| `EventEmissionException` | 500 | Fallo al emitir evento |

---

## Eventos WebSocket

### Eventos Emitidos por el Servidor

| Evento | Descripción | Payload |
|--------|-------------|---------|
| `notification:update` | Notificación cambió de estado | `{ notificationId, productId, channel, status, destination, correlationId, timestamp }` |
| `metrics:update` | Métricas actualizadas | `{ productId, channel, total, sent, failed, pending, correlationId, timestamp }` |

### Eventos Recibidos del Cliente

| Evento | Descripción | Payload |
|--------|-------------|---------|
| `subscribe:product` | Suscribirse a producto | `{ productId, correlationId }` |
| `unsubscribe:product` | Desuscribirse de producto | `{ productId, correlationId }` |

---

## Logs Estructurados

### Conexión de Cliente

```json
{
  "timestamp": "2026-06-22T10:30:00.000Z",
  "level": "INFO",
  "service": "realtime-server",
  "context": "EventsGateway.handleConnection",
  "correlationId": "N/A",
  "clientId": "socket-abc-123",
  "message": "Client connected"
}
```

### Desconexión de Cliente

```json
{
  "timestamp": "2026-06-22T10:30:00.000Z",
  "level": "INFO",
  "service": "realtime-server",
  "context": "EventsGateway.handleDisconnect",
  "clientId": "socket-abc-123",
  "message": "Client disconnected"
}
```

### Suscripción a Producto

```json
{
  "timestamp": "2026-06-22T10:30:00.000Z",
  "level": "INFO",
  "service": "realtime-server",
  "context": "EventsGateway.handleSubscribeProduct",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "clientId": "socket-abc-123",
  "productId": "prod-123",
  "message": "Client subscribed to product"
}
```

### Recepción de Evento de RabbitMQ

```json
{
  "timestamp": "2026-06-22T10:30:00.000Z",
  "level": "INFO",
  "service": "realtime-server",
  "context": "RabbitMQListenerService",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "notification:update",
  "message": "Event received from RabbitMQ"
}
```

### Emisión de Evento

```json
{
  "timestamp": "2026-06-22T10:30:00.000Z",
  "level": "INFO",
  "service": "realtime-server",
  "context": "EventsGateway.emitNotificationUpdate",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "productId": "prod-123",
  "channel": "email",
  "status": "sent",
  "message": "Emitting notification:update event"
}
```

---

## Implementación Técnica

### Gateway WebSocket

```typescript
// src/events/events.gateway.ts
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

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
```

### Listener de RabbitMQ

```typescript
// src/events/rabbitmq-listener.service.ts
@Injectable()
export class RabbitMQListenerService implements OnModuleInit, OnModuleDestroy {
  private async startListening() {
    const eventsQueue = this.configService.get<string>('RABBITMQ_EVENTS_QUEUE') || 'notification-events';

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
  }
}
```

---

## Consultas de Trazabilidad

### Buscar por Correlation ID

```bash
# En logs del realtime-server
grep "550e8400-e29b-41d4-a716-446655440000" logs/realtime-server.json
```

### Buscar por Client ID

```bash
# En logs del realtime-server
grep "socket-abc-123" logs/realtime-server.json
```

### Buscar por Product ID

```bash
# En logs del realtime-server
grep '"productId": "prod-123"' logs/realtime-server.json
```

---

## Ejemplo de Flujo Completo

### 1. Cliente se Conecta

```json
{
  "timestamp": "2026-06-22T10:30:00.000Z",
  "level": "INFO",
  "service": "realtime-server",
  "context": "EventsGateway.handleConnection",
  "clientId": "socket-abc-123",
  "message": "Client connected"
}
```

### 2. Cliente se Suscribe a Producto

```typescript
// Cliente envía
socket.emit('subscribe:product', {
  productId: 'prod-123',
  correlationId: '550e8400-e29b-41d4-a716-446655440000'
});
```

```json
{
  "timestamp": "2026-06-22T10:30:00.000Z",
  "level": "INFO",
  "service": "realtime-server",
  "context": "EventsGateway.handleSubscribeProduct",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "clientId": "socket-abc-123",
  "productId": "prod-123",
  "message": "Client subscribed to product"
}
```

### 3. Evento Recibido de RabbitMQ

```json
{
  "timestamp": "2026-06-22T10:30:00.000Z",
  "level": "INFO",
  "service": "realtime-server",
  "context": "RabbitMQListenerService",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "notification:update",
  "message": "Event received from RabbitMQ"
}
```

### 4. Evento Emitido a Clientes

```json
{
  "timestamp": "2026-06-22T10:30:00.000Z",
  "level": "INFO",
  "service": "realtime-server",
  "context": "EventsGateway.emitNotificationUpdate",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "productId": "prod-123",
  "channel": "email",
  "status": "sent",
  "message": "Emitting notification:update event"
}
```

### 5. Cliente Recibe Evento

```typescript
// Cliente recibe
socket.on('notification:update', (data) => {
  console.log(data);
  // {
  //   notificationId: "660e8400-e29b-41d4-a716-446655440001",
  //   productId: "prod-123",
  //   channel: "email",
  //   status: "sent",
  //   destination: "user@example.com",
  //   correlationId: "550e8400-e29b-41d4-a716-446655440000",
  //   timestamp: "2026-06-22T10:30:00.000Z"
  // }
});
```

---

## Mejores Prácticas

1. **Siempre incluir correlationId** en todos los logs y eventos
2. **Logs estructurados** - Usar JSON para facilitar consultas
3. **Rooms por producto** - Aislar eventos por producto
4. **Graceful shutdown** - Cerrar conexiones correctamente al detener el servicio
5. **Reconexión automática** - Clientes deben reconectarse si se pierde la conexión
6. **Rate limiting** - Considerar limitar eventos por cliente
7. **Heartbeat** - Implementar ping/pong para detectar conexiones muertas
