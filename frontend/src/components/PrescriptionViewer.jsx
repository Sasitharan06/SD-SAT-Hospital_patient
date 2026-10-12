// frontend/src/components/PrescriptionViewer.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function PrescriptionViewer({ preselectedAppt, currentUser }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Prescription modal state
  const [showCreateModal, setShowCreateModal] = useState(!!preselectedAppt);
  const [formData, setFormData] = useState({
    appointment_id: preselectedAppt?.id || 'apt-301',
    doctor_id: preselectedAppt?.doctor_id || 'doc-201',
    patient_id: preselectedAppt?.patient_id || 'pat-101',
    diagnosis: '',
    notes: '',
    medicines: [
      { medicine_name: 'Amoxicillin Trihydrate', dosage: '500 mg', frequency: 'Three times daily after food', duration: '5 days', instructions: 'Finish full antibiotic course.' }
    ]
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  useEffect(() => {
    if (preselectedAppt) {
      setFormData(prev => ({
        ...prev,
        appointment_id: preselectedAppt.id,
        doctor_id: preselectedAppt.doctor_id,
        patient_id: preselectedAppt.patient_id
      }));
      setShowCreateModal(true);
    }
  }, [preselectedAppt]);

  async function loadPrescriptions() {
    setLoading(true);
    try {
      const res = await api.getPrescriptions();
      if (res.ok && res.data?.data) {
        setPrescriptions(res.data.data);
        if (res.data.data.length > 0 && !selectedPrescription) {
          setSelectedPrescription(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleAddMedicineRow() {
    setFormData({
      ...formData,
      medicines: [
        ...formData.medicines,
        { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    });
  }

  function handleRemoveMedicineRow(index) {
    if (formData.medicines.length <= 1) return;
    setFormData({
      ...formData,
      medicines: formData.medicines.filter((_, idx) => idx !== index)
    });
  }

  function handleMedicineChange(index, field, value) {
    const updated = [...formData.medicines];
    updated[index][field] = value;
    setFormData({ ...formData, medicines: updated });
  }

  async function handleCreatePrescription(e) {
    e.preventDefault();
    setModalError(null);

    // Verify role (RBAC)
    if (currentUser.role !== 'DOCTOR' && currentUser.role !== 'ADMIN') {
      setModalError('RBAC Alert: Only users with DOCTOR or ADMIN role can issue prescriptions. Switch role in the sidebar.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createPrescription(formData);
      if (res.ok) {
        setShowCreateModal(false);
        loadPrescriptions();
        setSelectedPrescription(res.data.data);
      } else {
        setModalError(res.data?.message || 'Failed to issue prescription.');
      }
    } catch (err) {
      setModalError('Network error connecting to Prescription Service.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Digital Prescription Platform</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Generated via Prescription Service (Port 3004) with RBAC authorization
            </p>
          </div>

          <button
            onClick={() => {
              setModalError(null);
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
          >
            ✍️ Issue New Prescription
          </button>
        </div>
      </div>

      {/* Main Grid: Selector & Paper Letterhead */}
      <div className="grid-2" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Prescription List Column */}
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>
            Prescription Records ({prescriptions.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>Loading Rx records...</div>
            ) : prescriptions.length === 0 ? (
              <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>No digital prescriptions yet.</div>
            ) : (
              prescriptions.map(prx => (
                <div
                  key={prx.id}
                  onClick={() => setSelectedPrescription(prx)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: selectedPrescription?.id === prx.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: selectedPrescription?.id === prx.id ? 'var(--primary-light)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-dark)' }}>
                      #{prx.id}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(prx.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '0.85rem', marginTop: '4px' }}>
                    {prx.patient?.name || prx.patient_id}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Doctor: {prx.doctor?.name || prx.doctor_id}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--secondary)', marginTop: '4px', fontWeight: 500 }}>
                    Dx: {prx.diagnosis}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Prescription Paper Display (Healthcare Letterhead) */}
        {selectedPrescription ? (
          <div className="card" style={{
            padding: '36px',
            backgroundColor: '#ffffff',
            border: '2px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Letterhead Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0369a1', margin: 0 }}>
                  {selectedPrescription.doctor?.name || 'Dr. Medical Specialist'}
                </h2>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  {selectedPrescription.doctor?.specialty || 'General Practitioner'} • Reg No: MED-IN-98442
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                  Medicare Hospital & Polyclinic, Central Medical Center
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-success" style={{ marginBottom: '6px' }}>Verified Digital Rx</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>
                  Rx #{selectedPrescription.id}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Date: {new Date(selectedPrescription.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Patient Demographic Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Patient Name:</span>
                <div><strong>{selectedPrescription.patient?.name || 'Rahul Sharma'}</strong></div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Blood Group:</span>
                <div><strong>{selectedPrescription.patient?.blood_group || 'O+'}</strong></div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Appt Reference:</span>
                <div><code style={{ fontSize: '0.75rem' }}>{selectedPrescription.appointment_id}</code></div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Contact:</span>
                <div><strong>{selectedPrescription.patient?.email || 'patient@example.com'}</strong></div>
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.05em' }}>
                Clinical Diagnosis
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>
                {selectedPrescription.diagnosis}
              </div>
            </div>

            {/* Prescription Medicines Table */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>℞</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Prescribed Medication Schedule
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>#</th>
                    <th style={{ padding: '8px 12px' }}>Medicine Name</th>
                    <th style={{ padding: '8px 12px' }}>Dosage</th>
                    <th style={{ padding: '8px 12px' }}>Frequency</th>
                    <th style={{ padding: '8px 12px' }}>Duration</th>
                    <th style={{ padding: '8px 12px' }}>Special Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedPrescription.medicines || []).map((med, idx) => (
                    <tr key={med.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-main)' }}>{med.medicine_name}</td>
                      <td style={{ padding: '10px 12px' }}><span className="badge badge-primary">{med.dosage}</span></td>
                      <td style={{ padding: '10px 12px' }}>{med.frequency}</td>
                      <td style={{ padding: '10px 12px' }}>{med.duration}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{med.instructions || 'As advised'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Doctor Advice / Notes */}
            {selectedPrescription.notes && (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>General Physician Advice</div>
                <div style={{ fontSize: '0.825rem', color: '#78350f', marginTop: '4px' }}>{selectedPrescription.notes}</div>
              </div>
            )}

            {/* Doctor Signature Block & Print button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <button
                onClick={() => window.print()}
                className="btn btn-outline btn-sm"
              >
                🖨️ Print Prescription
              </button>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', color: '#0369a1', marginBottom: '4px' }}>
                  Dr. {selectedPrescription.doctor?.name || 'Physician'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-color)', paddingTop: '4px' }}>
                  Digitally Authorized & Timestamped
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
            Select a prescription from the left to view full digital details.
          </div>
        )}
      </div>

      {/* New Prescription Creation Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Issue Digital Prescription</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Service: Prescription Service (Port 3004) • Role Check: DOCTOR
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-outline btn-sm">✕</button>
            </div>

            {modalError && (
              <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', color: '#991b1b', fontSize: '0.825rem', marginBottom: '16px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreatePrescription}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Appointment Reference ID</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.appointment_id}
                    onChange={e => setFormData({ ...formData, appointment_id: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Diagnosis</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute Bronchitis, Migraine Aura"
                    className="form-control"
                    value={formData.diagnosis}
                    onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                  />
                </div>
              </div>

              {/* Medicine Items Dynamic Section */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Prescription Medicines ({formData.medicines.length})</label>
                  <button
                    type="button"
                    onClick={handleAddMedicineRow}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem' }}
                  >
                    + Add Another Medicine
                  </button>
                </div>

                {formData.medicines.map((med, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-muted)',
                    marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>Medicine #{idx + 1}</span>
                      {formData.medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicineRow(idx)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid-2">
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <input
                          type="text"
                          required
                          placeholder="Medicine Name (e.g. Paracetamol)"
                          className="form-control"
                          value={med.medicine_name}
                          onChange={e => handleMedicineChange(idx, 'medicine_name', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <input
                          type="text"
                          required
                          placeholder="Dosage (e.g. 500mg, 10ml)"
                          className="form-control"
                          value={med.dosage}
                          onChange={e => handleMedicineChange(idx, 'dosage', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid-2">
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <input
                          type="text"
                          required
                          placeholder="Frequency (e.g. Twice daily after meals)"
                          className="form-control"
                          value={med.frequency}
                          onChange={e => handleMedicineChange(idx, 'frequency', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <input
                          type="text"
                          required
                          placeholder="Duration (e.g. 5 days)"
                          className="form-control"
                          value={med.duration}
                          onChange={e => handleMedicineChange(idx, 'duration', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <input
                        type="text"
                        placeholder="Instructions (e.g. Take with warm water)"
                        className="form-control"
                        value={med.instructions}
                        onChange={e => handleMedicineChange(idx, 'instructions', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Physician Advice */}
              <div className="form-group">
                <label className="form-label">Doctor Notes / Lifestyle Advice</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Dietary precautions, follow-up timeline, warning signs..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Generating Rx via Gateway...' : 'Issue Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
