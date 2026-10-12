// frontend/src/components/SystemDesign.jsx
import React, { useState } from 'react';

export default function SystemDesign() {
  const [activeTab, setActiveTab] = useState('hld');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-primary">Round 2: LLD</span>
              <span className="badge badge-success">Round 3: HLD</span>
              <span className="badge badge-warning">College Viva Master</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>
              System Architecture & Low-Level Design (LLD/HLD)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Architectural blueprints, sequence diagrams, database schemas, concurrency locking, and examination viva Q&A.
            </p>
          </div>

          {/* Navigation Pill Tabs */}
          <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-muted)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            {[
              { id: 'hld', label: 'High-Level Design (HLD)' },
              { id: 'lld', label: 'Low-Level Design (LLD)' },
              { id: 'database', label: 'Database Schema' },
              { id: 'sequence', label: 'Sequence Diagrams' },
              { id: 'viva', label: 'Viva Q&A Cheat Sheet' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.775rem' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB 1: HIGH LEVEL DESIGN (HLD) */}
      {activeTab === 'hld' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>
              Microservices High-Level Design Architecture
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Decoupled microservice architecture routing via an Express API Gateway with asynchronous event queues and caching.
            </p>

            {/* Architecture Visual ASCII / Diagram */}
            <div className="code-block" style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
{`                               +-------------------------------+
                               |  React.js + Vite Client       |
                               |  (Single Page App : Port 5173)|
                               +---------------+---------------+
                                               |
                                               |  All REST Calls via Gateway
                                               v
                        +---------------------------------------------+
                        |      Express.js API Gateway (Port 3000)     |
                        |      (http-proxy-middleware + Auth + Log)   |
                        +--+-----------+-----------+----------+----+--+
                           |           |           |          |    |
           /api/patients   |           |           |          |    |  /api/notifications
        +------------------+           |           |          |    +-------------------+
        |                              |           |          |                        |
        v                              v           v          v                        v
+---------------+    +-------------------+  +--------------+  +---------------+  +------------------+
|Patient Service|    |  Doctor Service   |  | Appointment  |  | Prescription  |  |  Notification    |
|  (Port 3001)  |    |   (Port 3002)     |  | Service(3003)|  | Service(3004) |  |   Service(3005)  |
+-------+-------+    +---------+---------+  +------+-------+  +-------+-------+  +--------+---------+
        |                      |                   |                  |                   ^
        |                      | Cache (60s TTL)   | Publish Event    | Publish Event     | Consume Event
        |                      v                   v                  v                   |
        |               +--------------+    +---------------------------------------------+
        |               | Redis Cache  |    |  RabbitMQ / Local Async Event Queue Bus     |
        |               +--------------+    +---------------------------------------------+
        |                      |                               |
        +----------------------+---------------+---------------+
                                               |
                                               v
                                 +----------------------------+
                                 |  PostgreSQL Database       |
                                 |  (Tables, Partial Indexes, |
                                 |   Foreign Keys, Cascades)  |
                                 +----------------------------+`}
            </div>
          </div>

          <div className="grid-3">
            <div className="card">
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>
                1. Express API Gateway (:3000)
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Single point of ingress. Implements reverse proxy routing via <code>http-proxy-middleware</code>, request correlation tracking (<code>X-Request-Id</code>), role propagation, and circuit-safe 503 fallback handling.
              </p>
            </div>

            <div className="card">
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--secondary)', marginBottom: '8px' }}>
                2. Decoupled Microservices
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Services run on independent ports (3001 to 3005). Each owns distinct business domain logic: Patient profiles, Doctor availability, Appointments with ACID locks, and Digital Rx issuing.
              </p>
            </div>

            <div className="card">
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#b45309', marginBottom: '8px' }}>
                3. Event-Driven Message Queue
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Asynchronous event pub-sub (RabbitMQ pattern) decouples appointment booking from notification dispatch. Allows instant HTTP 201 responses without blocking on email/SMS latency.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOW LEVEL DESIGN (LLD) */}
      {activeTab === 'lld' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>
              Low-Level Design (LLD) Core Specifications
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Class design, API request contracts, HTTP status code matrices, and concurrency handling.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Method & Path</th>
                  <th style={{ padding: '8px 12px' }}>Microservice</th>
                  <th style={{ padding: '8px 12px' }}>Success</th>
                  <th style={{ padding: '8px 12px' }}>Error Statuses</th>
                  <th style={{ padding: '8px 12px' }}>LLD Validation Rules</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>GET /api/doctors</td>
                  <td style={{ padding: '10px 12px' }}>Doctor (:3002)</td>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-success">200 OK</span></td>
                  <td style={{ padding: '10px 12px' }}>500 Internal</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Optional search & specialty query filters with Redis cache hit/miss header</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>GET /api/doctors/:id/availability</td>
                  <td style={{ padding: '10px 12px' }}>Doctor (:3002)</td>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-success">200 OK</span></td>
                  <td style={{ padding: '10px 12px' }}>404 Not Found</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Computes available vs booked slots for date; filters out CANCELLED appointments</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>POST /api/patients</td>
                  <td style={{ padding: '10px 12px' }}>Patient (:3001)</td>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-success">201 Created</span></td>
                  <td style={{ padding: '10px 12px' }}>400 Bad Req, 409 Conflict</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Validates email format, required fields (name, phone, dob, gender), checks email uniqueness</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>POST /api/appointments</td>
                  <td style={{ padding: '10px 12px' }}>Appointment (:3003)</td>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-success">201 Created</span></td>
                  <td style={{ padding: '10px 12px' }}>400, 404, 409 Conflict</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Validates foreign keys, executes slot concurrency lock. Publishes appointment.booked event</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>PATCH /api/appointments/:id/cancel</td>
                  <td style={{ padding: '10px 12px' }}>Appointment (:3003)</td>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-success">200 OK</span></td>
                  <td style={{ padding: '10px 12px' }}>400 Bad Req, 404</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Sets status to CANCELLED, frees slot for reuse, publishes cancellation event</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>POST /api/prescriptions</td>
                  <td style={{ padding: '10px 12px' }}>Prescription (:3004)</td>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-success">201 Created</span></td>
                  <td style={{ padding: '10px 12px' }}>400, 403 Forbidden, 409</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Role check: only DOCTOR or ADMIN; validates non-empty medicine array & diagnosis</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Slot Concurrency Locking In Depth */}
          <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '8px' }}>
              🔒 Concurrency & Double-Booking Prevention Strategy
            </h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <p>
                In high-traffic doctor platforms, multiple patients might click "Book" on the 10:00 AM slot simultaneously. Standard application-level checks allow race conditions:
              </p>
              <ol style={{ paddingLeft: '20px', marginTop: '6px', marginBottom: '10px' }}>
                <li><strong>Thread A</strong> checks if slot is booked &rarr; false</li>
                <li><strong>Thread B</strong> checks if slot is booked &rarr; false</li>
                <li><strong>Thread A</strong> inserts record &rarr; Success</li>
                <li><strong>Thread B</strong> inserts record &rarr; <em>Double booking disaster!</em></li>
              </ol>
              <p>
                <strong>Our Solution:</strong> Database-Level ACID Constraint via Partial Unique Index:
              </p>
              <div className="code-block" style={{ margin: '8px 0', fontSize: '0.8rem' }}>
{`CREATE UNIQUE INDEX uq_doctor_active_slot 
ON appointments(doctor_id, appointment_date, appointment_time) 
WHERE status != 'CANCELLED';`}
              </div>
              <p>
                When Thread B executes its insert, PostgreSQL immediately enforces the unique constraint and throws error code <code>23505 (unique_violation)</code>. The API converts this to <strong>HTTP 409 Conflict</strong>. Furthermore, because of the <code>WHERE status != 'CANCELLED'</code> predicate, when an appointment is cancelled, the slot is immediately unlocked for reuse!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATABASE SCHEMA & ERD */}
      {activeTab === 'database' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>
              Relational Database Entity-Relationship Diagram (PostgreSQL)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Organized tables, foreign key constraints, partial unique indexes, and audit timestamps.
            </p>

            <div className="code-block" style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
{`   [PATIENTS]
   + id (PK, VARCHAR)
   + name (VARCHAR)
   + email (VARCHAR, UNIQUE)
   + phone (VARCHAR)
   + date_of_birth (DATE)
   + gender (VARCHAR)
   + blood_group (VARCHAR)
          |
          | 1:N
          v
   [APPOINTMENTS] <--------------------------------- [DOCTORS]
   + id (PK, VARCHAR)                                + id (PK, VARCHAR)
   + patient_id (FK -> patients.id)                  + name (VARCHAR)
   + doctor_id (FK -> doctors.id)                    + email (VARCHAR, UNIQUE)
   + appointment_date (DATE)                         + specialty (VARCHAR)
   + appointment_time (VARCHAR)                      + consultation_fee (NUMERIC)
   + status (CONFIRMED/COMPLETED/CANCELLED)          + available_days (VARCHAR)
   + symptoms (TEXT)                                 + available_time_start (TIME)
   + [UNIQUE INDEX: (doctor_id, date, time)          + available_time_end (TIME)
       WHERE status != 'CANCELLED']                  + rating (NUMERIC)
          |
          | 1:1
          v
   [PRESCRIPTIONS]
   + id (PK, VARCHAR)
   + appointment_id (FK -> appointments.id, UNIQUE)
   + doctor_id (FK -> doctors.id)
   + patient_id (FK -> patients.id)
   + diagnosis (TEXT)
   + notes (TEXT)
          |
          | 1:N (CASCADE DELETE)
          v
   [PRESCRIPTION_MEDICINES]
   + id (PK, VARCHAR)
   + prescription_id (FK -> prescriptions.id)
   + medicine_name (VARCHAR)
   + dosage (VARCHAR)
   + frequency (VARCHAR)
   + duration (VARCHAR)
   + instructions (TEXT)`}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SEQUENCE DIAGRAMS */}
      {activeTab === 'sequence' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Appointment Booking Sequence */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '8px' }}>
              Sequence Diagram: Appointment Booking with Concurrency Lock & RabbitMQ Event
            </h3>
            <div className="code-block" style={{ fontSize: '0.775rem' }}>
{`Client (React)         API Gateway (:3000)      Appt Service (:3003)      PostgreSQL DB         RabbitMQ Queue        Notif Service (:3005)
      |                         |                         |                      |                    |                     |
      |-- 1. POST /api/appts -->|                         |                      |                    |                     |
      |   (body: {doc, date,})  |-- 2. Proxy Request ---->|                      |                    |                     |
      |                         |   (http-proxy-midware)  |-- 3. Check Slot ---->|                    |                     |
      |                         |                         |   Constraint Lock    |                    |                     |
      |                         |                         |<-- 4. Slot Free -----|                    |                     |
      |                         |                         |-- 5. INSERT Appt --->|                    |                     |
      |                         |                         |<-- 6. Insert OK -----|                    |                     |
      |                         |                         |                      |                    |                     |
      |                         |                         |-- 7. Publish Event: 'appointment.booked'->|                     |
      |                         |                         |   (Asynchronous / Non-blocking)           |-- 8. Consume Event->|
      |                         |                         |                                           |   (Background)      |
      |                         |<-- 9. HTTP 201 Created -|                                           |                     |-- 9. Insert Notif -> DB
      |<-- 10. Confirm ID: 301 -|                         |                                           |                     |   Send SMS/Email
      |    (Render in UI)       |                         |                                           |                     |`}
            </div>
          </div>

          {/* API Gateway Routing Sequence */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '8px' }}>
              Sequence Diagram: API Gateway Request Routing & Microservice Error Isolation
            </h3>
            <div className="code-block" style={{ fontSize: '0.775rem' }}>
{`Client (React)         API Gateway (:3000)                 Path Pattern Match                   Upstream Microservice
      |                         |                                   |                                     |
      |-- 1. GET /api/doctors ->|                                   |                                     |
      |                         |-- 2. Match Prefix '/api/doctors'->|                                     |
      |                         |   Target: http://localhost:3002   |-- 3. HTTP Proxy (Headers & Auth) -->|
      |                         |                                   |                                     |-- 4. Query DB/Cache
      |                         |<----------------------------------|-- 5. HTTP 200 JSON Response --------|
      |<-- 6. HTTP 200 OK ------|                                   |                                     |
      |   (Cache: HIT, 4ms)     |                                   |                                     |
      |                         |                                   |                                     |
      |-- 7. If Downstream is Unreachable:                          |                                     |
      |-- GET /api/service-down>|                                   |                                     |
      |                         |-- 8. Connect Timeout / ECONNREFUSED ----------------------------------->| (Service Offline)
      |<-- 9. HTTP 503 ---------|                                   |                                     |
      |   "Service Unavailable" |                                   |                                     |`}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VIVA PREPARATION CHEAT SHEET */}
      {activeTab === 'viva' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '14px', color: '#0369a1' }}>
              🎓 College Examination & System Design Viva Q&A
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Q1: What is the primary role of the API Gateway in this architecture?
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  <strong>Answer:</strong> The API Gateway acts as the single reverse-proxy entry point (Port 3000). It abstracts the internal microservice topology from the client, applies uniform cross-cutting concerns (CORS, Request correlation IDs, Rate limiting, Authentication header injection), and protects clients from internal service failures with graceful HTTP 503 fallback messages.
                </p>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Q2: How do you prevent double-booking when multiple users book the same slot simultaneously?
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  <strong>Answer:</strong> Rather than relying solely on slow or race-prone application-level validation, we enforce a PostgreSQL partial unique index: <code>UNIQUE INDEX uq_doctor_active_slot ON appointments(doctor_id, appointment_date, appointment_time) WHERE status != 'CANCELLED'</code>. If concurrent requests arrive at the database within microseconds, the database engine enforces atomicity and raises an error (HTTP 409 Conflict) for the second request.
                </p>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Q3: Why use an asynchronous message queue (RabbitMQ) for notifications instead of direct REST calls?
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  <strong>Answer:</strong> Decoupling and fault tolerance. External SMS and Email gateways frequently experience high latencies (500ms - 3s) or temporary downtimes. By publishing an event to a queue, the Appointment Service responds immediately (HTTP 201 Created in ~2ms). The Notification Service consumes the event in the background and can retry failed deliveries without impacting user experience.
                </p>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Q4: How does caching improve Doctor Directory performance?
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  <strong>Answer:</strong> Doctor profile and specialty queries are read-heavy (95% reads vs 5% writes). We implement a Redis/TTL cache (60 seconds) in the Doctor Service. Cache hits return in ~1ms without querying the database, drastically reducing database connection pool exhaustion during peak hours.
                </p>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Q5: How is Role-Based Access Control (RBAC) enforced on Digital Prescriptions?
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  <strong>Answer:</strong> Digital prescriptions can only be created by medical doctors. The Prescription Service checks the client token/role header (<code>X-User-Role: DOCTOR</code>). Requests initiated by patients are rejected with <code>HTTP 403 Forbidden</code>, preventing fraudulent prescription issuance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
