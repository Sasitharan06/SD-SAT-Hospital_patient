// services/appointment-service/src/server.js
const express = require('express');
const cors = require('cors');
const db = require('../../../shared/db');
const eventBus = require('../../../shared/eventBus');
const { requestLogger } = require('../../../shared/logger');
const { authenticate } = require('../../../shared/auth');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());
app.use(requestLogger('Appointment-Service'));
app.use(authenticate);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Appointment-Service',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/appointments/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Appointment-Service',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// GET /api/appointments - Retrieve appointments with optional filters
app.get('/api/appointments', async (req, res, next) => {
  try {
    const { patient_id, doctor_id, date, status } = req.query;
    const appointments = await db.getAppointments({ patient_id, doctor_id, date, status });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/appointments/:id - Retrieve single appointment by ID
app.get('/api/appointments/:id', async (req, res, next) => {
  try {
    const appointment = await db.getAppointmentById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Appointment with ID '${req.params.id}' was not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/appointments - Book a new appointment (with ACID double-booking prevention)
app.post('/api/appointments', async (req, res, next) => {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, symptoms } = req.body;

    // 1. Validation
    const missing = [];
    if (!patient_id) missing.push('patient_id');
    if (!doctor_id) missing.push('doctor_id');
    if (!appointment_date) missing.push('appointment_date');
    if (!appointment_time) missing.push('appointment_time');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `Missing required field(s): ${missing.join(', ')}`
      });
    }

    // 2. Date format check (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(appointment_date)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid appointment_date format. Must be YYYY-MM-DD.'
      });
    }

    // 3. Create appointment with concurrency duplicate lock
    const appointment = await db.createAppointment({
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      symptoms: symptoms || ''
    });

    // 4. Asynchronously publish event to RabbitMQ / Message Queue
    eventBus.publish('appointment.booked', {
      appointmentId: appointment.id,
      patientId: appointment.patient_id,
      patientName: appointment.patient?.name,
      patientEmail: appointment.patient?.email,
      doctorId: appointment.doctor_id,
      doctorName: appointment.doctor?.name,
      specialty: appointment.doctor?.specialty,
      date: appointment.appointment_date,
      time: appointment.appointment_time
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      data: appointment
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

// PATCH /api/appointments/:id/cancel - Cancel appointment and release time slot
app.patch('/api/appointments/:id/cancel', async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const { reason } = req.body || {};

    const cancelledAppt = await db.cancelAppointment(appointmentId, reason);

    // Asynchronously publish cancellation event to Message Queue
    eventBus.publish('appointment.cancelled', {
      appointmentId: cancelledAppt.id,
      patientId: cancelledAppt.patient_id,
      patientEmail: cancelledAppt.patient?.email,
      doctorId: cancelledAppt.doctor_id,
      doctorName: cancelledAppt.doctor?.name,
      date: cancelledAppt.appointment_date,
      time: cancelledAppt.appointment_time,
      reason: cancelledAppt.cancel_reason
    });

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully. Slot is now available for new bookings.',
      data: cancelledAppt
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: err.message
      });
    }
    next(err);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Appointment-Service] Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred in Appointment Service.'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Appointment-Service] 🚀 Running on port ${PORT}`);
  });
}

module.exports = app;
