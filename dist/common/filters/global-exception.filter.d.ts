import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export interface ErrorResponse {
    statusCode: number;
    error: string;
    message: string | string[];
    timestamp: string;
    path: string;
    correlationId: string;
}
export declare class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void;
    private getErrorName;
}
