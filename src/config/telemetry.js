const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_SERVICE_NAMESPACE, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } = require('@opentelemetry/semantic-conventions');
const opentelemetry = require('@opentelemetry/api');

/**
 * OpenTelemetry Configuration for Family Tree API
 * Provides comprehensive observability with tracing, metrics, and logging
 */

// Service information
const SERVICE_NAME = 'family-tree-api';
const SERVICE_VERSION = process.env.npm_package_version || '1.0.0';
const SERVICE_NAMESPACE = 'family-tree';

// Environment configuration
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const JAEGER_ENDPOINT = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces';
const PROMETHEUS_PORT = parseInt(process.env.PROMETHEUS_PORT) || 9090;
const ENABLE_TRACING = process.env.ENABLE_TRACING !== 'false';
const ENABLE_METRICS = process.env.ENABLE_METRICS !== 'false';

// Create resource with service information
const resource = resourceFromAttributes({
  [SEMRESATTRS_SERVICE_NAME]: SERVICE_NAME,
  [SEMRESATTRS_SERVICE_VERSION]: SERVICE_VERSION,
  [SEMRESATTRS_SERVICE_NAMESPACE]: SERVICE_NAMESPACE,
  [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: ENVIRONMENT,
});

// Configure exporters
const exporters = [];

// Jaeger Tracing Exporter
if (ENABLE_TRACING) {
  const jaegerExporter = new JaegerExporter({
    endpoint: JAEGER_ENDPOINT,
  });
  exporters.push(jaegerExporter);
  console.log(`📊 OpenTelemetry: Jaeger tracing enabled - ${JAEGER_ENDPOINT}`);
}

// Prometheus Metrics Exporter
let prometheusExporter;
if (ENABLE_METRICS) {
  prometheusExporter = new PrometheusExporter({
    port: PROMETHEUS_PORT,
    endpoint: '/metrics',
  }, () => {
    console.log(`📈 OpenTelemetry: Prometheus metrics available at http://localhost:${PROMETHEUS_PORT}/metrics`);
  });
}

// Configure instrumentations
const instrumentations = getNodeAutoInstrumentations({
  // Disable some instrumentations if needed
  '@opentelemetry/instrumentation-fs': {
    enabled: false, // Disable file system instrumentation to reduce noise
  },
  '@opentelemetry/instrumentation-http': {
    enabled: true,
    requestHook: (span, request) => {
      // Add custom attributes to HTTP spans
      span.setAttributes({
        'http.request.body.size': request.headers['content-length'] || 0,
        'http.user_agent': request.headers['user-agent'] || 'unknown',
      });
    },
    responseHook: (span, response) => {
      // Add response attributes
      span.setAttributes({
        'http.response.body.size': response.headers['content-length'] || 0,
      });
    },
  },
  '@opentelemetry/instrumentation-express': {
    enabled: true,
    requestHook: (span, info) => {
      // Add Express-specific attributes
      span.setAttributes({
        'express.route': info.route || 'unknown',
        'express.method': info.request.method,
      });
    },
  },
});

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  resource,
  traceExporter: exporters.length > 0 ? exporters[0] : undefined,
  metricReader: prometheusExporter,
  instrumentations,
});

// Custom tracer for application-specific spans
const tracer = opentelemetry.trace.getTracer(SERVICE_NAME, SERVICE_VERSION);

// Custom meter for application-specific metrics
const meter = opentelemetry.metrics.getMeter(SERVICE_NAME, SERVICE_VERSION);

// Custom metrics
const httpRequestDuration = meter.createHistogram('http_request_duration_ms', {
  description: 'Duration of HTTP requests in milliseconds',
  unit: 'ms',
});

const httpRequestCount = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
});

const authenticationAttempts = meter.createCounter('auth_attempts_total', {
  description: 'Total number of authentication attempts',
});

const authenticationFailures = meter.createCounter('auth_failures_total', {
  description: 'Total number of authentication failures',
});

const databaseOperations = meter.createHistogram('database_operation_duration_ms', {
  description: 'Duration of database operations in milliseconds',
  unit: 'ms',
});

const activeUsers = meter.createUpDownCounter('active_users', {
  description: 'Number of currently active users',
});

/**
 * Initialize OpenTelemetry
 */
function initializeTelemetry() {
  try {
    sdk.start();
    console.log('🔍 OpenTelemetry initialized successfully');
    console.log(`📋 Service: ${SERVICE_NAME} v${SERVICE_VERSION}`);
    console.log(`🌍 Environment: ${ENVIRONMENT}`);
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => console.log('🔍 OpenTelemetry terminated'))
        .catch((error) => console.log('❌ Error terminating OpenTelemetry', error))
        .finally(() => process.exit(0));
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize OpenTelemetry:', error);
    return false;
  }
}

/**
 * Create a custom span for business logic
 * @param {string} name - Span name
 * @param {Function} fn - Function to execute within the span
 * @param {Object} attributes - Additional span attributes
 */
async function createSpan(name, fn, attributes = {}) {
  const span = tracer.startSpan(name, {
    attributes: {
      'service.name': SERVICE_NAME,
      ...attributes,
    },
  });

  try {
    const result = await fn(span);
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
}

/**
 * Record HTTP request metrics
 * @param {string} method - HTTP method
 * @param {string} route - Route path
 * @param {number} statusCode - HTTP status code
 * @param {number} duration - Request duration in ms
 */
function recordHttpMetrics(method, route, statusCode, duration) {
  const labels = {
    method,
    route,
    status_code: statusCode.toString(),
  };

  httpRequestCount.add(1, labels);
  httpRequestDuration.record(duration, labels);
}

/**
 * Record authentication metrics
 * @param {string} type - Authentication type (login, register, etc.)
 * @param {boolean} success - Whether authentication was successful
 * @param {string} reason - Failure reason (if applicable)
 */
function recordAuthMetrics(type, success, reason = null) {
  const labels = { type };
  
  authenticationAttempts.add(1, labels);
  
  if (!success) {
    authenticationFailures.add(1, {
      ...labels,
      reason: reason || 'unknown',
    });
  }
}

/**
 * Record database operation metrics
 * @param {string} operation - Database operation type
 * @param {string} collection - Collection/table name
 * @param {number} duration - Operation duration in ms
 * @param {boolean} success - Whether operation was successful
 */
function recordDatabaseMetrics(operation, collection, duration, success) {
  const labels = {
    operation,
    collection,
    success: success.toString(),
  };

  databaseOperations.record(duration, labels);
}

/**
 * Update active users count
 * @param {number} delta - Change in active users (+1 for login, -1 for logout)
 */
function updateActiveUsers(delta) {
  activeUsers.add(delta);
}

/**
 * Add custom attributes to current span
 * @param {Object} attributes - Attributes to add
 */
function addSpanAttributes(attributes) {
  const span = opentelemetry.trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

/**
 * Record an exception in the current span
 * @param {Error} error - Error to record
 */
function recordException(error) {
  const span = opentelemetry.trace.getActiveSpan();
  if (span) {
    span.recordException(error);
    span.setStatus({
      code: opentelemetry.SpanStatusCode.ERROR,
      message: error.message,
    });
  }
}

module.exports = {
  initializeTelemetry,
  createSpan,
  recordHttpMetrics,
  recordAuthMetrics,
  recordDatabaseMetrics,
  updateActiveUsers,
  addSpanAttributes,
  recordException,
  tracer,
  meter,
  SERVICE_NAME,
  SERVICE_VERSION,
};