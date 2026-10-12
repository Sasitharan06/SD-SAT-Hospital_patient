// services/prescription-service/src/server.js
const express = require('express');
const cors = require('cors');
const db = require('../../../shared/db');
const eventBus = require('../../../shared/eventBus');
const { requestLogger } = require('../../../shared/logger');
const { authenticate, requireRole } = require('../../../shared/auth');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());
app.use(requestLogger('Prescription-Service'));
app.use(authenticate);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Prescription-Service',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/prescriptions/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Prescription-Service',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// GET /api/prescriptions - List prescriptions with optional filters
app.get('/api/prescriptions', async (req, res, next) => {
  try {
    const { patient_id, doctor_id, appointment_id } = req.query;
    const prescriptions = await db.getPrescriptions({ patient_id, doctor_id, appointment_id });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/prescriptions/:id - Retrieve digital prescription by ID
app.get('/api/prescriptions/:id', async (req, res, next) => {
  try {
    const prescription = await db.getPrescriptionById(req.params.id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Prescription with ID '${req.params.id}' was not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/prescriptions - Doctor issues digital prescription for an appointment
// Role check: Only DOCTOR or ADMIN may issue prescriptions
app.post('/api/prescriptions', async (req, res, next) => {
  try {
    const role = (req.headers['x-user-role'] || 'DOCTOR').toUpperCase();
    if (role !== 'DOCTOR' && role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only authorized medical doctors can generate digital prescriptions.'
      });
    }

    const { appointment_id, doctor_id, patient_id, diagnosis, notes, medicines } = req.body;

    // 1. Validation
    if (!appointment_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Missing required field: appointment_id'
      });
    }

    if (!diagnosis || !diagnosis.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Diagnosis is required.'
      });
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'At least one medicine item must be prescribed.'
      });
    }

    for (let i = 0; i < medicines.length; i++) {
      const med = medicines[i];
      if (!med.medicine_name || !med.dosage || !med.frequency || !med.duration) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `Medicine item #${i + 1} is missing required fields (medicine_name, dosage, frequency, duration).`
        });
      }
    }

    // 2. Persist digital prescription in database
    const newPrescription = await db.createPrescription({
      appointment_id,
      doctor_id,
      patient_id,
      diagnosis: diagnosis.trim(),
      notes: notes ? notes.trim() : '',
      medicines
    });

    // 3. Publish event to Message Queue / Notification Service
    eventBus.publish('prescription.created', {
      prescriptionId: newPrescription.id,
      appointmentId: newPrescription.appointment_id,
      patientId: newPrescription.patient_id,
      patientName: newPrescription.patient?.name,
      patientEmail: newPrescription.patient?.email,
      doctorName: newPrescription.doctor?.name,
      diagnosis: newPrescription.diagnosis,
      medicinesCount: newPrescription.medicines.length
    });

    res.status(201).json({
      success: true,
      message: 'Digital prescription created successfully.',
      data: newPrescription
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.statusCode === 409 ? 'Conflict' : err.statusCode === 404 ? 'Not Found' : 'Error',
        message: err.message
      });
    }
    next(err);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Prescription-Service] Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred in Prescription Service.'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Prescription-Service] 🚀 Running on port ${PORT}`);
  });
}

module.exports = app;
