// src/components/patient-dashboard/AvailabilityCalendar.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";

const AvailabilityCalendar = ({ 
  doctorId, 
  selectedDate, 
  onDateSelect, 
  disabled = false
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyAvailability, setMonthlyAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Récupérer la disponibilité du mois actuel
  useEffect(() => {
    if (!doctorId) return;

    const fetchMonthlyAvailability = async () => {
      setLoading(true);
      setError(null);
    
      try {
        const month = currentMonth.getMonth() + 1;
        const year = currentMonth.getFullYear();
    
        const response = await axios.get(
          `/api/doctors/${doctorId}/monthly-availability`, {
            params: { 
              month: month, 
              year: year 
            }
          }
        );
    
        setMonthlyAvailability(response.data.dates || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des disponibilités:", err);
        setError("Impossible de charger les disponibilités.");
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyAvailability();
  }, [doctorId, currentMonth]);

  // Passer au mois précédent
  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };

  // Passer au mois suivant
  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  // Générer les jours du mois actuel
  const renderCalendarDays = () => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    
    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    // Jour de la semaine du premier jour (0 = dimanche, 1 = lundi, etc.)
    const startingDayOfWeek = firstDay.getDay();
    // Nombre de jours dans le mois
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Tableau des jours de la semaine
    const weekdays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    // Calculer les jours du mois précédent pour remplir la première semaine
    const prevMonthDays = [];
    if (startingDayOfWeek > 0) {
      const prevMonth = new Date(year, month, 0);
      const prevMonthDaysCount = prevMonth.getDate();
      
      for (let i = prevMonthDaysCount - startingDayOfWeek + 1; i <= prevMonthDaysCount; i++) {
        prevMonthDays.push(
          <div key={`prev-${i}`} className="calendar-day prev-month">
            {i}
          </div>
        );
      }
    }
    
    // Jours du mois actuel
    const currentMonthDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Trouver la disponibilité pour ce jour
      const dayAvailability = monthlyAvailability.find(d => d.date === dateStr) || {
        status: 'unknown',
        appointments_count: 0
      };
      
      // Vérifier si ce jour est le jour sélectionné
      const isSelected = selectedDate === dateStr;
      
      // Classes CSS pour le jour
      let dayClass = "calendar-day current-month";
      
      if (isSelected) {
        dayClass += " selected";
      }
      
      if (dayAvailability.status === 'full') {
        dayClass += " unavailable";
      } else if (dayAvailability.status === 'partial') {
        dayClass += " partially-available";
      } else if (dayAvailability.status === 'past') {
        dayClass += " past";
      } else if (dayAvailability.status === 'available') {
        dayClass += " available";
      } else if (dayAvailability.status === 'unavailable') {
        // Nouveau statut pour les jours où le médecin n'est pas disponible (weekend, etc.)
        dayClass += " doctor-unavailable";
      }
      
      currentMonthDays.push(
        <div 
          key={`current-${day}`} 
          className={dayClass}
          onClick={() => {
            // Ne pas permettre la sélection de jours complets, passés ou indisponibles
            if (dayAvailability.status !== 'full' && 
                dayAvailability.status !== 'past' &&
                dayAvailability.status !== 'unavailable' && 
                !disabled) {
              onDateSelect(dateStr);
            }
          }}
          title={getStatusLabel(dayAvailability.status)}
        >
          {day}
          {dayAvailability.status === 'partial' && (
            <span className="appointment-indicator">
              {dayAvailability.appointments_count}
            </span>
          )}
        </div>
      );
    }
    
    // Jours du mois suivant pour compléter la dernière semaine
    const nextMonthDays = [];
    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const remainingCells = 42 - totalDays; // 42 = 6 semaines * 7 jours
    
    for (let i = 1; i <= remainingCells; i++) {
      nextMonthDays.push(
        <div key={`next-${i}`} className="calendar-day next-month">
          {i}
        </div>
      );
    }
    
    return (
      <>
        {/* En-tête des jours de la semaine */}
        {weekdays.map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        
        {/* Jours du calendrier */}
        {prevMonthDays}
        {currentMonthDays}
        {nextMonthDays}
      </>
    );
  };

  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'partial':
        return 'Partiellement disponible';
      case 'full':
        return 'Complet';
      case 'past':
        return 'Passé';
      case 'unavailable':
        return 'Médecin non disponible';
      default:
        return 'Statut inconnu';
    }
  };

  // Formatage des noms des mois
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return (
    <div className="availability-calendar">
      <div className="calendar-header">
        <button 
          className="month-nav"
          onClick={handlePrevMonth}
          disabled={disabled}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="current-month">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button 
          className="month-nav"
          onClick={handleNextMonth}
          disabled={disabled}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {loading ? (
        <div className="calendar-loading">
          <i className="fas fa-spinner fa-spin"></i> Chargement...
        </div>
      ) : error ? (
        <div className="calendar-error">
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      ) : (
        <div className="calendar-grid">
          {renderCalendarDays()}
        </div>
      )}

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color available"></span>
          <span className="legend-label">Disponible</span>
        </div>
        <div className="legend-item">
          <span className="legend-color partially-available"></span>
          <span className="legend-label">Partiellement disponible</span>
        </div>
        <div className="legend-item">
          <span className="legend-color unavailable"></span>
          <span className="legend-label">Complet</span>
        </div>
        <div className="legend-item">
          <span className="legend-color doctor-unavailable"></span>
          <span className="legend-label">Médecin non disponible</span>
        </div>
        <div className="legend-item">
          <span className="legend-color past"></span>
          <span className="legend-label">Passé</span>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;