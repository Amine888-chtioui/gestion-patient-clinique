// src/components/patient-dashboard/BookAppointment.jsx
import React from "react";

const BookAppointment = ({ 
  newAppointment, 
  doctors, 
  handleAppointmentChange, 
  handleBookAppointment, 
  handleTabChange, 
  actionLoading 
}) => (
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
            onChange={handleAppointmentChange}
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

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Date souhaitée</label>
            <input
              type="date"
              id="date"
              name="date"
              value={newAppointment.date}
              onChange={handleAppointmentChange}
              min={new Date().toISOString().split("T")[0]}
              required
              disabled={actionLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="time">Heure souhaitée</label>
            <select
              id="time"
              name="time"
              value={newAppointment.time}
              onChange={handleAppointmentChange}
              required
              disabled={actionLoading}
            >
              <option value="">Sélectionner une heure</option>
              {["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
                "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"].map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

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
          <button type="submit" className="btn-primary" disabled={actionLoading}>
            {actionLoading ? "Création en cours..." : (
              <><i className="fas fa-calendar-check"></i> Demander le rendez-vous</>
            )}
          </button>
          <button type="button" className="btn-secondary" 
            onClick={() => handleTabChange("overview")} 
            disabled={actionLoading}>
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
      </div>
    </div>
  </div>
);

export default BookAppointment;