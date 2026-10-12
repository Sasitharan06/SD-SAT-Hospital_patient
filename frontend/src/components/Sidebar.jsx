// frontend/src/components/Sidebar.jsx
import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, currentUser, setCurrentUser, gatewayStatus }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: '📊' },
    { id: 'doctors', label: 'Doctor Directory', icon: '👨‍⚕️' },
    { id: 'book-appointment', label: 'Book Appointment', icon: '📅' },
    { id: 'appointments', label: 'Appointment History', icon: '📋' },
    { id: 'prescriptions', label: 'Digital Prescriptions', icon: '💊' },
    { id: 'gateway-demo', label: 'API Gateway Demo', icon: '🌐', badge: 'HLD' },
    { id: 'system-design', label: 'System Architecture', icon: '🏗️', badge: 'LLD/HLD' },
    { id: 'api-tester', label: 'Live API Testing', icon: '⚡', badge: 'Postman' }
  ];

  const demoUsers = [
    { role: 'PATIENT', id: 'pat-101', name: 'Rahul Sharma (Patient)', badge: 'Patient' },
    { role: 'DOCTOR', id: 'doc-201', name: 'Dr. Arvind Swaminathan', badge: 'Doctor' },
    { role: 'ADMIN', id: 'adm-001', name: 'System Administrator', badge: 'Admin' }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(2, 132, 199, 0.3)'
          }}>
            ✚
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Medicare <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '700' }}>PRO</span>
            </h1>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
              LLD & HLD Architecture
            </p>
          </div>
        </div>

        {/* API Gateway Status Pill */}
        <div style={{
          marginTop: '14px',
          padding: '6px 12px',
          backgroundColor: 'var(--bg-muted)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem'
        }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`pulse-dot ${gatewayStatus ? '' : 'down'}`}></span>
            Gateway :3000
          </span>
          <span className={`badge ${gatewayStatus ? 'badge-success' : 'badge-danger'}`} style={{ padding: '1px 6px', fontSize: '0.675rem' }}>
            {gatewayStatus ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ padding: '16px 0', flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '0 20px 8px', fontSize: '0.725rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.05em' }}>
          Platform Navigation
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            style={{ width: 'calc(100% - 24px)', textAlign: 'left', border: 'none', background: 'transparent' }}
          >
            <span style={{ fontSize: '1.15rem' }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span className={`badge ${item.id.includes('gateway') ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Role Switcher (RBAC) */}
      <div style={{ padding: '16px 16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-muted)' }}>
        <div style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Simulated User Role (RBAC)
        </div>
        <select
          value={currentUser.id}
          onChange={(e) => {
            const user = demoUsers.find(u => u.id === e.target.value);
            if (user) setCurrentUser(user);
          }}
          className="form-control"
          style={{ fontSize: '0.8rem', padding: '8px 10px', backgroundColor: 'var(--bg-surface)' }}
        >
          {demoUsers.map(u => (
            <option key={u.id} value={u.id}>
              {u.name} [{u.role}]
            </option>
          ))}
        </select>
        <div style={{ marginTop: '6px', fontSize: '0.7rem', color: 'var(--text-light)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Active Role: <strong>{currentUser.role}</strong></span>
          <span>ID: <code>{currentUser.id}</code></span>
        </div>
      </div>
    </aside>
  );
}
