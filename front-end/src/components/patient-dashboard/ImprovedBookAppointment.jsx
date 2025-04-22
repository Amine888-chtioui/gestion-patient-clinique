// src/components/patient-dashboard/ImprovedBookAppointment.jsx
import React, { useState, useEffect } from "react";
import AvailabilityCalendar from "./AvailabilityCalendar";
import TimeSlots from "./TimeSlots";
import axios from "../../axios";

const ImprovedBookAppointment = ({ 
  handleTabChange, 
  actionLoading,
  onBookAppointment
}) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Récupérer la liste des médecins
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/doctors');
        setDoctors(response.data || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des médecins:", err);
        setError("Impossible de charger la liste des médecins. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Gérer le changement de médecin
  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    setSelectedDoctor(doctorId);
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
        <div className="doctor-selection">
          <h3>1. Choisissez un médecin</h3>
          <div className="form-group">
            <label htmlFor="doctor">Médecin</label>
            <select
              id="doctor"
              value={selectedDoctor}
              onChange={handleDoctorChange}
              disabled={loading || actionLoading}
              required
            >
              <option value="">Sélectionnez un médecin</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} {doctor.specialty ? `- ${doctor.specialty}` : ""}
                </option>
              ))}
            </select>
            {loading && (
              <div className="loading-indicator">
                <i className="fas fa-spinner fa-spin"></i> Chargement des médecins...
              </div>
            )}
          </div>
        </div>

        {selectedDoctor && (
          <div className="date-time-selection">
            <div className="date-selection">
              <h3>2. Choisissez une date</h3>
              <AvailabilityCalendar
                doctorId={selectedDoctor}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                disabled={actionLoading}
              />
            </div>

            <div className="time-selection">
              <h3>3. Choisissez un horaire</h3>
              <TimeSlots
                doctorId={selectedDoctor}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
                disabled={actionLoading}
              />
            </div>
          </div>
        )}

        {selectedDoctor && selectedDate && selectedTime && (
          <div className="reason-section">
            <h3>4. Motif de consultation</h3>
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
                  <span className="summary-label">Médecin:</span>
                  <span className="summary-value">
                    {doctors.find(d => d.id === selectedDoctor)?.name || "Médecin sélectionné"}
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
                    {formatReadableTime(selectedTime)}
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

// Fonctions utilitaires pour le formatage des dates et heures
const formatReadableDate = (dateString) => {
  if (!dateString) return "Non sélectionnée";
  
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('fr-FR', options);
};

const formatReadableTime = (timeString) => {
  if (!timeString) return "Non sélectionnée";
  
  const [hours, minutes] = timeString.split(':');
  const h = parseInt(hours);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  
  return `${hour12}:${minutes} ${period}`;
};

export default ImprovedBookAppointment;