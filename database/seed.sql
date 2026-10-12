-- ==========================================================
-- Online Doctor Appointment & Digital Prescription Platform
-- Seed Data (Fictional Demo Records for College Viva & Exam)
-- ==========================================================

-- Seed Patients
INSERT INTO patients (id, name, email, phone, date_of_birth, gender, blood_group, address) VALUES
('pat-101', 'Rahul Sharma', 'rahul.sharma@example.com', '+91-9876543210', '1995-04-12', 'Male', 'O+', 'Flat 402, Green Glen Meadows, Bellandur, Bengaluru'),
('pat-102', 'Priya Patel', 'priya.patel@example.com', '+91-9876543211', '1992-08-25', 'Female', 'B+', 'House 14, Lotus Enclave, Powai, Mumbai'),
('pat-103', 'Ananya Roy', 'ananya.roy@example.com', '+91-9876543212', '2001-11-03', 'Female', 'A+', 'B-12, Sector 62, Noida, Delhi NCR'),
('pat-104', 'Vikram Malhotra', 'vikram.m@example.com', '+91-9876543213', '1988-02-18', 'Male', 'AB+', '78 Hill Road, Bandra West, Mumbai')
ON CONFLICT (id) DO NOTHING;

-- Seed Doctors
INSERT INTO doctors (id, name, email, specialty, qualification, experience_years, consultation_fee, available_days, available_time_start, available_time_end, rating, image_url, bio) VALUES
('doc-201', 'Dr. Arvind Swaminathan', 'dr.arvind@medicare.org', 'Cardiology', 'MBBS, MD, DM (Cardiology) - AIIMS', 15, 800.00, 'Monday,Tuesday,Wednesday,Thursday,Friday', '09:00:00', '17:00:00', 4.9, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80', 'Senior Interventional Cardiologist specializing in preventive cardiology and hypertension management.'),
('doc-202', 'Dr. Sunita Deshmukh', 'dr.sunita@medicare.org', 'Dermatology', 'MBBS, DVD, MD (Dermatology)', 11, 650.00, 'Monday,Wednesday,Friday,Saturday', '10:00:00', '18:00:00', 4.8, 'https://images.unsplash.com/photo-1594824813583-a9d80d1964f4?w=400&auto=format&fit=crop&q=80', 'Consultant Dermatologist and Trichologist with extensive expertise in clinical dermatology and acne protocols.'),
('doc-203', 'Dr. Rajesh Nair', 'dr.rajesh@medicare.org', 'Neurology', 'MBBS, MD (Medicine), DM (Neurology)', 18, 1200.00, 'Tuesday,Thursday,Saturday', '09:30:00', '16:30:00', 4.9, 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80', 'Renowned Neurologist handling migraine disorders, neuropathy, neuro-rehab, and vestibular health.'),
('doc-204', 'Dr. Meera Nambiar', 'dr.meera@medicare.org', 'Pediatrics', 'MBBS, DCH, DNB (Pediatrics)', 9, 500.00, 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday', '09:00:00', '15:00:00', 4.7, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80', 'Caring Pediatrician dedicated to childhood vaccination, growth milestones, and pediatric nutrition.'),
('doc-205', 'Dr. Farhan Qureshi', 'dr.farhan@medicare.org', 'Orthopedics', 'MBBS, MS (Ortho), M.Ch', 13, 750.00, 'Monday,Tuesday,Thursday,Friday', '11:00:00', '19:00:00', 4.8, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80', 'Orthopedic surgeon and sports injury specialist, treating joint pain, ligament reconstruction, and spine care.')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Appointments
INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, status, symptoms) VALUES
('apt-301', 'pat-101', 'doc-201', '2026-10-15', '10:00 AM', 'CONFIRMED', 'Mild chest discomfort after brisk walking and elevated systolic blood pressure readings.'),
('apt-302', 'pat-102', 'doc-202', '2026-10-16', '11:30 AM', 'COMPLETED', 'Persistent allergic eczema on forearms with intense pruritus in the evening.'),
('apt-303', 'pat-103', 'doc-204', '2026-10-17', '02:00 PM', 'CONFIRMED', 'Seasonal rhinitis, nasal congestion, and mild low-grade fever.'),
('apt-304', 'pat-104', 'doc-205', '2026-10-14', '04:00 PM', 'CANCELLED', 'Right knee pain post badminton match with slight swelling around patella.')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Prescription (for completed appointment apt-302)
INSERT INTO prescriptions (id, appointment_id, doctor_id, patient_id, diagnosis, notes) VALUES
('prx-401', 'apt-302', 'doc-202', 'pat-102', 'Subacute Contact Dermatitis / Atopic Eczema flare', 'Patient advised to avoid scented soaps and wear breathable cotton garments. Hydrate skin regularly.')
ON CONFLICT (id) DO NOTHING;

-- Seed Prescription Medicines
INSERT INTO prescription_medicines (id, prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES
('med-501', 'prx-401', 'Cetirizine Hydrochloride', '10 mg', 'Once daily at bedtime', '10 days', 'Take after dinner. May cause mild drowsiness.'),
('med-502', 'prx-401', 'Mometasone Furoate 0.1% Cream', 'Thin application', 'Twice daily', '7 days', 'Apply gently to affected lesions only after cleansing.'),
('med-503', 'prx-401', 'Liquid Paraffin & White Soft Paraffin Emollient', 'Liberal application', '3-4 times daily', '30 days', 'Apply immediately after bath on damp skin.')
ON CONFLICT (id) DO NOTHING;

-- Seed Notifications
INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, channel, status) VALUES
('notif-601', 'PATIENT', 'pat-101', 'APPOINTMENT_CONFIRMED', 'Appointment Confirmed with Dr. Arvind Swaminathan', 'Your appointment for 2026-10-15 at 10:00 AM has been successfully booked. Appointment ID: apt-301.', 'IN_APP', 'DELIVERED'),
('notif-602', 'PATIENT', 'pat-102', 'PRESCRIPTION_GENERATED', 'Digital Prescription Ready', 'Dr. Sunita Deshmukh has uploaded your prescription for appointment apt-302. View medicines in dashboard.', 'IN_APP', 'DELIVERED'),
('notif-603', 'PATIENT', 'pat-104', 'APPOINTMENT_CANCELLED', 'Appointment Cancellation Notice', 'Appointment apt-304 with Dr. Farhan Qureshi has been cancelled. Your slot has been released.', 'IN_APP', 'DELIVERED')
ON CONFLICT (id) DO NOTHING;
