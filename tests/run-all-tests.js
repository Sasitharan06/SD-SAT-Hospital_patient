// tests/run-all-tests.js
// Automated Test Suite for Online Doctor Appointment & Digital Prescription Platform
// Covers Unit & Integration Tests: LLD Validations, HLD Gateway, Double-Booking Concurrency Lock

const http = require('http');

const patientApp = require('../services/patient-service/src/server');
const doctorApp = require('../services/doctor-service/src/server');
const appointmentApp = require('../services/appointment-service/src/server');
const prescriptionApp = require('../services/prescription-service/src/server');
const notificationApp = require('../services/notification-service/src/server');
const gatewayApp = require('../gateway/server');

// Helper to make local HTTP requests to Express apps
function request(app, method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const options = {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          server.close();
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        });
      });

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  });
}

const results = [];

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    results.push({ description, status: 'PASS', details });
  } else {
    console.error(`  ❌ FAIL: ${description} - ${details}`);
    results.push({ description, status: 'FAIL', details });
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING TEST SUITE: ONLINE DOCTOR APPOINTMENT & PRESCRIPTION');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // 1. DOCTOR SERVICE TESTS
    // -------------------------------------------------------------
    console.log('--- [1] Doctor Service (LLD & Cache Verification) ---');
    const docListRes = await request(doctorApp, 'GET', '/api/doctors');
    assert('GET /api/doctors returns HTTP 200 with doctor array', 
      docListRes.statusCode === 200 && Array.isArray(docListRes.body.data) && docListRes.body.data.length > 0
    );

    const docSearchRes = await request(doctorApp, 'GET', '/api/doctors?specialty=Cardiology');
    assert('GET /api/doctors?specialty=Cardiology filters by specialty',
      docSearchRes.statusCode === 200 && docSearchRes.body.data.every(d => d.specialty === 'Cardiology')
    );

    const docAvailRes = await request(doctorApp, 'GET', '/api/doctors/doc-201/availability?date=2026-10-15');
    assert('GET /api/doctors/:id/availability returns slot schedule',
      docAvailRes.statusCode === 200 && Array.isArray(docAvailRes.body.data.slots) && docAvailRes.body.data.slots.length > 0
    );

    // -------------------------------------------------------------
    // 2. PATIENT SERVICE TESTS
    // -------------------------------------------------------------
    console.log('\n--- [2] Patient Service (Validation & Persistence) ---');
    const invalidPatRes = await request(patientApp, 'POST', '/api/patients', {}, {
      name: 'Missing Email Patient'
    });
    assert('POST /api/patients fails with 400 when required fields are missing',
      invalidPatRes.statusCode === 400
    );

    const validEmail = `test.student.${Date.now()}@example.com`;
    const createPatRes = await request(patientApp, 'POST', '/api/patients', {}, {
      name: 'Test Student Patient',
      email: validEmail,
      phone: '+91-9988776655',
      date_of_birth: '2000-01-15',
      gender: 'Female',
      blood_group: 'B+'
    });
    assert('POST /api/patients creates new patient with 201 Created',
      createPatRes.statusCode === 201 && createPatRes.body.data.id !== undefined
    );
    const newPatId = createPatRes.body.data ? createPatRes.body.data.id : null;

    const dupEmailRes = await request(patientApp, 'POST', '/api/patients', {}, {
      name: 'Duplicate Patient',
      email: validEmail,
      phone: '+91-9988776655',
      date_of_birth: '2000-01-15',
      gender: 'Female'
    });
    assert('POST /api/patients returns 409 Conflict on duplicate email',
      dupEmailRes.statusCode === 409
    );

    // -------------------------------------------------------------
    // 3. APPOINTMENT SERVICE TESTS (CONCURRENCY & DOUBLE-BOOKING)
    // -------------------------------------------------------------
    console.log('\n--- [3] Appointment Service (Booking, Double-Booking Lock & Cancel) ---');
    const testDate = '2026-11-20';
    const testTime = '11:00 AM';
    const testDocId = 'doc-201';

    // A: First booking succeeds
    const appt1Res = await request(appointmentApp, 'POST', '/api/appointments', {}, {
      patient_id: newPatId || 'pat-101',
      doctor_id: testDocId,
      appointment_date: testDate,
      appointment_time: testTime,
      symptoms: 'Routine cardiac health review'
    });
    assert('POST /api/appointments succeeds for available slot (HTTP 201)',
      appt1Res.statusCode === 201 && appt1Res.body.data.id !== undefined
    );
    const bookedApptId = appt1Res.body.data ? appt1Res.body.data.id : null;

    // B: Second booking for SAME doctor, date, and slot MUST FAIL with 409 Conflict
    const dupApptRes = await request(appointmentApp, 'POST', '/api/appointments', {}, {
      patient_id: 'pat-102',
      doctor_id: testDocId,
      appointment_date: testDate,
      appointment_time: testTime,
      symptoms: 'Attempting to book same slot'
    });
    assert('POST /api/appointments prevents duplicate booking with HTTP 409 Conflict',
      dupApptRes.statusCode === 409
    );

    // C: Cancel the appointment
    const cancelRes = await request(appointmentApp, 'PATCH', `/api/appointments/${bookedApptId}/cancel`, {}, {
      reason: 'Patient rescheduled'
    });
    assert('PATCH /api/appointments/:id/cancel cancels appointment (HTTP 200)',
      cancelRes.statusCode === 200 && cancelRes.body.data.status === 'CANCELLED'
    );

    // D: Slot reuse verification: New booking for the same slot should now SUCCEED!
    const rebookRes = await request(appointmentApp, 'POST', '/api/appointments', {}, {
      patient_id: 'pat-103',
      doctor_id: testDocId,
      appointment_date: testDate,
      appointment_time: testTime,
      symptoms: 'Re-booking previously cancelled slot'
    });
    assert('POST /api/appointments allows booking a released/cancelled slot (HTTP 201)',
      rebookRes.statusCode === 201
    );

    // -------------------------------------------------------------
    // 4. PRESCRIPTION SERVICE TESTS (RBAC & DIGITAL PRESCRIPTION)
    // -------------------------------------------------------------
    console.log('\n--- [4] Prescription Service (Role Authorization & Rx Issuance) ---');
    // A: Non-doctor cannot issue prescription
    const unauthRxRes = await request(prescriptionApp, 'POST', '/api/prescriptions', { 'X-User-Role': 'PATIENT' }, {
      appointment_id: 'apt-301',
      diagnosis: 'Unauthorized Rx',
      medicines: [{ medicine_name: 'Paracetamol', dosage: '500mg', frequency: 'TID', duration: '3 days' }]
    });
    assert('POST /api/prescriptions rejects unauthorized PATIENT role with 403 Forbidden',
      unauthRxRes.statusCode === 403
    );

    // B: Doctor issues prescription
    const validRxRes = await request(prescriptionApp, 'POST', '/api/prescriptions', { 'X-User-Role': 'DOCTOR' }, {
      appointment_id: 'apt-301',
      diagnosis: 'Stage 1 Essential Hypertension',
      notes: 'Advised sodium restriction and aerobic walking for 30 minutes daily.',
      medicines: [
        {
          medicine_name: 'Telmisartan Tablets',
          dosage: '40 mg',
          frequency: 'Once daily in the morning',
          duration: '30 days',
          instructions: 'Take after breakfast with water.'
        },
        {
          medicine_name: 'Amlodipine Besylate',
          dosage: '5 mg',
          frequency: 'Once daily at bedtime',
          duration: '30 days',
          instructions: 'Monitor ankle edema if any.'
        }
      ]
    });
    assert('POST /api/prescriptions succeeds for authorized DOCTOR (HTTP 201)',
      validRxRes.statusCode === 201 && validRxRes.body.data.id !== undefined
    );
    const rxId = validRxRes.body.data ? validRxRes.body.data.id : null;

    const getRxRes = await request(prescriptionApp, 'GET', `/api/prescriptions/${rxId}`);
    assert('GET /api/prescriptions/:id retrieves prescription with nested medicines',
      getRxRes.statusCode === 200 && Array.isArray(getRxRes.body.data.medicines) && getRxRes.body.data.medicines.length === 2
    );

    // -------------------------------------------------------------
    // 5. NOTIFICATION SERVICE & MESSAGE QUEUE
    // -------------------------------------------------------------
    console.log('\n--- [5] Notification Service (RabbitMQ Consumer & Queue Stats) ---');
    const queueStatsRes = await request(notificationApp, 'GET', '/api/notifications/queue-stats');
    assert('GET /api/notifications/queue-stats returns active queue metrics',
      queueStatsRes.statusCode === 200 && queueStatsRes.body.data.totalPublished >= 3
    );

    const notifsRes = await request(notificationApp, 'GET', '/api/notifications');
    assert('GET /api/notifications returns list of asynchronous notification logs',
      notifsRes.statusCode === 200 && Array.isArray(notifsRes.body.data)
    );

    // -------------------------------------------------------------
    // 6. API GATEWAY INTROSPECTION & SERVICE HEALTH
    // -------------------------------------------------------------
    console.log('\n--- [6] API Gateway (Routing Table & Service Discovery) ---');
    const gwHealthRes = await request(gatewayApp, 'GET', '/api/health');
    assert('GET /api/health at Gateway returns HTTP 200 UP',
      gwHealthRes.statusCode === 200 && gwHealthRes.body.status === 'UP'
    );

    const gwServicesRes = await request(gatewayApp, 'GET', '/api/gateway/services');
    assert('GET /api/gateway/services returns service registry configuration',
      gwServicesRes.statusCode === 200 && Array.isArray(gwServicesRes.body.services) && gwServicesRes.body.services.length === 5
    );

    const unmappedRes = await request(gatewayApp, 'GET', '/api/non-existent-endpoint');
    assert('GET /api/non-existent-endpoint returns HTTP 404 Route Not Found',
      unmappedRes.statusCode === 404
    );

    // Summary Report
    console.log('\n================================================================');
    console.log('📊 TEST SUMMARY REPORT');
    console.log('================================================================');
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    console.log(`Total Tests Run: ${results.length}`);
    console.log(`Passed:         ${passed} ✅`);
    console.log(`Failed:         ${failed} ❌`);
    console.log(`Success Rate:   ${((passed / results.length) * 100).toFixed(1)}%`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unhandled Test Suite Exception:', err);
    process.exit(1);
  }
}

runTests();
