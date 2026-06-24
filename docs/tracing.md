# Trazabilidad - Realtime Server

## Visión General

El `realtime-server` **recibe** eventos del `channel-worker` vía RabbitMQ y los emite a los clientes WebSocket. El correlation ID viene en el evento y se propaga a todos los logs y eventos emitidos.

## Flujo de Trazabilidad

```
───────────────┐     ──────────────┐     ┌──────────────────┐     ┌──────────
│ channel-worker│────▶│   RabbitMQ   │────▶│ realtime-server  │────▶│ Dashboard│
└───────────────┘     └──────────────┘     └──────────────────┘     └──────────┘
                                                    │
                                            correlationId: abc-123
                                                    │
                                                    ▼
                                            WebSocket Events
                                                    │
                                                    ▼
                                              Client Logs
```

## Recepción del Correlation ID

El realtime-server recibe el correlation ID dentro del mensaje de RabbitMQ:

```typescript
// Mensaje de RabbitMQ
{
  "type": "notification:update",
  "data": {
    "notificationId": "660e8400-e29b-41d4-a716-446655440001",
    "productId": "prod-123",
    "channel": "email",
    "status": "sent",
    "destination": "user@example.com",
    "correlationId": "550e8400-e29b-41d4-a716-446655440000",  // ← Del channel-worker
    "timestamp": "2026-06-22T10:30:00.000Z"
  }
}
```

## Implementación

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

## Campos del Log

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `timestamp` | ISO 8601 | Fecha y hora del evento |
| `level` | string | INFO, ERROR, WARN, DEBUG |
| `service` | string | Nombre del microservicio (realtime-server) |
| `context` | string | Clase/método que genera el log |
| `correlationId` | UUID | ID de trazabilidad (recibido del evento) |
| `clientId` | string | ID del cliente WebSocket |
| `productId` | string | ID del producto (si aplica) |
| `eventType` | string | Tipo de evento recibido |
| `notificationId` | UUID | ID único de la notificación |
| `channel` | string | Canal (email, sms, whatsapp) |
| `status` | string | Estado de la notificación |
| `message` | string | Descripción del evento |

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

## Herramientas de Producción

### Kibana / Elasticsearch

```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "service": "realtime-server" } },
        { "match": { "correlationId": "550e8400-e29b-41d4-a716-446655440000" } }
      ]
    }
  }
}
```

### Datadog

```
service:realtime-server correlationId:550e8400-e29b-41d4-a716-446655440000
```

### Grafana Loki

```
{service="realtime-server"} |~ "550e8400-e29b-41d4-a716-446655440000"
```

## Diferencia entre IDs

| ID | Scope | Ejemplo de Uso |
|----|-------|----------------|
| `correlationId` | Flujo completo | Trazar operación de inicio a fin |
| `clientId` | Cliente WebSocket | Identificar cliente conectado |
| `notificationId` | Notificación específica | Identificar una notificación única |
| `productId` | Producto | Filtrar eventos por producto |

### Ejemplo de Relación

```json
{
  "correlationId": "abc-123",
  "clientId": "socket-xyz-789",
  "notificationId": "notif-456",
  "productId": "prod-789"
}
```

- **correlationId**: Sigue el flujo completo (gateway → api → worker → realtime → dashboard)
- **clientId**: Identifica este cliente WebSocket específico
- **notificationId**: Identifica esta notificación específica
- **productId**: Indica qué producto está siendo monitoreado

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

## Mejores Prácticas

1. **Siempre incluir correlationId** en todos los logs y eventos
2. **Logs estructurados** - Usar JSON para facilitar consultas
3. **Rooms por producto** - Aislar eventos por producto
4. **Graceful shutdown** - Cerrar conexiones correctamente al detener el servicio
5. **Reconexión automática** - Clientes deben reconectarse si se pierde la conexión
6. **Rate limiting** - Considerar limitar eventos por cliente
7. **Heartbeat** - Implementar ping/pong para detectar conexiones muertas
