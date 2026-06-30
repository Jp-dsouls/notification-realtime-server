"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const logger_service_1 = require("./logger/logger.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
    });
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
    const logger = app.get(logger_service_1.LoggerService);
    const port = process.env.PORT || 3002;
    await app.listen(port);
    logger.log(`Realtime server running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map