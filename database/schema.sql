-- ==========================================================
-- Online Doctor Appointment & Digital Prescription Platform
-- Round 2 (LLD) & Round 3 (HLD) PostgreSQL Schema
-- ==========================================================

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    blood_group VARCHAR(10),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    qualification VARCHAR(100) NOT NULL,
    experience_years INT NOT NULL,
    consultation_fee NUMERIC(10, 2) NOT NULL,
    available_days VARCHAR(150) NOT NULL, -- e.g. "Monday,Tuesday,Wednesday,Thursday,Friday"
    available_time_start TIME NOT NULL,  -- e.g. "09:00:00"
    available_time_end TIME NOT NULL,    -- e.g. "17:00:00"
    rating NUMERIC(2, 1) DEFAULT 4.8,
    image_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id VARCHAR(36) NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL, -- e.g. "10:00 AM"
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED', -- 'CONFIRMED', 'CANCELLED', 'COMPLETED'
    symptoms TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crucial LLD Concurrency Constraint:
-- Prevent double booking for the same doctor and time slot when status is NOT CANCELLED.
-- If an appointment is CANCELLED, this partial index allows the slot to be reused!
CREATE UNIQUE INDEX IF NOT EXISTS uq_doctor_active_slot 
ON appointments(doctor_id, appointment_date, appointment_time) 
WHERE status != 'CANCELLED';

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- 4. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(36) PRIMARY KEY,
    appointment_id VARCHAR(36) UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id VARCHAR(36) NOT NULL REFERENCES doctors(id),
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id),
    diagnosis TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);

-- 5. Prescription Medicines Table (1-to-N relation)
CREATE TABLE IF NOT EXISTS prescription_medicines (
    id VARCHAR(36) PRIMARY KEY,
    prescription_id VARCHAR(36) NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50) NOT NULL,      -- e.g. "500 mg"
    frequency VARCHAR(50) NOT NULL,   -- e.g. "Twice daily after food"
    duration VARCHAR(50) NOT NULL,    -- e.g. "5 days"
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_med_prescription ON prescription_medicines(prescription_id);

-- 6. Notifications Table (Event-driven asynchronous notification store)
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    recipient_type VARCHAR(20) NOT NULL, -- 'PATIENT', 'DOCTOR'
    recipient_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,           -- 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'PRESCRIPTION_GENERATED'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(20) DEFAULT 'IN_APP', -- 'IN_APP', 'EMAIL', 'SMS'
    status VARCHAR(20) DEFAULT 'DELIVERED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
