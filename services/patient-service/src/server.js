// services/patient-service/src/server.js
const express = require('express');
const cors = require('cors');
const db = require('../../../shared/db');
const { requestLogger } = require('../../../shared/logger');
const { authenticate } = require('../../../shared/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(requestLogger('Patient-Service'));
app.use(authenticate);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Patient-Service',
    port: PORT,
    timestamp: new Date().toISOString(),
    dbStatus: db.getStatus()
  });
});

app.get('/api/patients/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Patient-Service',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// GET /api/patients - Get all patients (useful for frontend selector)
app.get('/api/patients', async (req, res, next) => {
  try {
    const patients = await db.getPatients();
    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/patients/:id - Retrieve patient by ID
app.get('/api/patients/:id', async (req, res, next) => {
  try {
    const patient = await db.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Patient with ID '${req.params.id}' does not exist.`
      });
    }
    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/patients - Register a new patient
app.post('/api/patients', async (req, res, next) => {
  try {
    const { name, email, phone, date_of_birth, gender, blood_group, address } = req.body;

    // Strict input validation
    const missing = [];
    if (!name || !name.trim()) missing.push('name');
    if (!email || !email.trim()) missing.push('email');
    if (!phone || !phone.trim()) missing.push('phone');
    if (!date_of_birth) missing.push('date_of_birth');
    if (!gender || !gender.trim()) missing.push('gender');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `Missing required field(s): ${missing.join(', ')}`
      });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid email format.'
      });
    }

    const newPatient = await db.createPatient({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      date_of_birth,
      gender,
      blood_group: blood_group ? blood_group.trim() : null,
      address: address ? address.trim() : ''
    });

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully.',
      data: newPatient
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.statusCode === 409 ? 'Conflict' : 'Error',
        message: err.message
      });
    }
    next(err);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Patient-Service] Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred in Patient Service.'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Patient-Service] 🚀 Running on port ${PORT}`);
  });
}

module.exports = app;
