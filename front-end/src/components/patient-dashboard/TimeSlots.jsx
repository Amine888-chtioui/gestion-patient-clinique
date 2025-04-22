// src/components/patient-dashboard/TimeSlots.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";

const TimeSlots = ({ 
  doctorId, 
  selectedDate, 
  selectedTime, 
  onTimeSelect, 
  disabled = false 
}) => {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Récupérer les créneaux horaires disponibles pour la date sélectionnée
  useEffect(() => {
    if (!doctorId || !selectedDate) return;

    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `/api/doctors/${doctorId}/availability`, {
            params: { date: selectedDate }
          }
        );

        setTimeSlots(response.data.time_slots || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des créneaux horaires:", err);
        setError("Impossible de charger les créneaux horaires.");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [doctorId, selectedDate]);

  // Regrouper les créneaux par période de la journée
  const groupTimeSlots = () => {
    if (!timeSlots.length) return {};

    const groups = {
      morning: [],
      afternoon: [],
      evening: []
    };

    timeSlots.forEach(slot => {
      const hour = parseInt(slot.time.split(':')[0]);

      if (hour < 12) {
        groups.morning.push(slot);
      } else if (hour < 17) {
        groups.afternoon.push(slot);
      } else {
        groups.evening.push(slot);
      }
    });

    return groups;
  };

  const groupedSlots = groupTimeSlots();

  // Fonction pour rendre un groupe de créneaux horaires
  const renderTimeGroup = (title, slots) => {
    if (!slots || slots.length === 0) return null;

    return (
      <div className="time-group">
        <h4 className="time-group-title">{title}</h4>
        <div className="time-slots-grid">
          {slots.map(slot => {
            const isSelected = selectedTime === slot.time;
            const isAvailable = slot.status === 'available';
            const isBooked = slot.status === 'booked';
            const isPast = slot.status === 'past';

            let slotClass = "time-slot";
            if (isSelected) slotClass += " selected";
            if (isBooked) slotClass += " booked";
            if (isPast) slotClass += " past";
            if (isAvailable) slotClass += " available";

            return (
              <button
                key={slot.time}
                className={slotClass}
                onClick={() => {
                  if (isAvailable && !disabled) {
                    onTimeSelect(slot.time);
                  }
                }}
                disabled={!isAvailable || disabled}
                title={getStatusLabel(slot.status)}
              >
                {formatTime(slot.time)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Fonctions utilitaires
  const formatTime = (time) => {
    // Convertir de format 24h à format 12h (ex: "14:30" -> "2:30 PM")
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    
    return `${hour12}:${minutes} ${period}`;
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'booked':
        return 'Réservé';
      case 'past':
        return 'Passé';
      default:
        return 'Statut inconnu';
    }
  };

  if (!selectedDate) {
    return (
      <div className="time-slots-container">
        <p className="select-date-prompt">
          Veuillez sélectionner une date dans le calendrier pour voir les horaires disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="time-slots-container">
      <h3 className="time-slots-header">
        Horaires disponibles pour le {formatDate(selectedDate)}
      </h3>

      {loading ? (
        <div className="time-slots-loading">
          <i className="fas fa-spinner fa-spin"></i> Chargement des horaires...
        </div>
      ) : error ? (
        <div className="time-slots-error">
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      ) : timeSlots.length === 0 ? (
        <div className="time-slots-empty">
          <i className="fas fa-calendar-times"></i>
          <p>Aucun horaire disponible pour cette date.</p>
        </div>
      ) : (
        <div className="time-slots-content">
          {renderTimeGroup("Matin", groupedSlots.morning)}
          {renderTimeGroup("Après-midi", groupedSlots.afternoon)}
          {renderTimeGroup("Soir", groupedSlots.evening)}
          
          <div className="time-slots-legend">
            <div className="legend-item">
              <span className="legend-color available"></span>
              <span>Disponible</span>
            </div>
            <div className="legend-item">
              <span className="legend-color booked"></span>
              <span>Déjà réservé</span>
            </div>
            <div className="legend-item">
              <span className="legend-color past"></span>
              <span>Passé</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Fonction pour formatter la date
const formatDate = (dateString) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('fr-FR', options);
};

export default TimeSlots;