# OpenTelemetry Setup Guide

## 🔍 Overview

This guide explains the comprehensive OpenTelemetry (OTel) observability setup for the Family Tree API. OpenTelemetry provides distributed tracing, metrics collection, and logging to help monitor, debug, and optimize your application.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Family Tree   │───▶│  OpenTelemetry   │───▶│     Jaeger      │
│      API        │    │      SDK         │    │   (Tracing)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Prometheus    │───▶│    Grafana      │
                       │   (Metrics)     │    │ (Visualization) │
                       └─────────────────┘    └─────────────────┘
```

## 📦 Components

### 1. **OpenTelemetry SDK**
- **Auto-instrumentation** for HTTP, Express, and other Node.js libraries
- **Custom spans** for business logic tracing
- **Custom metrics** for application-specific monitoring

### 2. **Jaeger** - Distributed Tracing
- **UI**: http://localhost:16686
- **Collector**: http://localhost:14268/api/traces
- **Purpose**: Trace request flows, identify bottlenecks, debug issues

### 3. **Prometheus** - Metrics Collection
- **UI**: http://localhost:9091
- **Metrics**: http://localhost:9090/metrics
- **Purpose**: Collect and store time-series metrics

### 4. **Grafana** - Visualization
- **UI**: http://localhost:3001
- **Credentials**: admin/admin123
- **Purpose**: Create dashboards and alerts

## ��� Quick Start

### 1. **Start Telemetry Stack**
```bash
# Start all telemetry services
npm run telemetry:start

# Start everything (telemetry + database + app)
npm run dev:full
```

### 2. **Access Dashboards**
- **Jaeger UI**: http://localhost:16686
- **Prometheus**: http://localhost:9091
- **Grafana**: http://localhost:3001 (admin/admin123)
- **API Health**: http://localhost:3000/health

### 3. **Generate Some Traffic**
```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+1234567890"}'

# Verify OTP
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+1234567890","otp":"123456"}'
```

### 4. **View Traces and Metrics**
- Go to Jaeger UI to see request traces
- Check Grafana for metrics dashboards
- Monitor Prometheus for raw metrics

## 📊 Available Metrics

### **HTTP Metrics**
- `http_requests_total` - Total HTTP requests by method, route, status
- `http_request_duration_ms` - Request duration histogram

### **Authentication Metrics**
- `auth_attempts_total` - Authentication attempts by type
- `auth_failures_total` - Authentication failures with reasons

### **Database Metrics**
- `database_operation_duration_ms` - Database operation duration
- Database operations by type and collection

### **Application Metrics**
- `active_users` - Current active user count
- Custom business logic metrics

## 🔧 Configuration

### **Environment Variables**
```env
# OpenTelemetry Configuration
ENABLE_TRACING=true
ENABLE_METRICS=true
JAEGER_ENDPOINT=http://localhost:14268/api/traces
PROMETHEUS_PORT=9090
OTEL_SERVICE_NAME=family-tree-api
OTEL_SERVICE_VERSION=1.0.0
```

### **Telemetry Features**
- ✅ **Auto-instrumentation** for HTTP, Express, File System
- ✅ **Custom spans** for business logic
- ✅ **Custom metrics** for application KPIs
- ✅ **Error tracking** with exception recording
- ✅ **Request correlation** with trace IDs
- ✅ **Performance monitoring** with histograms

## 📈 Dashboards

### **Grafana Dashboard Panels**
1. **HTTP Requests per Second** - Request rate by endpoint
2. **Response Time** - 95th and 50th percentile response times
3. **Authentication Attempts** - Login/register success/failure rates
4. **Database Operations** - Database query performance
5. **Active Users** - Current active user count
6. **Error Rate** - Application error tracking

### **Jaeger Traces**
- **Request Flow**: See complete request journey
- **Service Dependencies**: Understand service interactions
- **Performance Bottlenecks**: Identify slow operations
- **Error Analysis**: Debug failed requests

## 🛠️ Development Workflow

### **Daily Development**
```bash
# Start full development environment
npm run dev:full

