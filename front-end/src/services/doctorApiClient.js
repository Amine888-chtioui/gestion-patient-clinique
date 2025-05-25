// src/services/doctorApiClient.js
import axios from '../axios';

class DoctorApiClient {
  constructor() {
    this.getAuthHeaders = () => ({
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
  }

  // User & Profile
  async getUser() {
    const response = await axios.get("/api/user", this.getAuthHeaders());
    return response.data;
  }

  async getProfile() {
    const response = await axios.get("/api/doctor/profile", this.getAuthHeaders());
    return response.data.profile;
  }

  async updateProfile(profileData) {
    const response = await axios.put("/api/doctor/profile", profileData, this.getAuthHeaders());
    return response.data;
  }

  async updateProfilePhoto(photoFile) {
    const formData = new FormData();
    formData.append("profile_photo", photoFile);
    
    const response = await axios.post("/api/doctor/profile/photo", formData, {
      ...this.getAuthHeaders(),
      headers: {
        ...this.getAuthHeaders().headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  // Appointments
  async getAppointments() {
    const response = await axios.get("/api/doctor/appointments", this.getAuthHeaders());
    return response.data.appointments || [];
  }

  async updateAppointmentStatus(id, status) {
    const response = await axios.put(`/api/doctor/appointments/${id}/status`, { status }, this.getAuthHeaders());
    return response.data;
  }

  // Patients
  async getPatients() {
    const response = await axios.get("/api/doctor/patients", this.getAuthHeaders());
    return response.data.patients || [];
  }

  async getPatientDetails(id) {
    const response = await axios.get(`/api/doctor/patients/${id}`, this.getAuthHeaders());
    return response.data.patient;
  }

  // Medical Records
  async getMedicalRecords() {
    const response = await axios.get("/api/doctor/medical-records", this.getAuthHeaders());
    return response.data.medicalRecords || [];
  }

  async createMedicalRecord(recordData) {
    const response = await axios.post("/api/doctor/medical-records", recordData, this.getAuthHeaders());
    return response.data;
  }

  // Prescriptions
  async getPrescriptions() {
    const response = await axios.get("/api/doctor/prescriptions", this.getAuthHeaders());
    return response.data.prescriptions || [];
  }

  async createPrescription(prescriptionData) {
    const response = await axios.post("/api/doctor/prescriptions", prescriptionData, this.getAuthHeaders());
    return response.data;
  }

  // Invoices
  async getInvoices() {
    const response = await axios.get("/api/doctor/invoices", this.getAuthHeaders());
    return response.data.invoices || [];
  }

  async getPatientInvoices(patientId) {
    const response = await axios.get(`/api/doctor/patients/${patientId}/invoices`, this.getAuthHeaders());
    return response.data.invoices || [];
  }

  // Documents
  async downloadDocument(id) {
    return axios.get(`/api/doctor/documents/${id}/download`, {
      ...this.getAuthHeaders(),
      responseType: "blob"
    });
  }

  // Schedules
  async getSchedules() {
    const response = await axios.get("/api/doctor/schedules", this.getAuthHeaders());
    return response.data.schedules || [];
  }

  async updateSchedules(schedules) {
    const response = await axios.post("/api/doctor/schedules", { schedules }, this.getAuthHeaders());
    return response.data;
  }

  // Services
  async getServices() {
    const response = await axios.get("/api/patient/services", this.getAuthHeaders());
    return response.data.services || [];
  }

  // Auth
  async logout() {
    return axios.post("/api/logout", {}, this.getAuthHeaders());
  }
}

export default new DoctorApiClient();