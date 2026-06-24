ÉPICA 6: Tiempo Real y Dashboard
HU-6.1: Emisión de Eventos en Tiempo Real

Como servidor WebSocket, quiero emitir eventos cuando una notificación cambia de estado, para que el dashboard se actualice.

Criterios de aceptación:

 Escucha eventos del channel-worker (vía RabbitMQ o Redis Pub/Sub)
 Emite evento notification:update con payload: { product_id, channel, status, timestamp }
 Emite evento metrics:update con contadores actualizados
 Soporta múltiples clientes conectados simultáneamente
 Si un cliente se desconecta, limpia la suscripción