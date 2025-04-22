// src/components/patient-dashboard/AppointmentEditor.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";

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
  });
  
  const [timeSlots, setTimeSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Fonction pour récupérer les créneaux disponibles
  const fetchAvailability = async () => {
    if (!formData.doctor_id || !formData.date) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.get(`/api/doctors/${formData.doctor_id}/availability`, {
        params: { date: formData.date },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      // Marquer le créneau actuel comme disponible même s'il est réservé (par ce même rendez-vous)
      const slots = response.data.timeSlots.map(slot => {
        if (slot.time === appointment.time && slot.isAvailable === false) {
          return { ...slot, isAvailable: true };
        }
        return slot;
      });

      setTimeSlots(slots);
    } catch (err) {
      console.error("Erreur lors de la récupération des disponibilités:", err);
      setError(
        "Impossible de récupérer les disponibilités. Veuillez réessayer plus tard."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les disponibilités au chargement et quand le médecin ou la date change
  useEffect(() => {
    fetchAvailability();
  }, [formData.doctor_id, formData.date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Si la date change, réinitialiser l'heure
    if (name === 'date') {
      setFormData(prev => ({ ...prev, time: "" }));
    }
  };

  const handleTimeSlotSelect = (time, isAvailable) => {
    if (!isAvailable) return; // Ne pas sélectionner les créneaux indisponibles
    
    setFormData({
      ...formData,
      time: time
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleUpdateAppointment(appointment.id, formData);
  };

  return (
    <div className="edit-appointment-container">
      <div className="form-card">
        <h3>Modifier le rendez-vous</h3>
        <form onSubmit={handleSubmit} className="appointment-form">
          <div className="form-group">
            <label htmlFor="doctor_id">Médecin</label>
            <select
              id="doctor_id"
              name="doctor_id"
              value={formData.doctor_id}
              onChange={handleChange}
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
              value={formData.date}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
              required
              disabled={actionLoading}
            />
          </div>

          {isLoading ? (
            <div className="loading-slots">Chargement des disponibilités...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : formData.doctor_id && formData.date ? (
            <div className="time-slots-container">
              <label>Sélectionnez une heure</label>
              <div className="time-slots-grid">
                {timeSlots.map((slot) => (
                  <div 
                    key={slot.time}
                    className={`time-slot ${!slot.isAvailable ? 'unavailable' : ''} ${formData.time === slot.time ? 'selected' : ''}`}
                    onClick={() => handleTimeSlotSelect(slot.time, slot.isAvailable)}
                  >
                    {slot.time}
                  </div>
                ))}
              </div>
              {formData.time && (
                <div className="selected-time">
                  Heure sélectionnée: <strong>{formData.time}</strong>
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
              value={formData.reason}
              onChange={handleChange}
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
              disabled={actionLoading || !formData.time}
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

      <div className="info-card">
        <h3>Informations</h3>
        <div className="info-list">
          <div className="info-item">
            <i className="fas fa-info-circle"></i>
            <p>Les modifications sont soumises à validation par nos secrétaires médicaux.</p>
          </div>
          <div className="info-item">
            <i className="fas fa-clock"></i>
            <p>Les consultations durent généralement 30 minutes.</p>
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

export default AppointmentEditor;