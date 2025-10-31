/**
 * Enhanced Error Handling for CrossTrails API
 * Provides structured error responses, logging, and monitoring
 */

import { NextResponse } from 'next/server';

export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_CROSS_REFERENCE = 'INVALID_CROSS_REFERENCE',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_TEMPLATE = 'INVALID_TEMPLATE',
  INVALID_PROVIDER = 'INVALID_PROVIDER',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  LLM_PROVIDER_ERROR = 'LLM_PROVIDER_ERROR',
  NLT_API_ERROR = 'NLT_API_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',

  // Service specific
  PROMPT_GENERATION_ERROR = 'PROMPT_GENERATION_ERROR',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  STREAMING_ERROR = 'STREAMING_ERROR',
}

export interface APIError {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: string;
  request_id?: string;
  suggestion?: string;
}

export interface ErrorContext {
  endpoint: string;
  method: string;
  user_agent?: string;
  request_id: string;
  request_body?: any;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCounts = new Map<ErrorCode, number>();

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and format API errors
   */
  handleError(error: unknown, context: ErrorContext): NextResponse {
    const requestId = context.request_id || this.generateRequestId();
    let apiError: APIError;
    let statusCode: number;

    // Classify and format the error
    if (error instanceof APIException) {
      apiError = {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
        request_id: requestId,
        suggestion: error.suggestion,
      };
      statusCode = error.statusCode;
    } else if (error instanceof Error) {
      const classified = this.classifyError(error);
      apiError = {
        code: classified.code,
        message: classified.message,
        details: { original_message: error.message, stack: error.stack },
        timestamp: new Date().toISOString(),
        request_id: requestId,
        suggestion: classified.suggestion,
      };
      statusCode = classified.statusCode;
    } else {
      // Unknown error type
      apiError = {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        details: { error: String(error) },
        timestamp: new Date().toISOString(),
        request_id: requestId,
        suggestion:
          'Please try again later or contact support if the issue persists',
      };
      statusCode = 500;
    }

    // Log the error
    this.logError(apiError, context, error);

    // Track error frequency
    this.trackError(apiError.code);

    return NextResponse.json(
      {
        success: false,
        error: apiError,
      },
      { status: statusCode }
    );
  }

  /**
   * Create validation error
   */
  createValidationError(
    field: string,
    message: string,
    details?: any
  ): APIException {
    return new APIException(
      ErrorCode.VALIDATION_ERROR,
      `Validation failed for field '${field}': ${message}`,
      400,
      details,
      `Please check the '${field}' parameter and ensure it meets the required format`
    );
  }

  /**
   * Create LLM provider error
   */
  createLLMError(provider: string, originalError: string): APIException {
    return new APIException(
      ErrorCode.LLM_PROVIDER_ERROR,
      `LLM provider '${provider}' failed: ${originalError}`,
      503,
      { provider, original_error: originalError },
      'Try using a different LLM provider or check if the service is available'
    );
  }

