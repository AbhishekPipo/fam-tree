const { 
  recordHttpMetrics, 
  addSpanAttributes, 
  recordException,
  tracer 
} = require('../config/telemetry');
const opentelemetry = require('@opentelemetry/api');

/**
 * OpenTelemetry Middleware for Express
 * Automatically instruments HTTP requests with tracing and metrics
 */

/**
 * HTTP Request Tracing and Metrics Middleware
 * Records request duration, status codes, and creates spans
 */
const telemetryMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const spanName = `${req.method} ${req.route?.path || req.path}`;
  
  // Create span for this request
  const span = tracer.startSpan(spanName, {
    kind: opentelemetry.SpanKind.SERVER,
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'http.route': req.route?.path || req.path,
      'http.user_agent': req.get('User-Agent') || 'unknown',
      'http.request_content_length': req.get('Content-Length') || 0,
      'user.id': req.user?.id || 'anonymous',
      'user.role': req.user?.role || 'unknown',
    },
  });

  // Set span as active
  const context = opentelemetry.trace.setSpan(opentelemetry.context.active(), span);
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override res.end to capture response data
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const route = req.route?.path || req.path;
    
    // Add response attributes to span
    span.setAttributes({
      'http.status_code': statusCode,
      'http.response_content_length': res.get('Content-Length') || 0,
      'http.response_time_ms': duration,
    });
    
    // Set span status based on HTTP status code
    if (statusCode >= 400) {
      span.setStatus({
        code: opentelemetry.SpanStatusCode.ERROR,
        message: `HTTP ${statusCode}`,
      });
    } else {
      span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
    }
    
    // Record metrics
    recordHttpMetrics(req.method, route, statusCode, duration);
    
    // End span
    span.end();
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  // Handle errors
  res.on('error', (error) => {
    recordException(error);
    span.recordException(error);
    span.setStatus({
      code: opentelemetry.SpanStatusCode.ERROR,
      message: error.message,
    });
  });
  
  // Continue with context
  opentelemetry.context.with(context, () => {
    next();
  });
};

/**
 * Authentication Telemetry Middleware
 * Tracks authentication attempts and user sessions
 */
const authTelemetryMiddleware = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Track authentication events
    if (req.path.includes('/auth/')) {
      const isSuccess = res.statusCode < 400;
      const authType = req.path.split('/').pop(); // login, register, etc.
      
      // Add authentication attributes to span
      addSpanAttributes({
        'auth.type': authType,
        'auth.success': isSuccess,
        'auth.user_id': data.user?.id || 'unknown',
        'auth.phone_number': req.body?.phoneNumber ? 'provided' : 'not_provided',
      });
      
      // Record auth metrics in the auth routes themselves
      // This middleware just adds span attributes
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Database Operation Telemetry Wrapper
 * Wraps database operations with tracing and metrics
 */
const wrapDatabaseOperation = (operationName, collectionName) => {
  return (originalFunction) => {
    return async function(...args) {
      const startTime = Date.now();
      const span = tracer.startSpan(`db.${operationName}`, {
        kind: opentelemetry.SpanKind.CLIENT,
        attributes: {
          'db.system': 'janusgraph',
          'db.operation': operationName,
          'db.collection.name': collectionName,
        },
      });
      
      try {
        const result = await originalFunction.apply(this, args);
        const duration = Date.now() - startTime;
        
        span.setAttributes({
          'db.response_time_ms': duration,
          'db.success': true,
        });
        
        span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
        
        // Record database metrics
        const { recordDatabaseMetrics } = require('../config/telemetry');
        recordDatabaseMetrics(operationName, collectionName, duration, true);
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        span.recordException(error);
        span.setStatus({
          code: opentelemetry.SpanStatusCode.ERROR,
          message: error.message,
        });
        
        // Record database metrics for failed operation
        const { recordDatabaseMetrics } = require('../config/telemetry');
        recordDatabaseMetrics(operationName, collectionName, duration, false);
        
        throw error;
      } finally {
        span.end();
      }
    };
  };
};

/**
 * Error Telemetry Middleware
 * Captures and traces application errors
 */
const errorTelemetryMiddleware = (error, req, res, next) => {
  // Record exception in current span
  recordException(error);
  
  // Add error attributes to span
  addSpanAttributes({
    'error.name': error.name,
    'error.message': error.message,
    'error.stack': error.stack,
    'error.handled': true,
  });
  
  // Continue with normal error handling
  next(error);
};

/**
 * Custom Business Logic Tracer
 * Helper function to trace custom business operations
 */
const traceBusinessOperation = (operationName, attributes = {}) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const span = tracer.startSpan(`business.${operationName}`, {
        attributes: {
          'operation.name': operationName,
          'operation.class': target.constructor.name,
          'operation.method': propertyKey,
          ...attributes,
        },
      });
      
      try {
        const result = await originalMethod.apply(this, args);
        span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.recordException(error);
        span.setStatus({
          code: opentelemetry.SpanStatusCode.ERROR,
          message: error.message,
        });
        throw error;
      } finally {
        span.end();
      }
    };
    
    return descriptor;
  };
};

/**
 * Health Check Telemetry
 * Special handling for health check endpoints
 */
const healthCheckTelemetry = (req, res, next) => {
  if (req.path === '/health' || req.path === '/healthz') {
    // Add health check attributes
    addSpanAttributes({
      'health.check': true,
      'health.endpoint': req.path,
    });
  }
  next();
};

module.exports = {
  telemetryMiddleware,
  authTelemetryMiddleware,
  errorTelemetryMiddleware,
  healthCheckTelemetry,
  wrapDatabaseOperation,
  traceBusinessOperation,
};