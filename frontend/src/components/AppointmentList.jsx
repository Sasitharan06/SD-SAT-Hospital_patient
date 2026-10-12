// frontend/src/components/AppointmentList.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function AppointmentList({ onOpenPrescription, onCreatePrescriptionForAppt, currentUser }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, [filterStatus]);

  async function loadAppointments() {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'ALL') params.status = filterStatus;
      const res = await api.getAppointments(params);
      if (res.ok && res.data?.data) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id) {
    if (!window.confirm(`Are you sure you want to cancel appointment ${id}? This will release the slot for other patients.`)) {
      return;
    }

    setCancellingId(id);
    setMessage(null);
    try {
      const res = await api.cancelAppointment(id, 'Patient requested cancellation');
      if (res.ok) {
        setMessage({ type: 'success', text: `Appointment ${id} cancelled. The time slot has been released for reuse!` });
        loadAppointments();
      } else {
        setMessage({ type: 'danger', text: res.data?.message || 'Failed to cancel appointment.' });
      }
    } catch (e) {
      setMessage({ type: 'danger', text: 'Error connecting to Gateway / Appointment Service.' });
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Appointment Management</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Live records from Appointment Service (Port 3003) via API Gateway
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderRadius: '9999px', fontSize: '0.75rem', padding: '5px 12px' }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status banner */}
      {message && (
        <div className={`card`} style={{
          backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          borderColor: message.type === 'success' ? '#86efac' : '#fca5a5',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
          <span style={{ fontSize: '0.875rem', color: message.type === 'success' ? '#166534' : '#991b1b', fontWeight: 500 }}>
            {message.text}
          </span>
        </div>
      )}

      {/* Appointments List / Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Loading appointments via API Gateway...
        </div>
      ) : appointments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          No appointments found matching filter '{filterStatus}'.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {appointments.map(appt => (
            <div key={appt.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>
                      #{appt.id}
                    </span>
                    <span className={`badge ${
                      appt.status === 'CONFIRMED' ? 'badge-primary' :
                      appt.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'
                    }`}>
                      {appt.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 4px 0' }}>
                    {appt.doctor?.name || `Doctor ID: ${appt.doctor_id}`}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: '600', marginBottom: '8px' }}>
                    Specialty: {appt.doctor?.specialty || 'General Medicine'}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                    <div>👤 Patient: <strong>{appt.patient?.name || appt.patient_id}</strong></div>
                    <div>📅 Date: <strong>{appt.appointment_date}</strong></div>
                    <div>⏰ Slot: <strong>{appt.appointment_time}</strong></div>
                  </div>

                  {appt.symptoms && (
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', backgroundColor: 'var(--bg-muted)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Symptoms: </span>
                      <span style={{ color: 'var(--text-muted)' }}>{appt.symptoms}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {appt.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancel(appt.id)}
                      disabled={cancellingId === appt.id}
                      className="btn btn-danger btn-sm"
                    >
                      {cancellingId === appt.id ? 'Cancelling...' : 'Cancel Slot'}
                    </button>
                  )}

                  {/* Doctor Prescription Actions */}
                  {currentUser.role === 'DOCTOR' && appt.status !== 'CANCELLED' && (
                    <button
                      onClick={() => onCreatePrescriptionForAppt(appt)}
                      className="btn btn-secondary btn-sm"
                    >
                      ✍️ Issue Prescription
                    </button>
                  )}

                  {appt.status === 'COMPLETED' && (
                    <button
                      onClick={() => onOpenPrescription(appt.id)}
                      className="btn btn-outline btn-sm"
                    >
                      💊 View Digital Rx
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
