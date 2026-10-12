// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import DoctorDirectory from './components/DoctorDirectory';
import AppointmentBooking from './components/AppointmentBooking';
import AppointmentList from './components/AppointmentList';
import PrescriptionViewer from './components/PrescriptionViewer';
import GatewayDemo from './components/GatewayDemo';
import SystemDesign from './components/SystemDesign';
import ApiTester from './components/ApiTester';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [gatewayOnline, setGatewayOnline] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    role: 'PATIENT',
    id: 'pat-101',
    name: 'Rahul Sharma (Patient)'
  });

  // Cross-component workflow state
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
  const [selectedApptForRx, setSelectedApptForRx] = useState(null);

  useEffect(() => {
    // Keep API client user in sync with role switcher
    api.setCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    checkGatewayHealth();
    const interval = setInterval(checkGatewayHealth, 4000);
    return () => clearInterval(interval);
  }, []);

  async function checkGatewayHealth() {
    try {
      const res = await api.getGatewayHealth();
      setGatewayOnline(res.ok && res.data?.status === 'UP');
    } catch (e) {
      setGatewayOnline(false);
    }
  }

  function handleSelectDoctorForBooking(doctor) {
    setSelectedDoctorForBooking(doctor);
    setActiveTab('book-appointment');
  }

  function handleOpenPrescription(appointmentId) {
    setActiveTab('prescriptions');
  }

  function handleCreatePrescriptionForAppt(appt) {
    setSelectedApptForRx(appt);
    setActiveTab('prescriptions');
  }

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        gatewayStatus={gatewayOnline}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Navbar Header */}
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'doctors' && 'Certified Doctor Directory'}
              {activeTab === 'book-appointment' && 'Book Specialist Consultation'}
              {activeTab === 'appointments' && 'Appointment Scheduling & History'}
              {activeTab === 'prescriptions' && 'Digital Prescription System'}
              {activeTab === 'gateway-demo' && 'API Gateway Routing & Health'}
              {activeTab === 'system-design' && 'Round 2 LLD & Round 3 HLD Blueprint'}
              {activeTab === 'api-tester' && 'Interactive API Postman Workbench'}
            </span>
            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
              Round 2 + Round 3 Exam
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Gateway ping pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.75rem',
              backgroundColor: 'var(--bg-muted)',
              padding: '6px 12px',
              borderRadius: '9999px'
            }}>
              <span className={`pulse-dot ${gatewayOnline ? '' : 'down'}`}></span>
              <span>API Gateway :3000</span>
              <strong style={{ color: gatewayOnline ? 'var(--success)' : 'var(--danger)' }}>
                {gatewayOnline ? 'CONNECTED' : 'DISCONNECTED'}
              </strong>
            </div>

            {/* Current user badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: currentUser.role === 'DOCTOR' ? 'var(--secondary)' : 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                {currentUser.role === 'DOCTOR' ? 'Dr' : 'P'}
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                <div style={{ fontWeight: '600', lineHeight: 1 }}>{currentUser.name}</div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Role: {currentUser.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content Body */}
        <div className="content-body">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              setActiveTab={setActiveTab}
              onSelectDoctorForBooking={handleSelectDoctorForBooking}
            />
          )}

          {activeTab === 'doctors' && (
            <DoctorDirectory
              onSelectDoctorForBooking={handleSelectDoctorForBooking}
            />
          )}

          {activeTab === 'book-appointment' && (
            <AppointmentBooking
              selectedDoctor={selectedDoctorForBooking}
              onBookingSuccess={() => {}}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentList
              currentUser={currentUser}
              onOpenPrescription={handleOpenPrescription}
              onCreatePrescriptionForAppt={handleCreatePrescriptionForAppt}
            />
          )}

          {activeTab === 'prescriptions' && (
            <PrescriptionViewer
              preselectedAppt={selectedApptForRx}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'gateway-demo' && (
            <GatewayDemo />
          )}

          {activeTab === 'system-design' && (
            <SystemDesign />
          )}

          {activeTab === 'api-tester' && (
            <ApiTester />
          )}
        </div>
      </main>
    </div>
  );
}