  /**
   * Create timeout error
   */
  createTimeoutError(operation: string, timeout: number): APIException {
    return new APIException(
      ErrorCode.TIMEOUT_ERROR,
      `Operation '${operation}' timed out after ${timeout}ms`,
      408,
      { operation, timeout_ms: timeout },
      'Try reducing the complexity of your request or increase the timeout'
    );
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { [key: string]: number } {
    return Object.fromEntries(this.errorCounts);
  }

  private classifyError(error: Error): {
    code: ErrorCode;
    message: string;
    statusCode: number;
    suggestion?: string;
  } {
    const message = error.message.toLowerCase();

    // NLT API errors
    if (message.includes('nlt') || message.includes('bible api')) {
      return {
        code: ErrorCode.NLT_API_ERROR,
        message: 'Bible API service is currently unavailable',
        statusCode: 503,
        suggestion:
          'The Bible text service is temporarily unavailable. Please try again in a few minutes.',
      };
    }

    // Authentication errors
    if (
      message.includes('authentication') ||
      message.includes('unauthorized') ||
      message.includes('token')
    ) {
      return {
        code: ErrorCode.AUTHENTICATION_ERROR,
        message: 'Authentication failed',
        statusCode: 401,
        suggestion: 'Please check your API credentials and try again',
      };
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return {
        code: ErrorCode.TIMEOUT_ERROR,
        message: 'Request timed out',
        statusCode: 408,
        suggestion:
          'The request took too long to complete. Try simplifying your request or try again later.',
      };
    }

    // Rate limiting
    if (
      message.includes('rate limit') ||
      message.includes('too many requests')
    ) {
      return {
        code: ErrorCode.RATE_LIMIT_ERROR,
        message: 'Rate limit exceeded',
        statusCode: 429,
        suggestion:
          'You have made too many requests. Please wait before making additional requests.',
      };
    }

    // Validation errors
    if (
      message.includes('invalid') ||
      message.includes('validation') ||
      message.includes('required')
    ) {
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid request parameters',
        statusCode: 400,
        suggestion:
          'Please check your request parameters and ensure they are valid',
      };
    }

    // Default to internal error
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
      statusCode: 500,
      suggestion:
        'An unexpected error occurred. Please try again later or contact support.',
    };
  }

  private logError(
    error: APIError,
    context: ErrorContext,
    originalError: unknown
  ): void {
    // In production, this would integrate with a logging service like Winston, Sentry, etc.
    console.error('API Error:', {
      ...error,
      context,
      original_error:
        originalError instanceof Error
          ? {
              name: originalError.name,
              message: originalError.message,
              stack: originalError.stack,
            }
          : originalError,
    });
  }

  private trackError(code: ErrorCode): void {
    this.errorCounts.set(code, (this.errorCounts.get(code) || 0) + 1);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Custom API Exception class for structured error handling
 */
export class APIException extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number,
    public details?: any,
    public suggestion?: string
  ) {
    super(message);
    this.name = 'APIException';
  }
}

/**
 * Async error wrapper for API route handlers
 */
export function withErrorHandling(
  handler: (request: Request, context: { params: any }) => Promise<NextResponse>
) {
  return async (
    request: Request,
    context: { params: any }
  ): Promise<NextResponse> => {
    const errorHandler = ErrorHandler.getInstance();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      return await handler(request, context);
    } catch (error) {
      const errorContext: ErrorContext = {
        endpoint: new URL(request.url).pathname,
        method: request.method,
        user_agent: request.headers.get('user-agent') || undefined,
        request_id: requestId,
      };

      return errorHandler.handleError(error, errorContext);
    }
  };
}

/**
 * Validation helper functions
 */
export const validate = {
  required: (value: any, fieldName: string): void => {
    if (value === undefined || value === null || value === '') {
      throw ErrorHandler.getInstance().createValidationError(
        fieldName,
        'This field is required'
      );
    }
  },

  crossReference: (crossRef: any): void => {
    const required = ['reference', 'anchor_ref', 'connection'];
    for (const field of required) {
      if (!crossRef[field]) {
        throw new APIException(
          ErrorCode.INVALID_CROSS_REFERENCE,
          `Invalid cross-reference: missing '${field}' field`,
          400,
          { missing_field: field },
          `Ensure the cross-reference object includes all required fields: ${required.join(', ')}`
        );
      }
    }
  },

  template: (template: string): void => {
    const validTemplates = ['default', 'study', 'devotional', 'academic'];
    if (!validTemplates.includes(template)) {
      throw new APIException(
        ErrorCode.INVALID_TEMPLATE,
        `Invalid template '${template}'`,
        400,
        { valid_templates: validTemplates },
        `Use one of the supported templates: ${validTemplates.join(', ')}`
      );
    }
  },

  provider: (provider: string): void => {
    const validProviders = ['gloo', 'openai', 'anthropic'];
    if (!validProviders.includes(provider)) {
      throw new APIException(
        ErrorCode.INVALID_PROVIDER,
        `Invalid provider '${provider}'`,
        400,
        { valid_providers: validProviders },
        `Use one of the supported providers: ${validProviders.join(', ')}`
      );
    }
  },
};

export default ErrorHandler.getInstance();
