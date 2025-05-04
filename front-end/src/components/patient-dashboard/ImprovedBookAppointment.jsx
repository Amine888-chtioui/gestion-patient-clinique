// ImprovedBookAppointment.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";

const ImprovedBookAppointment = ({ 
  handleTabChange, 
  actionLoading,
  onBookAppointment
}) => {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Récupérer la liste des services disponibles
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/patient/services', {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setServices(response.data.services || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des services:", err);
        setError("Impossible de charger la liste des services. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Récupérer les médecins associés au service sélectionné
  useEffect(() => {
    if (!selectedService) return;
    
    const fetchDoctorsByService = async () => {
      setLoading(true);
      setDoctors([]);
      setSelectedDoctor("");
      
      try {
        const response = await axios.get(`/api/patient/services/${selectedService}/doctors`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setDoctors(response.data.doctors || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des médecins:", err);
        setError("Impossible de charger les médecins pour ce service. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorsByService();
  }, [selectedService]);

  // Gérer le changement de service
  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
    // Réinitialiser les sélections suivantes
    setSelectedDoctor("");
    setSelectedDate("");
    setSelectedTime("");
  };

  // Gérer le changement de médecin
  const handleDoctorChange = (e) => {
    setSelectedDoctor(e.target.value);
    // Réinitialiser la date et l'heure sélectionnées
    setSelectedDate("");
    setSelectedTime("");
  };

  // Gérer la sélection de date
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Réinitialiser l'heure sélectionnée
    setSelectedTime("");
  };

  // Gérer la sélection d'heure
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  // Soumettre le formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedDoctor || !selectedDate || !selectedTime || !reason.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    
    const appointmentData = {
      doctor_id: selectedDoctor,
      date: selectedDate,
      time: selectedTime,
      reason: reason
    };
    
    onBookAppointment(appointmentData);
  };

  return (
    <div className="improved-book-appointment">
      <h2 className="section-title">Prendre un rendez-vous</h2>
      
      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      <div className="appointment-form-container">
        <div className="service-selection">
          <h3>1. Choisissez un service médical</h3>
          <div className="form-group">
            <label htmlFor="service">Service</label>
            <select
              id="service"
              value={selectedService}
              onChange={handleServiceChange}
              disabled={loading || actionLoading}
              required
              className="form-control"
            >
              <option value="">Sélectionnez un service</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            {loading && (
              <div className="loading-indicator">
                <i className="fas fa-spinner fa-spin"></i> Chargement...
              </div>
            )}
          </div>
        </div>

        {selectedService && (
          <div className="doctor-selection">
            <h3>2. Choisissez un médecin</h3>
            <div className="form-group">
              <label htmlFor="doctor">Médecin</label>
              <select
                id="doctor"
                value={selectedDoctor}
                onChange={handleDoctorChange}
                disabled={loading || actionLoading}
                required
                className="form-control"
              >
                <option value="">Sélectionnez un médecin</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} {doctor.specialty ? `- ${doctor.specialty}` : ""}
                  </option>
                ))}
              </select>
              {doctors.length === 0 && !loading && (
                <div className="info-message">
                  <i className="fas fa-info-circle"></i> Aucun médecin disponible pour ce service.
                </div>
              )}
            </div>
          </div>
        )}

        {selectedDoctor && (
          <div className="date-time-selection">
            <div className="date-selection">
              <h3>3. Choisissez une date</h3>
              {/* Ici, vous pourriez intégrer votre composant AvailabilityCalendar */}
              <div className="form-group">
                <label htmlFor="date">Date souhaitée</label>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => handleDateSelect(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  disabled={actionLoading}
                  className="form-control"
                />
              </div>
            </div>

            {selectedDate && (
              <div className="time-selection">
                <h3>4. Choisissez un horaire</h3>
                {/* Ici, vous pourriez intégrer votre composant TimeSlots */}
                <div className="form-group">
                  <label htmlFor="time">Heure souhaitée</label>
                  <select
                    id="time"
                    value={selectedTime}
                    onChange={(e) => handleTimeSelect(e.target.value)}
                    required
                    disabled={actionLoading}
                    className="form-control"
                  >
                    <option value="">Sélectionner une heure</option>
                    {["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
                      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"].map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedDoctor && selectedDate && selectedTime && (
          <div className="reason-section">
            <h3>5. Motif de consultation</h3>
            <div className="form-group">
              <label htmlFor="reason">Motif de la consultation</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Décrivez brièvement le motif de votre consultation..."
                rows="4"
                required
                disabled={actionLoading}
                className="form-control"
              ></textarea>
            </div>
          </div>
        )}

        <div className="appointment-summary">
          {selectedDoctor && selectedDate && selectedTime && (
            <div className="summary-card">
              <h3>Résumé du rendez-vous</h3>
              <div className="summary-details">
                <div className="summary-item">
                  <span className="summary-label">Service:</span>
                  <span className="summary-value">
                    {services.find(s => s.id == selectedService)?.name || "Service sélectionné"}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Médecin:</span>
                  <span className="summary-value">
                    {doctors.find(d => d.id == selectedDoctor)?.name || "Médecin sélectionné"}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Date:</span>
                  <span className="summary-value">
                    {formatReadableDate(selectedDate)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Heure:</span>
                  <span className="summary-value">
                    {selectedTime}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={!selectedDoctor || !selectedDate || !selectedTime || !reason.trim() || actionLoading}
              onClick={handleSubmit}
            >
              {actionLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> En cours...</>
              ) : (
                <><i className="fas fa-calendar-check"></i> Confirmer le rendez-vous</>
              )}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleTabChange("overview")}
              disabled={actionLoading}
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fonction utilitaire pour formater les dates
const formatReadableDate = (dateString) => {
  if (!dateString) return "Non sélectionnée";
  
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('fr-FR', options);
};

export default ImprovedBookAppointment;