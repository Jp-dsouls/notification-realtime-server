import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('liveness')
  liveness() {
    return {
      status: 'ok',
      service: process.env.SERVICE_NAME || 'realtime-server',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('readiness')
  readiness() {
    return {
      status: 'ok',
      service: process.env.SERVICE_NAME || 'realtime-server',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  check() {
    return {
      status: 'ok',
      service: process.env.SERVICE_NAME || 'realtime-server',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
