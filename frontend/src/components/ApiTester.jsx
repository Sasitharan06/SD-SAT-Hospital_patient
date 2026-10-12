// frontend/src/components/ApiTester.jsx
import React, { useState } from 'react';
import { api } from '../api';

export default function ApiTester() {
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('/api/doctors');
  const [headers, setHeaders] = useState({
    'X-User-Role': 'PATIENT',
    'X-User-Id': 'pat-101'
  });
  const [bodyText, setBodyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const presets = [
    {
      label: '1. Doctors Directory',
      method: 'GET',
      endpoint: '/api/doctors',
      role: 'PATIENT',
      body: ''
    },
    {
      label: '2. Doctor Availability Slots',
      method: 'GET',
      endpoint: '/api/doctors/doc-201/availability?date=2026-10-20',
      role: 'PATIENT',
      body: ''
    },
    {
      label: '3. Register New Patient',
      method: 'POST',
      endpoint: '/api/patients',
      role: 'PATIENT',
      body: JSON.stringify({
        name: 'Kavita Krishnan',
        email: `kavita.${Date.now().toString().slice(-4)}@example.com`,
        phone: '+91-9876599999',
        date_of_birth: '1994-06-14',
        gender: 'Female',
        blood_group: 'A+',
        address: 'Indiranagar, Bengaluru'
      }, null, 2)
    },
    {
      label: '4. Book Appointment',
      method: 'POST',
      endpoint: '/api/appointments',
      role: 'PATIENT',
      body: JSON.stringify({
        patient_id: 'pat-101',
        doctor_id: 'doc-201',
        appointment_date: '2026-10-28',
        appointment_time: '10:00 AM',
        symptoms: 'Mild chest tightness upon morning walk'
      }, null, 2)
    },
    {
      label: '5. Double-Booking Conflict Test (409)',
      method: 'POST',
      endpoint: '/api/appointments',
      role: 'PATIENT',
      body: JSON.stringify({
        patient_id: 'pat-102',
        doctor_id: 'doc-201',
        appointment_date: '2026-10-15',
        appointment_time: '10:00 AM',
        symptoms: 'Attempting to book slot already held by apt-301'
      }, null, 2)
    },
    {
      label: '6. Cancel Appointment (Frees Slot)',
      method: 'PATCH',
      endpoint: '/api/appointments/apt-301/cancel',
      role: 'PATIENT',
      body: JSON.stringify({ reason: 'Patient schedule conflict' }, null, 2)
    },
    {
      label: '7. Issue Digital Rx (Doctor Role)',
      method: 'POST',
      endpoint: '/api/prescriptions',
      role: 'DOCTOR',
      body: JSON.stringify({
        appointment_id: 'apt-301',
        doctor_id: 'doc-201',
        patient_id: 'pat-101',
        diagnosis: 'Essential Systemic Hypertension (Stage 1)',
        notes: 'Low salt diet recommended. Exercise daily for 20 minutes.',
        medicines: [
          {
            medicine_name: 'Amlodipine Besylate 5mg',
            dosage: '5 mg',
            frequency: 'Once daily after breakfast',
            duration: '30 days',
            instructions: 'Take in morning with plenty of water'
          }
        ]
      }, null, 2)
    },
    {
      label: '8. RabbitMQ Queue Stats',
      method: 'GET',
      endpoint: '/api/notifications/queue-stats',
      role: 'ADMIN',
      body: ''
    }
  ];

  function applyPreset(p) {
    setMethod(p.method);
    setEndpoint(p.endpoint);
    setHeaders({
      'X-User-Role': p.role,
      'X-User-Id': 'pat-101'
    });
    setBodyText(p.body);
  }

  async function handleSend() {
    setLoading(true);
    setResponse(null);

    let parsedBody = null;
    if (['POST', 'PUT', 'PATCH'].includes(method) && bodyText.trim()) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch (e) {
        alert('Invalid JSON body: ' + e.message);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await api.testDirectRoute(method, endpoint, parsedBody, headers);
      setResponse(res);
    } catch (err) {
      setResponse({
        ok: false,
        status: 0,
        duration: 0,
        headers: {},
        data: { error: 'Request Failed', message: err.message }
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>
              Interactive API Testing Console (Postman Equivalent)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Execute live REST queries against the Express API Gateway (Port 3000) and inspect status codes, headers, and payloads.
            </p>
          </div>
          <span className="badge badge-primary">Target: http://localhost:3000</span>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
          Quick Pre-configured Test Templates:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(p)}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', padding: '5px 10px' }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Request Builder */}
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>Request Configuration</h3>

          {/* Method and Endpoint */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="form-control"
              style={{ width: '110px', fontWeight: 700, color: 'var(--primary)' }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/api/..."
              className="form-control"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
            />
          </div>

          {/* Custom Headers */}
          <div className="form-group">
            <label className="form-label">Simulated Headers (RBAC Role)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={headers['X-User-Role'] || 'PATIENT'}
                onChange={(e) => setHeaders({ ...headers, 'X-User-Role': e.target.value })}
                className="form-control"
                style={{ fontSize: '0.8rem' }}
              >
                <option value="PATIENT">X-User-Role: PATIENT</option>
                <option value="DOCTOR">X-User-Role: DOCTOR</option>
                <option value="ADMIN">X-User-Role: ADMIN</option>
              </select>
            </div>
          </div>

          {/* JSON Body */}
          {['POST', 'PUT', 'PATCH'].includes(method) && (
            <div className="form-group">
              <label className="form-label">Request Body (JSON)</label>
              <textarea
                rows={9}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder='{ "key": "value" }'
                className="form-control"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
              />
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
          >
            {loading ? 'Executing HTTP Request via Gateway...' : `🚀 Send ${method} Request`}
          </button>
        </div>

        {/* Response Viewer */}
        <div className="card" style={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'white' }}>Response Inspector</h3>
            {response && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span className={`badge ${response.ok ? 'badge-success' : 'badge-danger'}`}>
                  HTTP {response.status}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                  {response.duration}ms
                </span>
              </div>
            )}
          </div>

          {response ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Response Headers:
                </div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#cbd5e1', backgroundColor: '#1e293b', padding: '8px', borderRadius: '4px' }}>
                  {Object.entries(response.headers || {}).slice(0, 5).map(([k, v]) => (
                    <div key={k}>{k}: {v}</div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Response Payload:
                </div>
                <pre style={{
                  margin: 0,
                  padding: '12px',
                  backgroundColor: '#1e293b',
                  borderRadius: '4px',
                  fontSize: '0.775rem',
                  fontFamily: 'var(--font-mono)',
                  maxHeight: '340px',
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#64748b', fontSize: '0.85rem' }}>
              Select a template or configure a request and click Send.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
