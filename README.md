# Realtime Server

Servidor WebSocket que emite eventos en tiempo real al dashboard cuando las notificaciones cambian de estado.

## Arquitectura

```
Channel Worker → RabbitMQ (notification-events) → Realtime Server → WebSocket → Dashboard
```

## Eventos WebSocket

### Eventos Emitidos por el Servidor

#### `notification:update`

Se emite cuando una notificación cambia de estado.

**Payload:**
```json
{
  "notificationId": "uuid",
  "productId": "uuid",
  "channel": "email|sms|whatsapp",
  "status": "sent|failed|retrying",
  "destination": "destino",
  "correlationId": "uuid",
  "timestamp": "ISO8601"
}
```

#### `metrics:update`

Se emite cuando las métricas cambian.

**Payload:**
```json
{
  "productId": "uuid",
  "channel": "email|sms|whatsapp",
  "total": 100,
  "sent": 95,
  "failed": 3,
  "pending": 2,
  "correlationId": "uuid",
  "timestamp": "ISO8601"
}
```

### Eventos Recibidos del Cliente

#### `subscribe:product`

El cliente se suscribe a eventos de un producto específico.

**Payload:**
```json
{
  "productId": "uuid",
  "correlationId": "uuid"
}
```

**Respuesta:**
```json
{
  "event": "subscribed",
  "data": {
    "productId": "uuid"
  }
}
```

#### `unsubscribe:product`

El cliente se desuscribe de eventos de un producto.

**Payload:**
```json
{
  "productId": "uuid",
  "correlationId": "uuid"
}
```

**Respuesta:**
```json
{
  "event": "unsubscribed",
  "data": {
    "productId": "uuid"
  }
}
```

## Conexión WebSocket

### URL
```
ws://localhost:3002
```

### Headers Opcionales
| Header | Descripción |
|--------|-------------|
| `X-Correlation-ID` | ID de trazabilidad |

### Ejemplo de Conexión (JavaScript)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3002', {
  extraHeaders: {
    'X-Correlation-ID': 'uuid-here'
  }
});

socket.on('connect', () => {
  console.log('Connected');
});

socket.on('notification:update', (data) => {
  console.log('Notification update:', data);
});

socket.on('metrics:update', (data) => {
  console.log('Metrics update:', data);
});

// Suscribirse a un producto
socket.emit('subscribe:product', {
  productId: 'uuid-here',
  correlationId: 'uuid-here'
});
```

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3002` |
| `RABBITMQ_HOST` | Host de RabbitMQ | `localhost` |
| `RABBITMQ_PORT` | Puerto de RabbitMQ | `5672` |
| `RABBITMQ_USER` | Usuario de RabbitMQ | `guest` |
| `RABBITMQ_PASSWORD` | Password de RabbitMQ | `guest` |
| `RABBITMQ_EVENTS_QUEUE` | Cola de eventos | `notification-events` |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:5173` |

## Comandos

```bash
# Desarrollo
npm run start:dev

# Build
npm run build

# Producción
npm run start:prod
```
