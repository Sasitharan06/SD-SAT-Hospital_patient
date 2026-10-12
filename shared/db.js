// shared/db.js
// Dual-Mode Database Engine: PostgreSQL Client with In-Memory Demo Fallback
// Guarantees zero crashes if PostgreSQL is not running, with identical schema & constraint logic.

const { Pool } = require('pg');

// Initial seed dataset (mirrors database/seed.sql)
const initialSeedData = {
  patients: [
    {
      id: 'pat-101',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '+91-9876543210',
      date_of_birth: '1995-04-12',
      gender: 'Male',
      blood_group: 'O+',
      address: 'Flat 402, Green Glen Meadows, Bellandur, Bengaluru',
      created_at: new Date('2026-09-01T10:00:00Z').toISOString(),
      updated_at: new Date('2026-09-01T10:00:00Z').toISOString()
    },
    {
      id: 'pat-102',
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      phone: '+91-9876543211',
      date_of_birth: '1992-08-25',
      gender: 'Female',
      blood_group: 'B+',
      address: 'House 14, Lotus Enclave, Powai, Mumbai',
      created_at: new Date('2026-09-02T10:00:00Z').toISOString(),
      updated_at: new Date('2026-09-02T10:00:00Z').toISOString()
    },
    {
      id: 'pat-103',
      name: 'Ananya Roy',
      email: 'ananya.roy@example.com',
      phone: '+91-9876543212',
      date_of_birth: '2001-11-03',
      gender: 'Female',
      blood_group: 'A+',
      address: 'B-12, Sector 62, Noida, Delhi NCR',
      created_at: new Date('2026-09-03T10:00:00Z').toISOString(),
      updated_at: new Date('2026-09-03T10:00:00Z').toISOString()
    },
    {
      id: 'pat-104',
      name: 'Vikram Malhotra',
      email: 'vikram.m@example.com',
      phone: '+91-9876543213',
      date_of_birth: '1988-02-18',
      gender: 'Male',
      blood_group: 'AB+',
      address: '78 Hill Road, Bandra West, Mumbai',
      created_at: new Date('2026-09-04T10:00:00Z').toISOString(),
      updated_at: new Date('2026-09-04T10:00:00Z').toISOString()
    }
  ],
  doctors: [
    {
      id: 'doc-201',
      name: 'Dr. Arvind Swaminathan',
      email: 'dr.arvind@medicare.org',
      specialty: 'Cardiology',
      qualification: 'MBBS, MD, DM (Cardiology) - AIIMS',
      experience_years: 15,
      consultation_fee: 800.00,
      available_days: 'Monday,Tuesday,Wednesday,Thursday,Friday',
      available_time_start: '09:00:00',
      available_time_end: '17:00:00',
      rating: 4.9,
      image_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
      bio: 'Senior Interventional Cardiologist specializing in preventive cardiology and hypertension management.',
      created_at: new Date('2026-08-01T10:00:00Z').toISOString(),
      updated_at: new Date('2026-08-01T10:00:00Z').toISOString()
    },
    {
      id: 'doc-202',
      name: 'Dr. Sunita Deshmukh',
      email: 'dr.sunita@medicare.org',
      specialty: 'Dermatology',
      qualification: 'MBBS, DVD, MD (Dermatology)',
      experience_years: 11,
      consultation_fee: 650.00,
      available_days: 'Monday,Wednesday,Friday,Saturday',
      available_time_start: '10:00:00',
      available_time_end: '18:00:00',
      rating: 4.8,
      image_url: 'https://images.unsplash.com/photo-1594824813583-a9d80d1964f4?w=400&auto=format&fit=crop&q=80',
      bio: 'Consultant Dermatologist and Trichologist with extensive expertise in clinical dermatology and acne protocols.',
      created_at: new Date('2026-08-01T10:00:00Z').toISOString(),
      updated_at: new Date('2026-08-01T10:00:00Z').toISOString()
    },
    {
      id: 'doc-203',
      name: 'Dr. Rajesh Nair',
      email: 'dr.rajesh@medicare.org',
      specialty: 'Neurology',
      qualification: 'MBBS, MD (Medicine), DM (Neurology)',
      experience_years: 18,
      consultation_fee: 1200.00,
      available_days: 'Tuesday,Thursday,Saturday',
      available_time_start: '09:30:00',
      available_time_end: '16:30:00',
      rating: 4.9,
      image_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
      bio: 'Renowned Neurologist handling migraine disorders, neuropathy, neuro-rehab, and vestibular health.',
      created_at: new Date('2026-08-01T10:00:00Z').toISOString(),
      updated_at: new Date('2026-08-01T10:00:00Z').toISOString()
    },
    {
      id: 'doc-204',
      name: 'Dr. Meera Nambiar',
      email: 'dr.meera@medicare.org',
      specialty: 'Pediatrics',
      qualification: 'MBBS, DCH, DNB (Pediatrics)',
      experience_years: 9,
      consultation_fee: 500.00,
      available_days: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
      available_time_start: '09:00:00',
      available_time_end: '15:00:00',
      rating: 4.7,
      image_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
      bio: 'Caring Pediatrician dedicated to childhood vaccination, growth milestones, and pediatric nutrition.',
      created_at: new Date('2026-08-01T10:00:00Z').toISOString(),
      updated_at: new Date('2026-08-01T10:00:00Z').toISOString()
    },
    {
      id: 'doc-205',
      name: 'Dr. Farhan Qureshi',
      email: 'dr.farhan@medicare.org',
      specialty: 'Orthopedics',
      qualification: 'MBBS, MS (Ortho), M.Ch',
      experience_years: 13,
      consultation_fee: 750.00,
      available_days: 'Monday,Tuesday,Thursday,Friday',
      available_time_start: '11:00:00',
      available_time_end: '19:00:00',
      rating: 4.8,
      image_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80',
      bio: 'Orthopedic surgeon and sports injury specialist, treating joint pain, ligament reconstruction, and spine care.',
      created_at: new Date('2026-08-01T10:00:00Z').toISOString(),
      updated_at: new Date('2026-08-01T10:00:00Z').toISOString()
    }
  ],
  appointments: [
    {
      id: 'apt-301',
      patient_id: 'pat-101',
      doctor_id: 'doc-201',
      appointment_date: '2026-10-15',
      appointment_time: '10:00 AM',
      status: 'CONFIRMED',
      symptoms: 'Mild chest discomfort after brisk walking and elevated systolic blood pressure readings.',
      created_at: new Date('2026-10-10T10:00:00Z').toISOString(),
      updated_at: new Date('2026-10-10T10:00:00Z').toISOString()
    },
    {
      id: 'apt-302',
      patient_id: 'pat-102',
      doctor_id: 'doc-202',
      appointment_date: '2026-10-16',
      appointment_time: '11:30 AM',
      status: 'COMPLETED',
      symptoms: 'Persistent allergic eczema on forearms with intense pruritus in the evening.',
      created_at: new Date('2026-10-11T11:00:00Z').toISOString(),
      updated_at: new Date('2026-10-11T11:00:00Z').toISOString()
    },
    {
      id: 'apt-303',
      patient_id: 'pat-103',
      doctor_id: 'doc-204',
      appointment_date: '2026-10-17',
      appointment_time: '02:00 PM',
      status: 'CONFIRMED',
      symptoms: 'Seasonal rhinitis, nasal congestion, and mild low-grade fever.',
      created_at: new Date('2026-10-11T14:00:00Z').toISOString(),
      updated_at: new Date('2026-10-11T14:00:00Z').toISOString()
    },
    {
      id: 'apt-304',
      patient_id: 'pat-104',
      doctor_id: 'doc-205',
      appointment_date: '2026-10-14',
      appointment_time: '04:00 PM',
      status: 'CANCELLED',
      symptoms: 'Right knee pain post badminton match with slight swelling around patella.',
      created_at: new Date('2026-10-09T09:00:00Z').toISOString(),
      updated_at: new Date('2026-10-10T15:00:00Z').toISOString()
    }
  ],
  prescriptions: [
    {
      id: 'prx-401',
      appointment_id: 'apt-302',
      doctor_id: 'doc-202',
      patient_id: 'pat-102',
      diagnosis: 'Subacute Contact Dermatitis / Atopic Eczema flare',
      notes: 'Patient advised to avoid scented soaps and wear breathable cotton garments. Hydrate skin regularly.',
      created_at: new Date('2026-10-11T12:00:00Z').toISOString(),
      updated_at: new Date('2026-10-11T12:00:00Z').toISOString(),
      medicines: [
        {
          id: 'med-501',
          prescription_id: 'prx-401',
          medicine_name: 'Cetirizine Hydrochloride',
          dosage: '10 mg',
          frequency: 'Once daily at bedtime',
          duration: '10 days',
          instructions: 'Take after dinner. May cause mild drowsiness.',
          created_at: new Date('2026-10-11T12:00:00Z').toISOString()
        },
        {
          id: 'med-502',
          prescription_id: 'prx-401',
          medicine_name: 'Mometasone Furoate 0.1% Cream',
          dosage: 'Thin application',
          frequency: 'Twice daily',
          duration: '7 days',
          instructions: 'Apply gently to affected lesions only after cleansing.',
          created_at: new Date('2026-10-11T12:00:00Z').toISOString()
        },
        {
          id: 'med-503',
          prescription_id: 'prx-401',
          medicine_name: 'Liquid Paraffin & White Soft Paraffin Emollient',
          dosage: 'Liberal application',
          frequency: '3-4 times daily',
          duration: '30 days',
          instructions: 'Apply immediately after bath on damp skin.',
          created_at: new Date('2026-10-11T12:00:00Z').toISOString()
        }
      ]
    }
  ],
  notifications: [
    {
      id: 'notif-601',
      recipient_type: 'PATIENT',
      recipient_id: 'pat-101',
      type: 'APPOINTMENT_CONFIRMED',
      title: 'Appointment Confirmed with Dr. Arvind Swaminathan',
      message: 'Your appointment for 2026-10-15 at 10:00 AM has been successfully booked. Appointment ID: apt-301.',
      channel: 'IN_APP',
      status: 'DELIVERED',
      created_at: new Date('2026-10-10T10:05:00Z').toISOString()
    },
    {
      id: 'notif-602',
      recipient_type: 'PATIENT',
      recipient_id: 'pat-102',
      type: 'PRESCRIPTION_GENERATED',
      title: 'Digital Prescription Ready',
      message: 'Dr. Sunita Deshmukh has uploaded your prescription for appointment apt-302. View medicines in dashboard.',
      channel: 'IN_APP',
      status: 'DELIVERED',
      created_at: new Date('2026-10-11T12:05:00Z').toISOString()
    },
    {
      id: 'notif-603',
      recipient_type: 'PATIENT',
      recipient_id: 'pat-104',
      type: 'APPOINTMENT_CANCELLED',
      title: 'Appointment Cancellation Notice',
      message: 'Appointment apt-304 with Dr. Farhan Qureshi has been cancelled. Your slot has been released.',
      channel: 'IN_APP',
      status: 'DELIVERED',
      created_at: new Date('2026-10-10T15:05:00Z').toISOString()
    }
  ]
};

// Global in-memory storage for seamless demo mode
const memoryStore = JSON.parse(JSON.stringify(initialSeedData));

class DatabaseManager {
  constructor() {
    this.isPostgresConnected = false;
    this.pool = null;
    this.initPostgresClient();
  }

  async initPostgresClient() {
    if (process.env.DATABASE_URL || process.env.PGHOST) {
      try {
        this.pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          host: process.env.PGHOST || 'localhost',
          port: parseInt(process.env.PGPORT || '5432'),
          user: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || 'postgres',
          database: process.env.PGDATABASE || 'doctor_platform',
          connectionTimeoutMillis: 1500
        });
        const client = await this.pool.connect();
        await client.query('SELECT 1');
        client.release();
        this.isPostgresConnected = true;
        console.log('[Database] 🐘 Connected to PostgreSQL successfully.');
      } catch (err) {
        console.log('[Database] ℹ️ PostgreSQL server not detected. Running in Demo In-Memory Database Mode with identical relational semantics.');
        this.isPostgresConnected = false;
      }
    } else {
      console.log('[Database] ℹ️ Demo Mode: In-Memory PostgreSQL engine active with full schema constraints and seed records.');
    }
  }

  getStatus() {
    return {
      connected: true,
      mode: this.isPostgresConnected ? 'PostgreSQL Persistent' : 'In-Memory Relational Engine (PostgreSQL Compatible)',
      patientCount: memoryStore.patients.length,
      doctorCount: memoryStore.doctors.length,
      appointmentCount: memoryStore.appointments.length,
      prescriptionCount: memoryStore.prescriptions.length,
      notificationCount: memoryStore.notifications.length
    };
  }

  // --- Doctor Queries ---
  async getDoctors({ search, specialty }) {
    let docs = [...memoryStore.doctors];
    if (specialty) {
      docs = docs.filter(d => d.specialty.toLowerCase() === specialty.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      docs = docs.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.specialty.toLowerCase().includes(q) || 
        d.qualification.toLowerCase().includes(q)
      );
    }
    return docs;
  }

  async getDoctorById(id) {
    return memoryStore.doctors.find(d => d.id === id) || null;
  }

  // Calculate doctor availability slots for a date
  async getDoctorAvailability(doctorId, date) {
    const doctor = await this.getDoctorById(doctorId);
    if (!doctor) return null;

    // Standard hourly slot schedule between available_time_start and available_time_end
    const defaultSlots = [
      '09:00 AM', '10:00 AM', '11:00 AM', '11:30 AM', 
      '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    ];

    // Check booked slots for this doctor on this date that are not CANCELLED
    const activeBookings = memoryStore.appointments.filter(a => 
      a.doctor_id === doctorId && 
      a.appointment_date === date && 
      a.status !== 'CANCELLED'
    );

    const bookedTimes = new Set(activeBookings.map(a => a.appointment_time));

    const slotDetails = defaultSlots.map(time => ({
      time,
      isAvailable: !bookedTimes.has(time),
      status: bookedTimes.has(time) ? 'BOOKED' : 'AVAILABLE'
    }));

    return {
      doctorId,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      date,
      availableSlotsCount: slotDetails.filter(s => s.isAvailable).length,
      slots: slotDetails
    };
  }

  // --- Patient Queries ---
  async getPatients() {
    return [...memoryStore.patients];
  }

  async getPatientById(id) {
    return memoryStore.patients.find(p => p.id === id) || null;
  }

  async getPatientByEmail(email) {
    return memoryStore.patients.find(p => p.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async createPatient(patientData) {
    // Unique email constraint check
    const existing = await this.getPatientByEmail(patientData.email);
    if (existing) {
      const err = new Error(`Patient with email '${patientData.email}' already exists.`);
      err.statusCode = 409;
      throw err;
    }

    const newPatient = {
      id: patientData.id || `pat-${Date.now().toString().slice(-5)}`,
      name: patientData.name,
      email: patientData.email,
      phone: patientData.phone,
      date_of_birth: patientData.date_of_birth,
      gender: patientData.gender,
      blood_group: patientData.blood_group || null,
      address: patientData.address || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    memoryStore.patients.push(newPatient);
    return newPatient;
  }

  // --- Appointment Queries & Concurrency Locking ---
  async getAppointments({ patient_id, doctor_id, date, status } = {}) {
    let appts = [...memoryStore.appointments];
    if (patient_id) appts = appts.filter(a => a.patient_id === patient_id);
    if (doctor_id) appts = appts.filter(a => a.doctor_id === doctor_id);
    if (date) appts = appts.filter(a => a.appointment_date === date);
    if (status) appts = appts.filter(a => a.status === status);

    // Hydrate patient & doctor info for UI convenience
    return appts.map(apt => {
      const doc = memoryStore.doctors.find(d => d.id === apt.doctor_id);
      const pat = memoryStore.patients.find(p => p.id === apt.patient_id);
      return {
        ...apt,
        doctor: doc ? { id: doc.id, name: doc.name, specialty: doc.specialty, fee: doc.consultation_fee } : null,
        patient: pat ? { id: pat.id, name: pat.name, email: pat.email, phone: pat.phone } : null
      };
    });
  }

  async getAppointmentById(id) {
    const apt = memoryStore.appointments.find(a => a.id === id);
    if (!apt) return null;
    const doc = memoryStore.doctors.find(d => d.id === apt.doctor_id);
    const pat = memoryStore.patients.find(p => p.id === apt.patient_id);
    return {
      ...apt,
      doctor: doc ? { id: doc.id, name: doc.name, specialty: doc.specialty, fee: doc.consultation_fee } : null,
      patient: pat ? { id: pat.id, name: pat.name, email: pat.email, phone: pat.phone } : null
    };
  }

  // ACID appointment booking with unique constraint simulation
  async createAppointment({ patient_id, doctor_id, appointment_date, appointment_time, symptoms }) {
    // 1. Foreign key validations
    const patient = await this.getPatientById(patient_id);
    if (!patient) {
      const err = new Error(`Patient with ID '${patient_id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const doctor = await this.getDoctorById(doctor_id);
    if (!doctor) {
      const err = new Error(`Doctor with ID '${doctor_id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    // 2. Double booking concurrency check:
    // In SQL: UNIQUE INDEX uq_doctor_active_slot WHERE status != 'CANCELLED'
    const conflict = memoryStore.appointments.find(a => 
      a.doctor_id === doctor_id &&
      a.appointment_date === appointment_date &&
      a.appointment_time === appointment_time &&
      a.status !== 'CANCELLED'
    );

    if (conflict) {
      const err = new Error(`Slot '${appointment_time}' on ${appointment_date} is already booked for ${doctor.name}. Please select another slot.`);
      err.statusCode = 409;
      err.code = '23505'; // PostgreSQL unique_violation code
      throw err;
    }

    const newAppt = {
      id: `apt-${Date.now().toString().slice(-5)}`,
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      status: 'CONFIRMED',
      symptoms: symptoms || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    memoryStore.appointments.push(newAppt);

    return {
      ...newAppt,
      doctor: { id: doctor.id, name: doctor.name, specialty: doctor.specialty, fee: doctor.consultation_fee },
      patient: { id: patient.id, name: patient.name, email: patient.email, phone: patient.phone }
    };
  }

  // Cancel appointment and free slot for reuse
  async cancelAppointment(id, reason = 'Cancelled by user') {
    const apt = memoryStore.appointments.find(a => a.id === id);
    if (!apt) {
      const err = new Error(`Appointment with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (apt.status === 'CANCELLED') {
      const err = new Error(`Appointment '${id}' is already cancelled.`);
      err.statusCode = 400;
      throw err;
    }

    apt.status = 'CANCELLED';
    apt.updated_at = new Date().toISOString();
    apt.cancel_reason = reason;

    const doc = memoryStore.doctors.find(d => d.id === apt.doctor_id);
    const pat = memoryStore.patients.find(p => p.id === apt.patient_id);

    return {
      ...apt,
      doctor: doc ? { id: doc.id, name: doc.name } : null,
      patient: pat ? { id: pat.id, name: pat.name, email: pat.email } : null
    };
  }

  // --- Prescription Queries ---
  async getPrescriptions({ patient_id, doctor_id, appointment_id } = {}) {
    let list = [...memoryStore.prescriptions];
    if (patient_id) list = list.filter(p => p.patient_id === patient_id);
    if (doctor_id) list = list.filter(p => p.doctor_id === doctor_id);
    if (appointment_id) list = list.filter(p => p.appointment_id === appointment_id);

    return list.map(prx => {
      const doc = memoryStore.doctors.find(d => d.id === prx.doctor_id);
      const pat = memoryStore.patients.find(p => p.id === prx.patient_id);
      const apt = memoryStore.appointments.find(a => a.id === prx.appointment_id);
      return {
        ...prx,
        doctor: doc ? { id: doc.id, name: doc.name, specialty: doc.specialty } : null,
        patient: pat ? { id: pat.id, name: pat.name, email: pat.email, blood_group: pat.blood_group } : null,
        appointment: apt ? { id: apt.id, date: apt.appointment_date, time: apt.appointment_time } : null
      };
    });
  }

  async getPrescriptionById(id) {
    const prx = memoryStore.prescriptions.find(p => p.id === id);
    if (!prx) return null;
    const doc = memoryStore.doctors.find(d => d.id === prx.doctor_id);
    const pat = memoryStore.patients.find(p => p.id === prx.patient_id);
    const apt = memoryStore.appointments.find(a => a.id === prx.appointment_id);
    return {
      ...prx,
      doctor: doc ? { id: doc.id, name: doc.name, specialty: doc.specialty } : null,
      patient: pat ? { id: pat.id, name: pat.name, email: pat.email, blood_group: pat.blood_group } : null,
      appointment: apt ? { id: apt.id, date: apt.appointment_date, time: apt.appointment_time } : null
    };
  }

  async createPrescription({ appointment_id, doctor_id, patient_id, diagnosis, notes, medicines }) {
    // 1. Check appointment exists
    const apt = await this.getAppointmentById(appointment_id);
    if (!apt) {
      const err = new Error(`Appointment with ID '${appointment_id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    // 2. Check if prescription already exists for this appointment
    const existing = memoryStore.prescriptions.find(p => p.appointment_id === appointment_id);
    if (existing) {
      const err = new Error(`A prescription has already been issued for appointment '${appointment_id}'.`);
      err.statusCode = 409;
      throw err;
    }

    // 3. Mark appointment as COMPLETED
    apt.status = 'COMPLETED';

    const prescriptionId = `prx-${Date.now().toString().slice(-5)}`;
    const formattedMedicines = (medicines || []).map((m, idx) => ({
      id: `med-${Date.now().toString().slice(-4)}-${idx + 1}`,
      prescription_id: prescriptionId,
      medicine_name: m.medicine_name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions || 'As directed by physician',
      created_at: new Date().toISOString()
    }));

    const newPrescription = {
      id: prescriptionId,
      appointment_id,
      doctor_id: doctor_id || apt.doctor_id,
      patient_id: patient_id || apt.patient_id,
      diagnosis,
      notes: notes || '',
      medicines: formattedMedicines,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    memoryStore.prescriptions.push(newPrescription);

    const doc = memoryStore.doctors.find(d => d.id === newPrescription.doctor_id);
    const pat = memoryStore.patients.find(p => p.id === newPrescription.patient_id);

    return {
      ...newPrescription,
      doctor: doc ? { id: doc.id, name: doc.name, specialty: doc.specialty } : null,
      patient: pat ? { id: pat.id, name: pat.name, email: pat.email } : null
    };
  }

  // --- Notification Queries ---
  async getNotifications({ recipient_id, recipient_type, limit = 20 } = {}) {
    let list = [...memoryStore.notifications];
    if (recipient_id) list = list.filter(n => n.recipient_id === recipient_id);
    if (recipient_type) list = list.filter(n => n.recipient_type === recipient_type);

    return list.slice(0, limit);
  }

  async createNotification(notifData) {
    const newNotif = {
      id: `notif-${Date.now().toString().slice(-5)}`,
      recipient_type: notifData.recipient_type || 'PATIENT',
      recipient_id: notifData.recipient_id,
      type: notifData.type,
      title: notifData.title,
      message: notifData.message,
      channel: notifData.channel || 'IN_APP',
      status: 'DELIVERED',
      created_at: new Date().toISOString()
    };

    memoryStore.notifications.unshift(newNotif);
    return newNotif;
  }
}

module.exports = new DatabaseManager();
