// services/notification-service/src/server.js
const express = require('express');
const cors = require('cors');
const db = require('../../../shared/db');
const eventBus = require('../../../shared/eventBus');
const { requestLogger } = require('../../../shared/logger');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use(requestLogger('Notification-Service'));

// Register event bus subscriptions (RabbitMQ Consumer simulation)
eventBus.subscribe('appointment.booked', async (msg) => {
  const { appointmentId, patientId, patientName, doctorName, date, time } = msg.payload;
  console.log(`[Notification-Service] 🔔 Processing 'appointment.booked' for patient ${patientId}`);
  
  await db.createNotification({
    recipient_type: 'PATIENT',
    recipient_id: patientId,
    type: 'APPOINTMENT_CONFIRMED',
    title: `Appointment Confirmed with ${doctorName || 'Doctor'}`,
    message: `Hello ${patientName || 'Patient'}, your appointment (ID: ${appointmentId}) on ${date} at ${time} is confirmed.`,
    channel: 'IN_APP'
  });
});

eventBus.subscribe('appointment.cancelled', async (msg) => {
  const { appointmentId, patientId, doctorName, date, time, reason } = msg.payload;
  console.log(`[Notification-Service] 🔔 Processing 'appointment.cancelled' for appointment ${appointmentId}`);

  await db.createNotification({
    recipient_type: 'PATIENT',
    recipient_id: patientId,
    type: 'APPOINTMENT_CANCELLED',
    title: 'Appointment Cancelled',
    message: `Your appointment with ${doctorName || 'Doctor'} on ${date} at ${time} was cancelled. Reason: ${reason || 'User cancelled'}.`,
    channel: 'IN_APP'
  });
});

eventBus.subscribe('prescription.created', async (msg) => {
  const { prescriptionId, appointmentId, patientId, patientName, doctorName, medicinesCount } = msg.payload;
  console.log(`[Notification-Service] 🔔 Processing 'prescription.created' for patient ${patientId}`);

  await db.createNotification({
    recipient_type: 'PATIENT',
    recipient_id: patientId,
    type: 'PRESCRIPTION_GENERATED',
    title: `Digital Prescription Issued (${prescriptionId})`,
    message: `Dr. ${doctorName || 'Your Doctor'} has prescribed ${medicinesCount} medicine(s) for appointment ${appointmentId}. You can now view and download it.`,
    channel: 'IN_APP'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Notification-Service',
    port: PORT,
    timestamp: new Date().toISOString(),
    queue: eventBus.getStats()
  });
});

app.get('/api/notifications/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Notification-Service',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// GET /api/notifications/queue-stats - Live inspection of RabbitMQ / EventBus metrics
app.get('/api/notifications/queue-stats', (req, res) => {
  res.status(200).json({
    success: true,
    data: eventBus.getStats()
  });
});

// GET /api/notifications - List notifications
app.get('/api/notifications', async (req, res, next) => {
  try {
    const { recipient_id, recipient_type, limit } = req.query;
    const notifications = await db.getNotifications({
      recipient_id,
      recipient_type,
      limit: limit ? parseInt(limit) : 20
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications - Manually create a notification (for testing or external triggers)
app.post('/api/notifications', async (req, res, next) => {
  try {
    const { recipient_id, recipient_type, type, title, message, channel } = req.body;

    if (!recipient_id || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'recipient_id, title, and message are required.'
      });
    }

    const notif = await db.createNotification({
      recipient_id,
      recipient_type: recipient_type || 'PATIENT',
      type: type || 'CUSTOM_ALERT',
      title,
      message,
      channel: channel || 'IN_APP'
    });

    res.status(201).json({
      success: true,
      message: 'Notification dispatched successfully.',
      data: notif
    });
  } catch (err) {
    next(err);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Notification-Service] Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred in Notification Service.'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Notification-Service] 🚀 Running on port ${PORT}`);
  });
}

module.exports = app;
