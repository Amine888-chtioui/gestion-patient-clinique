// File: front-end/src/components/patient-dashboard/DoctorScheduleInfo.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";

const DoctorScheduleInfo = ({ doctorId }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Jours de la semaine pour l'affichage
  const daysOfWeek = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
  ];

  useEffect(() => {
    if (!doctorId) return;

    const fetchDoctorSchedules = async () => {
      setLoading(true);
      setError(null);

      try {
        // Correction de la route API - utiliser le préfixe patient
        const response = await axios.get(`/api/patient/doctors/${doctorId}/schedules`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setSchedules(response.data.schedules || []);
      } catch (err) {
        console.error("Erreur lors du chargement des horaires du médecin:", err);
        setError("Impossible de charger les horaires du médecin.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorSchedules();
  }, [doctorId]);

  // Formater l'heure pour l'affichage
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // Prendre seulement HH:MM
  };

  if (loading) {
    return (
      <div className="doctor-schedule-info loading">
        <i className="fas fa-spinner fa-spin"></i> Chargement des horaires...
      </div>
    );
  }

  if (error) {
    return (
      <div className="doctor-schedule-info error">
        <i className="fas fa-exclamation-triangle"></i> {error}
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="doctor-schedule-info empty">
        <i className="fas fa-calendar-times"></i> Ce médecin n'a pas encore défini ses horaires.
      </div>
    );
  }

  return (
    <div className="doctor-schedule-info">
      <h4>Horaires hebdomadaires du médecin</h4>
      <div className="weekly-schedule">
        {daysOfWeek.map(day => {
          // Rechercher l'horaire pour ce jour
          const daySchedule = schedules.find(s => s.day_of_week === day.key);
          const isAvailable = daySchedule && daySchedule.is_available;

          return (
            <div 
              key={day.key} 
              className={`day-schedule ${isAvailable ? 'available' : 'unavailable'}`}
            >
              <div className="day-name">{day.label}</div>
              <div className="day-status">
                {isAvailable ? (
                  <>
                    <i className="fas fa-check-circle"></i>
                    <span className="day-hours">
                      {formatTime(daySchedule.start_time)} - {formatTime(daySchedule.end_time)}
                    </span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-times-circle"></i>
                    <span>Non disponible</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DoctorScheduleInfo;