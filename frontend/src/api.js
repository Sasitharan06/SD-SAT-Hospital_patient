// frontend/src/api.js
// Centralized API Client - ALL REQUESTS ROUTED THROUGH API GATEWAY (Port 3000)

const GATEWAY_URL = 'http://localhost:3000';

class ApiClient {
  constructor() {
    this.baseUrl = GATEWAY_URL;
    this.currentUser = {
      role: 'PATIENT',
      id: 'pat-101',
      name: 'Rahul Sharma'
    };
  }

  setCurrentUser(user) {
    this.currentUser = user;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async request(endpoint, options = {}) {
    const startTime = Date.now();
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-User-Role': this.currentUser.role,
      'X-User-Id': this.currentUser.id,
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const duration = Date.now() - startTime;
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { message: await response.text() };
      }

      return {
        ok: response.ok,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        duration,
        data
      };
    } catch (err) {
      const duration = Date.now() - startTime;
      return {
        ok: false,
        status: 0,
        headers: {},
        duration,
        data: {
          error: 'Connection Failed',
          message: `Could not reach API Gateway at ${this.baseUrl}. Please ensure the gateway server is running on Port 3000.`
        }
      };
    }
  }

  // --- Doctor Endpoints ---
  async getDoctors(query = {}) {
    const searchParams = new URLSearchParams();
    if (query.search) searchParams.append('search', query.search);
    if (query.specialty && query.specialty !== 'All') searchParams.append('specialty', query.specialty);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/api/doctors${qs}`);
  }

  async getDoctorById(id) {
    return this.request(`/api/doctors/${id}`);
  }

  async getDoctorAvailability(id, date) {
    const qs = date ? `?date=${date}` : '';
    return this.request(`/api/doctors/${id}/availability${qs}`);
  }

  // --- Patient Endpoints ---
  async getPatients() {
    return this.request('/api/patients');
  }

  async getPatientById(id) {
    return this.request(`/api/patients/${id}`);
  }

  async createPatient(payload) {
    return this.request('/api/patients', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // --- Appointment Endpoints ---
  async getAppointments(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.patient_id) searchParams.append('patient_id', params.patient_id);
    if (params.doctor_id) searchParams.append('doctor_id', params.doctor_id);
    if (params.status) searchParams.append('status', params.status);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/api/appointments${qs}`);
  }

  async getAppointmentById(id) {
    return this.request(`/api/appointments/${id}`);
  }

  async createAppointment(payload) {
    return this.request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async cancelAppointment(id, reason = 'Cancelled by user') {
    return this.request(`/api/appointments/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  }

  // --- Prescription Endpoints ---
  async getPrescriptions(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.patient_id) searchParams.append('patient_id', params.patient_id);
    if (params.doctor_id) searchParams.append('doctor_id', params.doctor_id);
    if (params.appointment_id) searchParams.append('appointment_id', params.appointment_id);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/api/prescriptions${qs}`);
  }

  async getPrescriptionById(id) {
    return this.request(`/api/prescriptions/${id}`);
  }

  async createPrescription(payload) {
    return this.request('/api/prescriptions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // --- Notification Endpoints ---
  async getNotifications(params = {}) {
    return this.request('/api/notifications');
  }

  // --- Gateway Introspection & Health ---
  async getGatewayServices() {
    return this.request('/api/gateway/services');
  }

  async getGatewayHealth() {
    return this.request('/api/health');
  }

  async testDirectRoute(method, endpoint, body = null, customHeaders = {}) {
    const options = {
      method: method.toUpperCase(),
      headers: customHeaders
    };
    if (body && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    return this.request(endpoint, options);
  }
}

export const api = new ApiClient();
