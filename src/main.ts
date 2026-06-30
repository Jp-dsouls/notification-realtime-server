import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  const logger = app.get(LoggerService);
  const port = process.env.PORT || 3002;
  await app.listen(port);
  logger.log(`Realtime server running on port ${port}`);
}

bootstrap();
