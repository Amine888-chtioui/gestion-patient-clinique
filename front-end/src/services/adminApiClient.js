// src/services/adminApiClient.js - Version complète avec notifications
import axios from '../axios';

class AdminApiClient {
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
    const response = await axios.get("/api/admin/profile", this.getAuthHeaders());
    return response.data.profile;
  }

  async updateProfile(profileData) {
    const response = await axios.put("/api/admin/profile", profileData, this.getAuthHeaders());
    return response.data;
  }

  async updateProfilePhoto(photoFile) {
    const formData = new FormData();
    formData.append("profile_photo", photoFile);
    
    const response = await axios.post("/api/admin/profile/photo", formData, {
      ...this.getAuthHeaders(),
      headers: {
        ...this.getAuthHeaders().headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  async updatePassword(passwordData) {
    const response = await axios.put("/api/admin/password", passwordData, this.getAuthHeaders());
    return response.data;
  }

  // Statistics
  async getStatistics() {
    const response = await axios.get("/api/admin/statistics", this.getAuthHeaders());
    return response.data;
  }

  async getInvoiceStatistics() {
    const response = await axios.get("/api/admin/invoice-statistics", this.getAuthHeaders());
    return response.data;
  }

  // Patients
  async getPatients() {
    const response = await axios.get("/api/admin/patients", this.getAuthHeaders());
    return response.data.patients || [];
  }

  async createPatient(patientData) {
    const response = await axios.post("/api/admin/patients", patientData, this.getAuthHeaders());
    return response.data;
  }

  async updatePatient(id, patientData) {
    const response = await axios.put(`/api/admin/patients/${id}`, patientData, this.getAuthHeaders());
    return response.data;
  }

  async deletePatient(id) {
    const response = await axios.delete(`/api/admin/patients/${id}`, this.getAuthHeaders());
    return response.data;
  }

  // Doctors
  async getDoctors() {
    const response = await axios.get("/api/admin/doctors", this.getAuthHeaders());
    return response.data.doctors || [];
  }

  async createDoctor(doctorData) {
    const response = await axios.post("/api/admin/doctors", doctorData, this.getAuthHeaders());
    return response.data;
  }

  async updateDoctor(id, doctorData) {
    const response = await axios.put(`/api/admin/doctors/${id}`, doctorData, this.getAuthHeaders());
    return response.data;
  }

  async deleteDoctor(id) {
    const response = await axios.delete(`/api/admin/doctors/${id}`, this.getAuthHeaders());
    return response.data;
  }

  // Appointments - AVEC NOTIFICATIONS AUTOMATIQUES
  async getAppointments() {
    const response = await axios.get("/api/admin/appointments", this.getAuthHeaders());
    return response.data.appointments || [];
  }

  async createAppointment(appointmentData) {
    console.log("🔄 Création d'un rendez-vous par l'admin...");
    const response = await axios.post("/api/admin/appointments", appointmentData, this.getAuthHeaders());
    console.log("✅ Rendez-vous créé - Notifications envoyées automatiquement aux patient et médecin");
    return response.data;
  }

  async updateAppointment(id, appointmentData) {
    console.log("🔄 Modification d'un rendez-vous par l'admin...");
    const response = await axios.put(`/api/admin/appointments/${id}`, appointmentData, this.getAuthHeaders());
    console.log("✅ Rendez-vous modifié - Notifications envoyées selon les changements");
    return response.data;
  }

  async deleteAppointment(id) {
    console.log("🔄 Suppression d'un rendez-vous par l'admin...");
    const response = await axios.delete(`/api/admin/appointments/${id}`, this.getAuthHeaders());
    console.log("✅ Rendez-vous supprimé - Notifications d'annulation envoyées");
    return response.data;
  }

  // Medical Records - AVEC NOTIFICATIONS AUTOMATIQUES
  async getMedicalRecords() {
    const response = await axios.get("/api/admin/medical-records", this.getAuthHeaders());
    return response.data.medicalRecords || [];
  }

  async updateMedicalRecord(id, recordData) {
    console.log("🔄 Modification d'un dossier médical par l'admin...");
    const response = await axios.put(`/api/admin/medical-records/${id}`, recordData, this.getAuthHeaders());
    console.log("✅ Dossier médical modifié - Notifications envoyées aux concernés");
    return response.data;
  }

  // Prescriptions
  async getPrescriptions() {
    const response = await axios.get("/api/admin/prescriptions", this.getAuthHeaders());
    return response.data.prescriptions || [];
  }

  async createPrescription(prescriptionData) {
    const response = await axios.post("/api/admin/prescriptions", prescriptionData, this.getAuthHeaders());
    return response.data;
  }

  async updatePrescription(id, prescriptionData) {
    const response = await axios.put(`/api/admin/prescriptions/${id}`, prescriptionData, this.getAuthHeaders());
    return response.data;
  }

  async deletePrescription(id) {
    const response = await axios.delete(`/api/admin/prescriptions/${id}`, this.getAuthHeaders());
    return response.data;
  }

  // Users
  async getUsers() {
    const response = await axios.get("/api/admin/users", this.getAuthHeaders());
    return response.data.users || [];
  }

  async createUser(userData) {
    const response = await axios.post("/api/admin/users", userData, this.getAuthHeaders());
    return response.data;
  }

  async updateUser(id, userData) {
    const response = await axios.put(`/api/admin/users/${id}`, userData, this.getAuthHeaders());
    return response.data;
  }

  async deleteUser(id) {
    const response = await axios.delete(`/api/admin/users/${id}`, this.getAuthHeaders());
    return response.data;
  }

  // Services
  async getServices() {
    const response = await axios.get("/api/admin/services", this.getAuthHeaders());
    return response.data.services || [];
  }

  async getService(id) {
    const response = await axios.get(`/api/admin/services/${id}`, this.getAuthHeaders());
    return response.data.service;
  }

  async createService(serviceData) {
    const response = await axios.post("/api/admin/services", serviceData, this.getAuthHeaders());
    return response.data;
  }

  async updateService(id, serviceData) {
    const response = await axios.put(`/api/admin/services/${id}`, serviceData, this.getAuthHeaders());
    return response.data;
  }

  async deleteService(id) {
    const response = await axios.delete(`/api/admin/services/${id}`, this.getAuthHeaders());
    return response.data;
  }

  async assignDoctorToService(serviceId, doctorId) {
    const response = await axios.post(`/api/admin/services/${serviceId}/doctors`, 
      { doctor_id: doctorId }, this.getAuthHeaders());
    return response.data;
  }

  async removeDoctorFromService(serviceId, doctorId) {
    const response = await axios.delete(`/api/admin/services/${serviceId}/doctors`, {
      ...this.getAuthHeaders(),
      data: { doctor_id: doctorId }
    });
    return response.data;
  }

  // Payment Methods
  async getPaymentMethods() {
    const response = await axios.get("/api/admin/payment-methods", this.getAuthHeaders());
    return response.data.payment_methods || [];
  }

  async createPaymentMethod(methodData) {
    const response = await axios.post("/api/admin/payment-methods", methodData, this.getAuthHeaders());
    return response.data;
  }

  async updatePaymentMethod(id, methodData) {
    const response = await axios.put(`/api/admin/payment-methods/${id}`, methodData, this.getAuthHeaders());
    return response.data;
  }

  async deletePaymentMethod(id) {
    const response = await axios.delete(`/api/admin/payment-methods/${id}`, this.getAuthHeaders());
    return response.data;
  }

  async setDefaultPaymentMethod(id) {
    const response = await axios.post(`/api/admin/payment-methods/${id}/set-default`, {}, this.getAuthHeaders());
    return response.data;
  }

  // Contacts
  async getContacts() {
    const response = await axios.get("/api/admin/contacts", this.getAuthHeaders());
    return response.data;
  }

  async markContactAsRead(id) {
    const response = await axios.put(`/api/admin/contacts/${id}/mark-as-read`, {}, this.getAuthHeaders());
    return response.data;
  }

  async deleteContact(id) {
    const response = await axios.delete(`/api/admin/contacts/${id}`, this.getAuthHeaders());
    return response.data;
  }

  // Auth
  async logout() {
    return axios.post("/api/logout", {}, this.getAuthHeaders());
  }
}

export default new AdminApiClient();