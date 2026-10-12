// gateway/server.js
// Express.js API Gateway (Port 3000) using http-proxy-middleware
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role', 'X-User-Id', 'X-Request-Id']
}));

// Route table mapping path prefixes to backend microservices
const SERVICES = {
  patients: {
    name: 'Patient Service',
    url: process.env.PATIENT_SERVICE_URL || 'http://localhost:3001',
    port: 3001,
    route: '/api/patients',
    description: 'Patient registration, profile lookups, demographic management'
  },
  doctors: {
    name: 'Doctor Service',
    url: process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002',
    port: 3002,
    route: '/api/doctors',
    description: 'Doctor directory, specialty search, and dynamic slot availability'
  },
  appointments: {
    name: 'Appointment Service',
    url: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3003',
    port: 3003,
    route: '/api/appointments',
    description: 'Slot booking, double-booking prevention, cancellation, and scheduling'
  },
  prescriptions: {
    name: 'Prescription Service',
    url: process.env.PRESCRIPTION_SERVICE_URL || 'http://localhost:3004',
    port: 3004,
    route: '/api/prescriptions',
    description: 'Digital Rx generation, medicine dosage schedules, and doctor notes'
  },
  notifications: {
    name: 'Notification Service',
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
    port: 3005,
    route: '/api/notifications',
    description: 'Asynchronous event consumer, alerts, and SMS/Email dispatch'
  }
};

// In-memory request routing audit log (last 50 requests for Gateway Demo visualization)
const gatewayAuditLog = [];

// Gateway Global Request Logger & Correlation Middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || `gw-${Math.random().toString(36).substring(2, 9)}`;
  req.requestId = requestId;
  res.setHeader('X-Gateway', 'Medicare-Express-API-Gateway');
  res.setHeader('X-Request-Id', requestId);

  // Capture response for visual demonstration in UI
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    const logEntry = {
      id: requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toLocaleTimeString(),
      userRole: req.headers['x-user-role'] || 'ANONYMOUS'
    };
    gatewayAuditLog.unshift(logEntry);
    if (gatewayAuditLog.length > 50) gatewayAuditLog.pop();

    console.log(
      `[API-GATEWAY] 🌐 ${req.method} ${req.originalUrl} -> HTTP ${res.statusCode} (${duration}ms) [ReqID: ${requestId}]`
    );
    return originalEnd.apply(this, args);
  };

  next();
});

// Helper to check health of an individual backend microservice
function pingService(url) {
  return new Promise((resolve) => {
    const req = http.get(`${url}/health`, { timeout: 1200 }, (res) => {
      resolve(res.statusCode === 200 ? 'UP' : 'DEGRADED');
    });
    req.on('error', () => resolve('DOWN'));
    req.on('timeout', () => {
      req.destroy();
      resolve('TIMEOUT');
    });
  });
}

// Gateway Meta Endpoint: List all registered backend microservices with live health checks
app.get('/api/gateway/services', async (req, res) => {
  const serviceStatuses = await Promise.all(
    Object.entries(SERVICES).map(async ([key, info]) => {
      const status = await pingService(info.url);
      return {
        key,
        ...info,
        status,
        healthCheckUrl: `${info.url}/health`
      };
    })
  );

  res.status(200).json({
    gateway: {
      name: 'Healthcare API Gateway',
      port: PORT,
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    },
    services: serviceStatuses,
    recentTraffic: gatewayAuditLog.slice(0, 15)
  });
});

// Gateway Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    gateway: 'Express API Gateway',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Create Proxy Middlewares for each microservice with http-proxy-middleware
function createServiceProxy(target, serviceName) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    timeout: 5000,
    pathRewrite: (path, req) => req.originalUrl,
    on: {
      proxyReq: (proxyReq, req, res) => {
        // Forward correlation IDs and auth headers
        if (req.requestId) {
          proxyReq.setHeader('x-request-id', req.requestId);
        }
        if (req.headers['x-user-role']) {
          proxyReq.setHeader('x-user-role', req.headers['x-user-role']);
        }
        if (req.headers['x-user-id']) {
          proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
        }
      },
      error: (err, req, res) => {
        console.error(`[API-GATEWAY] ❌ Proxy Error forward to ${serviceName} (${target}):`, err.message);
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            error: 'Service Unavailable',
            message: `${serviceName} at ${target} is currently unreachable. Gateway could not establish upstream connection.`,
            service: serviceName,
            targetUrl: target,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  });
}

// 1. Patient Service Proxy: /api/patients/*
app.use('/api/patients', createServiceProxy(SERVICES.patients.url, SERVICES.patients.name));

// 2. Doctor Service Proxy: /api/doctors/*
app.use('/api/doctors', createServiceProxy(SERVICES.doctors.url, SERVICES.doctors.name));

// 3. Appointment Service Proxy: /api/appointments/*
app.use('/api/appointments', createServiceProxy(SERVICES.appointments.url, SERVICES.appointments.name));

// 4. Prescription Service Proxy: /api/prescriptions/*
app.use('/api/prescriptions', createServiceProxy(SERVICES.prescriptions.url, SERVICES.prescriptions.name));

// 5. Notification Service Proxy: /api/notifications/*
app.use('/api/notifications', createServiceProxy(SERVICES.notifications.url, SERVICES.notifications.name));

// Catch-all 404 for unrouted paths
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route Not Found',
    message: `API Gateway cannot find route handler for path ${req.originalUrl}.`,
    availableRoutes: [
      '/api/patients/*',
      '/api/doctors/*',
      '/api/appointments/*',
      '/api/prescriptions/*',
      '/api/notifications/*',
      '/api/gateway/services'
    ]
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 API GATEWAY RUNNING ON PORT ${PORT}`);
    console.log(`📡 Route Map:`);
    console.log(`   /api/patients/*       -> Patient Service (${SERVICES.patients.url})`);
    console.log(`   /api/doctors/*        -> Doctor Service (${SERVICES.doctors.url})`);
    console.log(`   /api/appointments/*   -> Appointment Service (${SERVICES.appointments.url})`);
    console.log(`   /api/prescriptions/*  -> Prescription Service (${SERVICES.prescriptions.url})`);
    console.log(`   /api/notifications/*  -> Notification Service (${SERVICES.notifications.url})`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
