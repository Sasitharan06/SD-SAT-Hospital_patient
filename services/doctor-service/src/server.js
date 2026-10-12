// services/doctor-service/src/server.js
const express = require('express');
const cors = require('cors');
const db = require('../../../shared/db');
const cache = require('../../../shared/cache');
const { requestLogger } = require('../../../shared/logger');
const { authenticate } = require('../../../shared/auth');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(requestLogger('Doctor-Service'));
app.use(authenticate);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Doctor-Service',
    port: PORT,
    timestamp: new Date().toISOString(),
    cacheStats: cache.getStats()
  });
});

app.get('/api/doctors/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Doctor-Service',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// GET /api/doctors - Retrieve doctor list with search & specialty filters, plus Redis/cache support
app.get('/api/doctors', async (req, res, next) => {
  try {
    const { search, specialty } = req.query;
    const cacheKey = `doctors_list_${search || 'all'}_${specialty || 'all'}`;

    // Check Redis / Memory cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      res.setHeader('X-Cache-Status', 'HIT');
      return res.status(200).json({
        success: true,
        cached: true,
        count: cachedData.length,
        data: cachedData
      });
    }

    const doctors = await db.getDoctors({ search, specialty });

    // Store in cache with 60s TTL
    await cache.set(cacheKey, doctors, 60);
    res.setHeader('X-Cache-Status', 'MISS');

    res.status(200).json({
      success: true,
      cached: false,
      count: doctors.length,
      data: doctors
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/doctors/:id - Retrieve single doctor by ID
app.get('/api/doctors/:id', async (req, res, next) => {
  try {
    const doctor = await db.getDoctorById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Doctor with ID '${req.params.id}' was not found.`
      });
    }
    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/doctors/:id/availability - Retrieve availability slots for a date
app.get('/api/doctors/:id/availability', async (req, res, next) => {
  try {
    const doctorId = req.params.id;
    // Default to tomorrow's date if not provided in query
    const targetDate = req.query.date || new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const availability = await db.getDoctorAvailability(doctorId, targetDate);
    if (!availability) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Doctor with ID '${doctorId}' does not exist.`
      });
    }

    res.status(200).json({
      success: true,
      data: availability
    });
  } catch (err) {
    next(err);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Doctor-Service] Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred in Doctor Service.'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Doctor-Service] 🚀 Running on port ${PORT}`);
  });
}

module.exports = app;
