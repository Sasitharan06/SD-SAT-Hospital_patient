// frontend/src/components/GatewayDemo.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function GatewayDemo() {
  const [gatewayData, setGatewayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [testingRoute, setTestingRoute] = useState(null);
  const [recentTraffic, setRecentTraffic] = useState([]);

  useEffect(() => {
    fetchGatewayMeta();
    const interval = setInterval(fetchGatewayMeta, 4000);
    return () => clearInterval(interval);
  }, []);

  async function fetchGatewayMeta() {
    try {
      const res = await api.getGatewayServices();
      if (res.ok && res.data) {
        setGatewayData(res.data);
        if (res.data.recentTraffic) {
          setRecentTraffic(res.data.recentTraffic);
        }
      }
    } catch (e) {
      console.error('Error polling gateway meta:', e);
    } finally {
      setLoading(false);
    }
  }

  // Pre-configured live routes to test through Gateway (Port 3000)
  const testRoutes = [
    {
      title: 'Doctor Service Proxy',
      method: 'GET',
      route: '/api/doctors',
      targetService: 'Doctor Service (Port 3002)',
      description: 'Fetch certified doctor directory with Redis/In-Memory TTL cache'
    },
    {
      title: 'Patient Service Proxy',
      method: 'GET',
      route: '/api/patients',
      targetService: 'Patient Service (Port 3001)',
      description: 'Fetch patient registrations and demographics'
    },
    {
      title: 'Appointment Service Proxy',
      method: 'GET',
      route: '/api/appointments',
      targetService: 'Appointment Service (Port 3003)',
      description: 'Retrieve active scheduled appointments with slot lock status'
    },
    {
      title: 'Prescription Service Proxy',
      method: 'GET',
      route: '/api/prescriptions',
      targetService: 'Prescription Service (Port 3004)',
      description: 'Retrieve issued digital prescriptions and medicine schedules'
    },
    {
      title: 'Notification Service Proxy',
      method: 'GET',
      route: '/api/notifications',
      targetService: 'Notification Service (Port 3005)',
      description: 'Inspect asynchronous event queue notifications'
    },
    {
      title: 'Queue Stats (RabbitMQ)',
      method: 'GET',
      route: '/api/notifications/queue-stats',
      targetService: 'Notification Service (Port 3005)',
      description: 'Inspect message queue publish & consume counts'
    }
  ];

  async function runRouteTest(testItem) {
    setTestingRoute(testItem.route);
    setTestResult(null);

    const startTime = Date.now();
    try {
      const res = await api.testDirectRoute(testItem.method, testItem.route);
      const latency = Date.now() - startTime;

      setTestResult({
        ...testItem,
        gatewayUrl: `http://localhost:3000${testItem.route}`,
        statusCode: res.status,
        latency: `${latency}ms`,
        ok: res.ok,
        headers: res.headers,
        responseJson: res.data
      });
      // Refresh traffic log
      fetchGatewayMeta();
    } catch (err) {
      setTestResult({
        ...testItem,
        gatewayUrl: `http://localhost:3000${testItem.route}`,
        statusCode: 503,
        latency: 'Failed',
        ok: false,
        headers: {},
        responseJson: { error: 'Gateway Proxy Unreachable', message: err.message }
      });
    } finally {
      setTestingRoute(null);
    }
  }

  const services = gatewayData?.services || [
    { key: 'patients', name: 'Patient Service', port: 3001, route: '/api/patients', status: 'UP', description: 'Patient records & validation' },
    { key: 'doctors', name: 'Doctor Service', port: 3002, route: '/api/doctors', status: 'UP', description: 'Doctors & availability slots' },
    { key: 'appointments', name: 'Appointment Service', port: 3003, route: '/api/appointments', status: 'UP', description: 'Booking & duplicate concurrency locks' },
    { key: 'prescriptions', name: 'Prescription Service', port: 3004, route: '/api/prescriptions', status: 'UP', description: 'Digital Rx & medicine regimens' },
    { key: 'notifications', name: 'Notification Service', port: 3005, route: '/api/notifications', status: 'UP', description: 'Asynchronous event consumer (RabbitMQ)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-primary">Round 3: High-Level Design</span>
              <span className="badge badge-success">Express.js API Gateway</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>
              Live API Gateway Demonstration
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Every frontend HTTP call terminates at <code>http://localhost:3000</code> and is proxied using <code>http-proxy-middleware</code>.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--bg-muted)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-lg)'
          }}>
            <span className="pulse-dot"></span>
            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Gateway Endpoint
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                http://localhost:3000
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Request Flow Diagram */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>
          Visual Proxy Routing Pipeline
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '20px',
          backgroundColor: 'var(--bg-muted)',
          borderRadius: 'var(--radius-lg)'
        }}>
          {/* Step 1: Client */}
          <div style={{ textAlign: 'center', flex: 1, minWidth: '130px' }}>
            <div style={{ fontSize: '1.6rem' }}>💻</div>
            <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>React Client</div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Port 5173</div>
          </div>

          <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.2rem' }}>➔</div>

          {/* Step 2: Gateway */}
          <div style={{
            textAlign: 'center',
            flex: 1.4,
            minWidth: '170px',
            padding: '12px',
            backgroundColor: 'var(--primary-light)',
            border: '2px solid var(--primary)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ fontSize: '1.6rem' }}>🌐</div>
            <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--primary-dark)' }}>
              API Gateway
            </div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--primary-hover)' }}>
              Port 3000 (Proxy)
            </div>
          </div>

          <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.2rem' }}>➔</div>

          {/* Step 3: Matched Service */}
          <div style={{
            textAlign: 'center',
            flex: 1.4,
            minWidth: '170px',
            padding: '12px',
            backgroundColor: '#dcfce7',
            border: '2px solid #10b981',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ fontSize: '1.6rem' }}>⚙️</div>
            <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#166534' }}>
              Microservice (Target)
            </div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#15803d' }}>
              Port 3001-3005
            </div>
          </div>

          <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.2rem' }}>➔</div>

          {/* Step 4: Database / Cache */}
          <div style={{ textAlign: 'center', flex: 1, minWidth: '130px' }}>
            <div style={{ fontSize: '1.6rem' }}>🐘</div>
            <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>PostgreSQL / Redis</div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>ACID Storage</div>
          </div>
        </div>
      </div>

      {/* Backend Services Registry Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '14px' }}>
          Registered Backend Microservices Registry
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Service Name</th>
                <th style={{ padding: '10px 14px' }}>Port</th>
                <th style={{ padding: '10px 14px' }}>Gateway Route Prefix</th>
                <th style={{ padding: '10px 14px' }}>Upstream Target</th>
                <th style={{ padding: '10px 14px' }}>Health Status</th>
                <th style={{ padding: '10px 14px' }}>Responsibility</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.key || s.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-main)' }}>
                    {s.name}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>
                    <span className="badge badge-muted">:{s.port}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 600 }}>
                    {s.route}/*
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    http://localhost:{s.port}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className={`badge ${s.status === 'UP' ? 'badge-success' : 'badge-danger'}`}>
                      {s.status || 'UP'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {s.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Live Route Testing Buttons */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '6px' }}>
          Interactive Route Proxy Dispatcher
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Click any button below to trigger an actual live HTTP call through Gateway (Port 3000) to the designated microservice.
        </p>

        <div className="grid-3">
          {testRoutes.map((testItem, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-primary">{testItem.method}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{testItem.targetService}</span>
              </div>

              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{testItem.title}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.775rem', color: 'var(--primary)', marginTop: '2px' }}>
                  {testItem.route}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {testItem.description}
                </div>
              </div>

              <button
                onClick={() => runRouteTest(testItem)}
                disabled={testingRoute === testItem.route}
                className="btn btn-outline btn-sm"
                style={{ marginTop: 'auto', width: '100%' }}
              >
                {testingRoute === testItem.route ? 'Proxying Request...' : '⚡ Test Route via Gateway'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Live Test Result Inspector */}
      {testResult && (
        <div className="card" style={{
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`badge ${testResult.ok ? 'badge-success' : 'badge-danger'}`}>
                HTTP {testResult.statusCode}
              </span>
              <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{testResult.method} {testResult.gatewayUrl}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.775rem' }}>
              <span style={{ color: '#38bdf8' }}>Latency: {testResult.latency}</span>
              <span style={{ color: '#94a3b8' }}>Target: {testResult.targetService}</span>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>
            PROXY RESPONSE BODY (JSON):
          </div>
          <pre style={{
            margin: 0,
            padding: '12px',
            backgroundColor: '#1e293b',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {JSON.stringify(testResult.responseJson, null, 2)}
          </pre>
        </div>
      )}

      {/* Live Gateway Traffic Audit Log */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
            Recent Gateway Request Audit Log (Real-time Proxy Activity)
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Total Recorded: {recentTraffic.length}
          </span>
        </div>

        {recentTraffic.length === 0 ? (
          <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem' }}>
            Make requests to view real-time gateway audit entries.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recentTraffic.map((entry, idx) => (
              <div key={entry.id || idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-muted)',
                fontSize: '0.775rem',
                fontFamily: 'var(--font-mono)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{entry.method}</span>
                  <span>{entry.path}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span className={`badge ${entry.statusCode < 400 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                    {entry.statusCode}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{entry.duration}</span>
                  <span style={{ color: 'var(--text-light)' }}>{entry.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