# Or start components separately
npm run telemetry:start
npm run janusgraph:start
npm start
```

### **Monitoring During Development**
1. **Keep Jaeger open** to monitor request traces
2. **Check Grafana** for performance metrics
3. **Use health endpoint** for quick status checks
4. **Monitor logs** for telemetry information

### **Debugging Issues**
1. **Check Jaeger** for failed request traces
2. **Look at spans** to identify bottlenecks
3. **Use metrics** to understand patterns
4. **Correlate logs** with trace IDs

## 📋 NPM Scripts

### **Telemetry Management**
```bash
npm run telemetry:start    # Start telemetry stack
npm run telemetry:stop     # Stop telemetry stack
npm run telemetry:restart  # Restart telemetry stack
npm run telemetry:logs     # View telemetry logs
```

### **Full Development**
```bash
npm run dev:full          # Start everything (telemetry + db + app)
npm start                 # Start app only (with telemetry)
npm run start:prod        # Production mode
```

## 🔍 Custom Instrumentation

### **Adding Custom Spans**
```javascript
const { createSpan } = require('./src/config/telemetry');

// Wrap business logic with custom span
await createSpan('user.registration', async (span) => {
  span.setAttributes({
    'user.phone': phoneNumber,
    'user.type': 'new_user'
  });
  
  // Your business logic here
  const result = await registerUser(userData);
  return result;
});
```

### **Recording Custom Metrics**
```javascript
const { recordAuthMetrics } = require('./src/config/telemetry');

// Record authentication attempt
recordAuthMetrics('login', success, failureReason);
```

### **Adding Span Attributes**
```javascript
const { addSpanAttributes } = require('./src/config/telemetry');

// Add custom attributes to current span
addSpanAttributes({
  'user.id': userId,
  'operation.type': 'family_tree_query',
  'query.depth': 3
});
```

## 🚨 Alerts and Monitoring

### **Key Metrics to Monitor**
- **Error Rate**: > 5% error rate
- **Response Time**: > 2 seconds 95th percentile
- **Authentication Failures**: > 10% failure rate
- **Database Latency**: > 500ms average
- **Active Users**: Unusual spikes or drops

### **Setting Up Alerts**
1. **Configure Grafana alerts** for key metrics
2. **Set up notification channels** (Slack, email, etc.)
3. **Define alert thresholds** based on SLAs
4. **Test alert conditions** regularly

## 🐳 Docker Services

### **Service Ports**
- **Jaeger UI**: 16686
- **Jaeger Collector**: 14268
- **Prometheus UI**: 9091
- **Grafana UI**: 3001
- **App Metrics**: 9090
- **OTEL Collector**: 4317, 4318

### **Data Persistence**
- **Prometheus data**: `prometheus_data` volume
- **Grafana data**: `grafana_data` volume
- **Jaeger data**: In-memory (for development)

## 🔒 Production Considerations

### **Security**
- **Change Grafana password** from default
- **Secure metric endpoints** with authentication
- **Use HTTPS** for external access
- **Limit network access** to telemetry services

### **Performance**
- **Configure sampling** for high-traffic applications
- **Set memory limits** for telemetry components
- **Monitor resource usage** of telemetry stack
- **Use persistent storage** for production data

### **Scalability**
- **Use OTEL Collector** for production deployments
- **Configure proper retention** policies
- **Set up horizontal scaling** for high load
- **Implement proper backup** strategies

## 🧪 Testing Telemetry

### **Verify Tracing**
```bash
# Make a request and check Jaeger
curl http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+1234567890"}'

# Check Jaeger UI for the trace
```

### **Verify Metrics**
```bash
# Check Prometheus metrics
curl http://localhost:9090/metrics | grep http_requests_total

# Check app health with telemetry info
curl http://localhost:3000/health
```

### **Load Testing**
```bash
# Generate load to see telemetry in action
for i in {1..100}; do
  curl -s http://localhost:3000/health > /dev/null &
done
```

## 📚 Resources

### **Documentation**
- [OpenTelemetry Node.js](https://opentelemetry.io/docs/instrumentation/js/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

### **Best Practices**
- **Instrument at boundaries** (HTTP, database, external services)
- **Use semantic conventions** for consistent naming
- **Add meaningful attributes** to spans
- **Monitor telemetry overhead** in production
- **Implement proper sampling** strategies

## 🎯 Next Steps

1. **Customize dashboards** for your specific needs
2. **Add more custom metrics** for business KPIs
3. **Set up alerting** for critical issues
4. **Implement log correlation** with trace IDs
5. **Configure production deployment** with proper security

Your Family Tree API now has comprehensive observability! 🎉