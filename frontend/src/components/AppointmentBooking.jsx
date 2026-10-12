// frontend/src/components/AppointmentBooking.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function AppointmentBooking({ selectedDoctor, onBookingSuccess }) {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctorId, setDoctorId] = useState(selectedDoctor?.id || '');
  const [patientId, setPatientId] = useState('pat-101');
  const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  // New patient registration modal state
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '1998-05-10',
    gender: 'Male',
    blood_group: 'B+',
    address: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDoctor?.id) {
      setDoctorId(selectedDoctor.id);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (doctorId && date) {
      fetchAvailability(doctorId, date);
    }
  }, [doctorId, date]);

  async function loadInitialData() {
    try {
      const [docsRes, patsRes] = await Promise.all([
        api.getDoctors(),
        api.getPatients()
      ]);
      if (docsRes.ok && docsRes.data?.data) {
        setDoctors(docsRes.data.data);
        if (!doctorId && docsRes.data.data.length > 0) {
          setDoctorId(docsRes.data.data[0].id);
        }
      }
      if (patsRes.ok && patsRes.data?.data) {
        setPatients(patsRes.data.data);
      }
    } catch (e) {
      console.error('Error loading initial booking data:', e);
    }
  }

  async function fetchAvailability(docId, targetDate) {
    setLoadingSlots(true);
    setAlert(null);
    try {
      const res = await api.getDoctorAvailability(docId, targetDate);
      if (res.ok && res.data?.data?.slots) {
        setSlots(res.data.data.slots);
        // Find first available slot
        const firstAvail = res.data.data.slots.find(s => s.isAvailable);
        setSelectedSlot(firstAvail ? firstAvail.time : '');
      }
    } catch (e) {
      console.error('Error fetching availability:', e);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setAlert(null);
    setConfirmation(null);

    if (!selectedSlot) {
      setAlert({ type: 'danger', message: 'Please select an available consultation slot.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createAppointment({
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: date,
        appointment_time: selectedSlot,
        symptoms
      });

      if (res.ok) {
        setConfirmation(res.data.data);
        setAlert({
          type: 'success',
          message: `Appointment confirmed successfully! Appointment ID: ${res.data.data.id}`
        });
        // Refresh slots to reflect lock
        fetchAvailability(doctorId, date);
        if (onBookingSuccess) onBookingSuccess(res.data.data);
      } else {
        // Concurrency duplicate lock handled here (HTTP 409 Conflict)
        setAlert({
          type: 'danger',
          status: res.status,
          message: res.data?.message || 'Failed to book appointment.'
        });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Unexpected connection error while booking.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterPatient(e) {
    e.preventDefault();
    try {
      const res = await api.createPatient(newPatient);
      if (res.ok) {
        setPatients(prev => [res.data.data, ...prev]);
        setPatientId(res.data.data.id);
        setShowNewPatientModal(false);
        setAlert({ type: 'success', message: `Patient ${res.data.data.name} registered successfully.` });
      } else {
        alert(res.data?.message || 'Error creating patient.');
      }
    } catch (e) {
      alert('Network error registering patient.');
    }
  }

  const currentDoctor = doctors.find(d => d.id === doctorId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Book Doctor Appointment</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
          Directs to API Gateway (Port 3000) &rarr; Appointment Service (Port 3003) with concurrency locking
        </p>
      </div>

      {/* Confirmation Banner */}
      {confirmation && (
        <div className="card" style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#15803d', margin: 0 }}>
              Appointment Confirmed: {confirmation.id}
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#166534', margin: 0 }}>
            Booked for <strong>{confirmation.patient?.name}</strong> with <strong>{confirmation.doctor?.name}</strong> on <strong>{confirmation.appointment_date}</strong> at <strong>{confirmation.appointment_time}</strong>.
            An asynchronous confirmation event was dispatched to the Notification Service!
          </p>
        </div>
      )}

      {/* Error Alert */}
      {alert && alert.type === 'danger' && (
        <div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>⚠️</span>
            <div>
              <strong style={{ color: '#b91c1c' }}>
                {alert.status === 409 ? 'Slot Conflict (Double-Booking Prevented)' : 'Validation / Booking Error'}
              </strong>
              <div style={{ fontSize: '0.85rem', color: '#991b1b', marginTop: '2px' }}>
                {alert.message}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Booking Form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* Doctor Picker */}
            <div className="form-group">
              <label className="form-label">Select Medical Specialist</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="form-control"
                required
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialty} (₹{d.consultation_fee})
                  </option>
                ))}
              </select>
            </div>

            {/* Patient Picker with Add New button */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Select Patient</label>
                <button
                  type="button"
                  onClick={() => setShowNewPatientModal(true)}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                >
                  + New Patient
                </button>
              </div>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="form-control"
                required
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.gender}, {p.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="form-group">
              <label className="form-label">Consultation Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-control"
                required
              />
            </div>

            {/* Time Slot Picker */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Available Time Slots</label>
                {loadingSlots && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Refreshing slots...</span>}
              </div>

              {slots.length === 0 ? (
                <div style={{ padding: '12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  No slots found for this date.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {slots.map(slot => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlot(slot.time)}
                      className="btn btn-sm"
                      style={{
                        padding: '8px',
                        border: selectedSlot === slot.time ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        backgroundColor: !slot.isAvailable ? '#f1f5f9' : selectedSlot === slot.time ? 'var(--primary-light)' : 'white',
                        color: !slot.isAvailable ? '#94a3b8' : selectedSlot === slot.time ? 'var(--primary-dark)' : 'var(--text-main)',
                        textDecoration: !slot.isAvailable ? 'line-through' : 'none',
                        cursor: slot.isAvailable ? 'pointer' : 'not-allowed',
                        fontSize: '0.75rem',
                        fontWeight: selectedSlot === slot.time ? 700 : 500
                      }}
                    >
                      {slot.time}
                      {!slot.isAvailable && ' (Booked)'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Symptoms / Chief Complaint */}
            <div className="form-group">
              <label className="form-label">Symptoms / Reason for Visit</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms (e.g. persistent headache, mild fever, back ache)..."
                rows={3}
                className="form-control"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {submitting ? 'Confirming with Appointment Service...' : 'Confirm Appointment Booking'}
            </button>
          </form>
        </div>

        {/* Doctor Summary & Architecture Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {currentDoctor && (
            <div className="card" style={{ backgroundColor: 'var(--bg-muted)' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
                <img
                  src={currentDoctor.image_url}
                  alt={currentDoctor.name}
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0 }}>{currentDoctor.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>{currentDoctor.specialty}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentDoctor.qualification}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
                {currentDoctor.bio}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px', fontSize: '0.85rem' }}>
                <span>Consultation Fee:</span>
                <strong style={{ color: 'var(--secondary)', fontSize: '1rem' }}>₹{currentDoctor.consultation_fee}</strong>
              </div>
            </div>
          )}

          {/* LLD Double-Booking Lock Explanation */}
          <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '6px', color: '#b45309' }}>
              🔒 Round 2 (LLD) Slot Concurrency Guarantee
            </h4>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              The platform executes a transactional duplicate-slot verification:
              <br />
              <code>UNIQUE INDEX uq_doctor_active_slot ON appointments(doctor_id, appointment_date, appointment_time) WHERE status != 'CANCELLED'</code>
              <br />
              If concurrent users attempt to book the identical slot, the database rejects the second request with <strong>HTTP 409 Conflict</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* New Patient Registration Modal */}
      {showNewPatientModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Register New Patient</h3>
              <button onClick={() => setShowNewPatientModal(false)} className="btn btn-outline btn-sm">✕</button>
            </div>
            <form onSubmit={handleRegisterPatient}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={newPatient.name}
                  onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
                  placeholder="e.g. Siddharth Verma"
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    value={newPatient.email}
                    onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={newPatient.phone}
                    onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="+91-9876543210"
                  />
                </div>
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={newPatient.date_of_birth}
                    onChange={e => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-control"
                    value={newPatient.gender}
                    onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newPatient.blood_group}
                    onChange={e => setNewPatient({ ...newPatient, blood_group: e.target.value })}
                    placeholder="O+, A+, etc."
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Residential Address</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={newPatient.address}
                  onChange={e => setNewPatient({ ...newPatient, address: e.target.value })}
                  placeholder="City, State, Postal code..."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowNewPatientModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Select Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
