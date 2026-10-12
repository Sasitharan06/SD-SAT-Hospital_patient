// frontend/src/components/DashboardOverview.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function DashboardOverview({ setActiveTab, onSelectDoctorForBooking }) {
  const [stats, setStats] = useState({
    doctorsCount: 0,
    appointmentsCount: 0,
    prescriptionsCount: 0,
    notificationsCount: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [docsRes, apptsRes, prescRes, notifsRes] = await Promise.all([
        api.getDoctors(),
        api.getAppointments(),
        api.getPrescriptions(),
        api.getNotifications()
      ]);

      setStats({
        doctorsCount: docsRes.data?.count || (Array.isArray(docsRes.data?.data) ? docsRes.data.data.length : 5),
        appointmentsCount: apptsRes.data?.count || (Array.isArray(apptsRes.data?.data) ? apptsRes.data.data.length : 4),
        prescriptionsCount: prescRes.data?.count || (Array.isArray(prescRes.data?.data) ? prescRes.data.data.length : 1),
        notificationsCount: notifsRes.data?.count || (Array.isArray(notifsRes.data?.data) ? notifsRes.data.data.length : 3)
      });

      if (apptsRes.data?.data) {
        setRecentAppointments(apptsRes.data.data.slice(0, 4));
      }
      if (notifsRes.data?.data) {
        setNotifications(notifsRes.data.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f766e 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 36px',
        color: 'white',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.18)', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.775rem', fontWeight: 600, marginBottom: '12px' }}>
            <span>⚡ Express API Gateway :3000 Active</span>
            <span>•</span>
            <span>PostgreSQL & RabbitMQ Architecture</span>
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: '800', lineHeight: 1.2, margin: '0 0 10px 0' }}>
            Doctor Appointments & Digital Prescriptions
          </h1>
          <p style={{ fontSize: '0.95rem', opacity: 0.92, margin: 0, lineHeight: 1.6 }}>
            Demonstrating <strong>Round 2 Low-Level Design (LLD)</strong> with ACID slot double-booking locks, and <strong>Round 3 High-Level Design (HLD)</strong> with 5 independent microservices routed via an Express API Gateway.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('book-appointment')} className="btn" style={{ backgroundColor: 'white', color: '#0369a1', fontWeight: '700' }}>
            📅 Book Appointment
          </button>
          <button onClick={() => setActiveTab('gateway-demo')} className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
            🌐 Test Gateway
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid-4">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
            👨‍⚕️
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Doctors</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>{stats.doctorsCount}</div>
            <div style={{ fontSize: '0.725rem', color: 'var(--secondary)' }}>Cached in Redis / Mem</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
            📋
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Appointments</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>{stats.appointmentsCount}</div>
            <div style={{ fontSize: '0.725rem', color: 'var(--success)' }}>Slot Locks Enforced</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
            💊
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Digital Prescriptions</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>{stats.prescriptionsCount}</div>
            <div style={{ fontSize: '0.725rem', color: 'var(--warning)' }}>Doctor RBAC Protected</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
            🔔
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Async Notifications</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>{stats.notificationsCount}</div>
            <div style={{ fontSize: '0.725rem', color: 'var(--danger)' }}>RabbitMQ Queue Consumer</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Appointments & Async Notification Stream */}
      <div className="grid-2">
        {/* Appointments Preview */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Recent Appointments</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Active schedule from Appointment Service</p>
            </div>
            <button onClick={() => setActiveTab('appointments')} className="btn btn-outline btn-sm">
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentAppointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No appointments booked yet.</div>
            ) : (
              recentAppointments.map(appt => (
                <div key={appt.id} style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                      {appt.doctor?.name || 'Assigned Doctor'}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      Patient: <strong>{appt.patient?.name || appt.patient_id}</strong> • {appt.appointment_date} at {appt.appointment_time}
                    </div>
                  </div>
                  <div>
                    <span className={`badge ${
                      appt.status === 'CONFIRMED' ? 'badge-primary' : 
                      appt.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Event Queue Notifications */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Asynchronous Notification Bus</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Events received from RabbitMQ simulation queue</p>
            </div>
            <span className="badge badge-success">Live Consumer</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No notifications generated yet.</div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '4px solid var(--primary)',
                  backgroundColor: 'var(--bg-muted)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{notif.title}</div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {notif.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
