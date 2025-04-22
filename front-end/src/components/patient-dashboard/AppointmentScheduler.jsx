// src/components/patient-dashboard/AppointmentScheduler.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";

const AppointmentScheduler = ({ 
  newAppointment, 
  doctors, 
  handleAppointmentChange, 
  handleBookAppointment, 
  handleTabChange, 
  actionLoading 
}) => {
  const [selectedDate, setSelectedDate] = useState(newAppointment.date || "");
  const [selectedDoctor, setSelectedDoctor] = useState(newAppointment.doctor_id || "");
  const [timeSlots, setTimeSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Fonction pour récupérer les créneaux disponibles
  const fetchAvailability = async () => {
    if (!selectedDoctor || !selectedDate) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.get(`/api/doctors/${selectedDoctor}/availability`, {
        params: { date: selectedDate },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      setTimeSlots(response.data.timeSlots);
    } catch (err) {
      console.error("Erreur lors de la récupération des disponibilités:", err);
      setError(
        "Impossible de récupérer les disponibilités. Veuillez réessayer plus tard."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les disponibilités quand le médecin ou la date change
  useEffect(() => {
    fetchAvailability();
  }, [selectedDoctor, selectedDate]);

  // Gestionnaire pour les changements de médecin
  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    setSelectedDoctor(doctorId);
    handleAppointmentChange({
      target: { name: 'doctor_id', value: doctorId }
    });
  };

  // Gestionnaire pour les changements de date
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    handleAppointmentChange({
      target: { name: 'date', value: date }
    });
    
    // Réinitialiser l'heure sélectionnée lorsque la date change
    handleAppointmentChange({
      target: { name: 'time', value: '' }
    });
  };

  // Gestionnaire pour la sélection d'un créneau horaire
  const handleTimeSlotSelect = (time, isAvailable) => {
    if (!isAvailable) return; // Ne pas sélectionner les créneaux indisponibles
    
    handleAppointmentChange({
      target: { name: 'time', value: time }
    });
  };

  return (
    <div className="book-appointment-container">
      <div className="form-card">
        <h3>Demande de rendez-vous</h3>
        <form onSubmit={handleBookAppointment} className="appointment-form">
          <div className="form-group">
            <label htmlFor="doctor_id">Médecin</label>
            <select
              id="doctor_id"
              name="doctor_id"
              value={newAppointment.doctor_id}
              onChange={handleDoctorChange}
              required
              disabled={actionLoading}
            >
              <option value="">Sélectionnez un médecin</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.specialty || "Non spécifié"}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date">Date souhaitée</label>
            <input
              type="date"
              id="date"
              name="date"
              value={newAppointment.date}
              onChange={handleDateChange}
              min={new Date().toISOString().split("T")[0]}
              required
              disabled={actionLoading}
            />
          </div>

          {isLoading ? (
            <div className="loading-slots">Chargement des disponibilités...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : selectedDoctor && selectedDate ? (
            <div className="time-slots-container">
              <label>Sélectionnez une heure</label>
              <div className="time-slots-grid">
                {timeSlots.map((slot) => (
                  <div 
                    key={slot.time}
                    className={`time-slot ${!slot.isAvailable ? 'unavailable' : ''} ${newAppointment.time === slot.time ? 'selected' : ''}`}
                    onClick={() => handleTimeSlotSelect(slot.time, slot.isAvailable)}
                  >
                    {slot.time}
                  </div>
                ))}
              </div>
              {newAppointment.time && (
                <div className="selected-time">
                  Heure sélectionnée: <strong>{newAppointment.time}</strong>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-slots-message">
              Veuillez sélectionner un médecin et une date pour voir les disponibilités
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reason">Motif de la consultation</label>
            <textarea
              id="reason"
              name="reason"
              value={newAppointment.reason}
              onChange={handleAppointmentChange}
              placeholder="Décrivez brièvement le motif de votre consultation..."
              rows="4"
              required
              disabled={actionLoading}
            ></textarea>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={actionLoading || !newAppointment.time}
            >
              {actionLoading ? "Création en cours..." : (
                <><i className="fas fa-calendar-check"></i> Demander le rendez-vous</>
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
        </form>
      </div>

      <div className="info-card">
        <h3>Informations</h3>
        <div className="info-list">
          <div className="info-item">
            <i className="fas fa-info-circle"></i>
            <p>Les rendez-vous sont soumis à validation par nos secrétaires médicaux.</p>
          </div>
          <div className="info-item">
            <i className="fas fa-clock"></i>
            <p>Les consultations durent généralement 30 minutes.</p>
          </div>
          <div className="info-item">
            <i className="fas fa-exclamation-triangle"></i>
            <p>En cas d'urgence, veuillez nous contacter directement par téléphone.</p>
          </div>
          <div className="info-item">
            <i className="fas fa-phone"></i>
            <p>Numéro d'urgence : 0536629878</p>
          </div>
          
          <div className="legend">
            <h4>Légende</h4>
            <div className="legend-item">
              <div className="legend-color available"></div>
              <span>Disponible</span>
            </div>
            <div className="legend-item">
              <div className="legend-color unavailable"></div>
              <span>Non disponible</span>
            </div>
            <div className="legend-item">
              <div className="legend-color selected"></div>
              <span>Sélectionné</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentScheduler;