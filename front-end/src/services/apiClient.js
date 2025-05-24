// src/services/apiClient.js
import axios from '../axios';

class PatientApiClient {
  constructor() {
    this.getAuthHeaders = () => ({
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
  }

  // Appointments
  async getAppointments() {
    const response = await axios.get("/api/patient/appointments", this.getAuthHeaders());
    return response.data.appointments || [];
  }

  async createAppointment(appointmentData) {
    const response = await axios.post("/api/patient/appointments", appointmentData, this.getAuthHeaders());
    return response.data;
  }

  async updateAppointment(id, appointmentData) {
    const response = await axios.put(`/api/patient/appointments/${id}`, appointmentData, this.getAuthHeaders());
    return response.data;
  }

  async cancelAppointment(id) {
    const response = await axios.delete(`/api/patient/appointments/${id}`, this.getAuthHeaders());
    return response.data;
  }

  // Medical Records
  async getMedicalRecords() {
    const response = await axios.get("/api/patient/medical-records", this.getAuthHeaders());
    return response.data.medicalRecords || [];
  }

  async downloadDocument(id) {
    return axios.get(`/api/patient/documents/${id}/download`, {
      ...this.getAuthHeaders(),
      responseType: "blob"
    });
  }

  // Prescriptions
  async getPrescriptions() {
    const response = await axios.get("/api/patient/prescriptions", this.getAuthHeaders());
    return response.data.prescriptions || [];
  }

  async downloadPrescriptionPdf(id) {
    return axios.get(`/api/patient/prescriptions/${id}/download-pdf`, {
      ...this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  // Profile
  async getProfile() {
    const response = await axios.get("/api/patient/profile", this.getAuthHeaders());
    return response.data.profile || null;
  }

  async updateProfile(profileData) {
    const response = await axios.put("/api/patient/profile", profileData, this.getAuthHeaders());
    return response.data;
  }

  async updateProfilePhoto(photoFile) {
    const formData = new FormData();
    formData.append("profile_photo", photoFile);
    
    const response = await axios.post("/api/patient/profile/photo", formData, {
      ...this.getAuthHeaders(),
      headers: {
        ...this.getAuthHeaders().headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  // Invoices
  async getInvoices(params = {}) {
    const response = await axios.get("/api/patient/invoices", {
      ...this.getAuthHeaders(),
      params,
    });
    return response.data.invoices?.data || [];
  }

  async getInvoice(id) {
    const response = await axios.get(`/api/patient/invoices/${id}`, this.getAuthHeaders());
    return response.data.invoice;
  }

  async downloadInvoicePdf(id) {
    return axios.get(`/api/patient/invoices/${id}/download-pdf`, {
      ...this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  // Doctors and Services
  async getDoctors() {
    const response = await axios.get("/api/doctors", this.getAuthHeaders());
    return response.data || [];
  }

  async getServices() {
    const response = await axios.get('/api/patient/services', this.getAuthHeaders());
    return response.data.services || [];
  }

  async getDoctorsByService(serviceId) {
    const response = await axios.get(`/api/patient/services/${serviceId}/doctors`, this.getAuthHeaders());
    return response.data.doctors || [];
  }

  async getDoctorSchedules(doctorId) {
    const response = await axios.get(`/api/patient/doctors/${doctorId}/schedules`, this.getAuthHeaders());
    return response.data.schedules || [];
  }

  async getDoctorAvailability(doctorId, date) {
    const response = await axios.get(`/api/doctors/${doctorId}/availability`, {
      params: { date }
    });
    return response.data;
  }

  async getDoctorMonthlyAvailability(doctorId, month, year) {
    const response = await axios.get(`/api/doctors/${doctorId}/monthly-availability`, {
      params: { month, year }
    });
    return response.data;
  }

  // Payments
  async processPayment(paymentData) {
    const response = await axios.post('/api/patient/payments/process', paymentData, this.getAuthHeaders());
    return response.data;
  }
}

export default new PatientApiClient();