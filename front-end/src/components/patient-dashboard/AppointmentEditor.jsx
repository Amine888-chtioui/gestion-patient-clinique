// src/components/patient-dashboard/AppointmentEditor.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import AvailabilityCalendar from "./AvailabilityCalendar";
import TimeSlots from "./TimeSlots";

const AppointmentEditor = ({ 
  appointment, 
  doctors, 
  handleUpdateAppointment, 
  handleCancel, 
  actionLoading 
}) => {
  const [formData, setFormData] = useState({
    date: appointment.date || "",
    time: appointment.time || "",
    doctor_id: appointment.doctor_id || "",
    reason: appointment.reason || "",
    service_id: "" // Nouveau champ pour le service
  });
  
  const [selectedDate, setSelectedDate] = useState(appointment.date || "");
  const [selectedTime, setSelectedTime] = useState(appointment.time || "");
  const [services, setServices] = useState([]); // État pour stocker les services
  const [serviceDoctors, setServiceDoctors] = useState([]); // Médecins filtrés par service
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Charger les services disponibles
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/patient/services', {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setServices(response.data.services || []);
      } catch (err) {
        console.error("Erreur lors du chargement des services:", err);
        setError("Impossible de charger les services. Veuillez réessayer plus tard.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Initialize the form with appointment data
  useEffect(() => {
    setFormData({
      date: appointment.date || "",
      time: appointment.time || "",
      doctor_id: appointment.doctor_id || "",
      reason: appointment.reason || "",
      service_id: "" // On initialise sans service spécifique
    });
    
    setSelectedDate(appointment.date || "");
    setSelectedTime(appointment.time || "");
  }, [appointment]);

  // Charger les médecins d'un service spécifique
  useEffect(() => {
    const fetchDoctorsByService = async () => {
      if (!formData.service_id) {
        setServiceDoctors(doctors); // Utiliser tous les médecins si aucun service n'est sélectionné
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/patient/services/${formData.service_id}/doctors`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setServiceDoctors(response.data.doctors || []);
      } catch (err) {
        console.error("Erreur lors du chargement des médecins:", err);
        setError("Impossible de charger les médecins. Veuillez réessayer plus tard.");
        setServiceDoctors([]); // Réinitialiser la liste des médecins en cas d'erreur
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctorsByService();
  }, [formData.service_id, doctors]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Si le service change, réinitialiser le médecin, la date et l'heure
    if (name === 'service_id') {
      setFormData(prev => ({
        ...prev,
        doctor_id: "",
        date: "",
        time: ""
      }));
      setSelectedDate("");
      setSelectedTime("");
    }
    
    // Si le médecin change, réinitialiser la date et l'heure
    if (name === 'doctor_id') {
      setFormData(prev => ({
        ...prev,
        date: "",
        time: ""
      }));
      setSelectedDate("");
      setSelectedTime("");
    }
  };

  // Handle date selection from calendar
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setFormData(prev => ({
      ...prev,
      date: date,
      time: "" // Reset time when date changes
    }));
    setSelectedTime("");
  };

  // Handle time selection
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setFormData(prev => ({
      ...prev,
      time: time
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.doctor_id || !formData.date || !formData.time || !formData.reason.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    
    // Transmettre seulement les champs nécessaires pour la mise à jour
    const updateData = {
      doctor_id: formData.doctor_id,
      date: formData.date,
      time: formData.time,
      reason: formData.reason
    };
    
    handleUpdateAppointment(appointment.id, updateData);
  };

  return (
    <div className="edit-appointment-container">
      <div className="form-card">
        <h3>Modifier le rendez-vous</h3>
        <form onSubmit={handleSubmit} className="appointment-form">
          {/* Sélection du service */}
          <div className="form-group">
            <label htmlFor="service_id">Service médical</label>
            <select
              id="service_id"
              name="service_id"
              value={formData.service_id}
              onChange={handleChange}
              disabled={actionLoading || isLoading}
            >
              <option value="">Tous les services</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            {isLoading && <div className="loading-indicator">Chargement...</div>}
          </div>

          {/* Sélection du médecin */}
          <div className="form-group">
            <label htmlFor="doctor_id">Médecin</label>
            <select
              id="doctor_id"
              name="doctor_id"
              value={formData.doctor_id}
              onChange={handleChange}
              required
              disabled={actionLoading || isLoading}
            >
              <option value="">Sélectionnez un médecin</option>
              {(formData.service_id ? serviceDoctors : doctors).map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.specialty || "Non spécifié"}
                </option>
              ))}
            </select>
          </div>

          {formData.doctor_id && (
            <div className="date-time-selection">
              <div className="date-selection">
                <h4>Choisissez une date</h4>
                <AvailabilityCalendar
                  doctorId={formData.doctor_id}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  disabled={actionLoading}
                />
              </div>

              {selectedDate && (
                <div className="time-selection">
                  <h4>Choisissez un horaire</h4>
                  <TimeSlots
                    doctorId={formData.doctor_id}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onTimeSelect={handleTimeSelect}
                    disabled={actionLoading}
                  />
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reason">Motif de la consultation</label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Décrivez brièvement le motif de votre consultation..."
              rows="4"
              required
              disabled={actionLoading}
            ></textarea>
          </div>

          {error && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={actionLoading || !formData.time || !formData.date || !formData.doctor_id}
            >
              {actionLoading ? "Modification en cours..." : "Modifier le rendez-vous"}
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleCancel} 
              disabled={actionLoading}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentEditor;