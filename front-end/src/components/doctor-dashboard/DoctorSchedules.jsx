// src/components/doctor-dashboard/DoctorSchedules.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import UnifiedLoadingSpinner from "../common/UnifiedLoadingSpinner";

const DoctorSchedules = ({ actionLoading }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Liste des jours de la semaine
  const daysOfWeek = [
    { value: "monday", label: "Lundi" },
    { value: "tuesday", label: "Mardi" },
    { value: "wednesday", label: "Mercredi" },
    { value: "thursday", label: "Jeudi" },
    { value: "friday", label: "Vendredi" },
    { value: "saturday", label: "Samedi" },
    { value: "sunday", label: "Dimanche" }
  ];

  // Initialisation des horaires (par défaut, tous les jours sont disponibles de 8h à 18h)
  const defaultSchedules = daysOfWeek.map(day => ({
    day_of_week: day.value,
    start_time: "08:00",
    end_time: "18:00",
    is_available: day.value !== "saturday" && day.value !== "sunday" // Weekends non disponibles par défaut
  }));

  // Charger les horaires existants
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get("/api/doctor/schedules", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        
        if (response.data.schedules && response.data.schedules.length > 0) {
          setSchedules(response.data.schedules);
        } else {
          // Si aucun horaire n'existe, initialiser avec les valeurs par défaut
          setSchedules(defaultSchedules);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des horaires:", err);
        setError("Impossible de charger vos horaires. Veuillez réessayer plus tard.");
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  // Mettre à jour un horaire
  const handleScheduleChange = (index, field, value) => {
    const updatedSchedules = [...schedules];
    
    // Conversion spéciale pour le booléen is_available
    if (field === "is_available") {
      value = value === "true";
    }
    
    updatedSchedules[index][field] = value;
    setSchedules(updatedSchedules);
  };

  // Sauvegarder les horaires
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await axios.post("/api/doctor/schedules", 
        { schedules },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      
      setSuccess("Vos horaires ont été enregistrés avec succès.");
      setSaving(false);
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement des horaires:", err);
      setError("Impossible d'enregistrer vos horaires. Veuillez vérifier les informations et réessayer.");
      setSaving(false);
    }
  };

  if (loading) {
    return <UnifiedLoadingSpinner text="Chargement des horaires..." color="primary" />;
  }

  return (
    <div className="doctor-schedules-container">
      <div className="section-header">
        <h2>Gestion des horaires de consultation</h2>
        <p className="section-subtitle">Définissez vos jours et heures de disponibilité pour les rendez-vous</p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i> {success}
        </div>
      )}

      <div className="schedules-form">
        <div className="form-section">
          <h4>Horaires hebdomadaires</h4>
          <p className="form-info">
            Pour chaque jour, définissez vos heures de travail et indiquez si vous êtes disponible ce jour-là.
          </p>

          <table className="schedules-table">
            <thead>
              <tr>
                <th>Jour</th>
                <th>Disponible</th>
                <th>Heure de début</th>
                <th>Heure de fin</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule, index) => {
                const day = daysOfWeek.find(d => d.value === schedule.day_of_week);
                
                return (
                  <tr key={index} className={!schedule.is_available ? "unavailable" : ""}>
                    <td>{day ? day.label : schedule.day_of_week}</td>
                    <td>
                      <select
                        value={schedule.is_available.toString()}
                        onChange={(e) => handleScheduleChange(index, "is_available", e.target.value)}
                        disabled={saving || actionLoading}
                      >
                        <option value="true">Disponible</option>
                        <option value="false">Non disponible</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="time"
                        value={schedule.start_time}
                        onChange={(e) => handleScheduleChange(index, "start_time", e.target.value)}
                        disabled={!schedule.is_available || saving || actionLoading}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={schedule.end_time}
                        onChange={(e) => handleScheduleChange(index, "end_time", e.target.value)}
                        disabled={!schedule.is_available || saving || actionLoading}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="schedule-info-box">
          <i className="fas fa-info-circle"></i>
          <div>
            <h5>Informations importantes</h5>
            <ul>
              <li>Les créneaux de rendez-vous seront générés automatiquement par tranche de 30 minutes</li>
              <li>Veillez à laisser des pauses dans votre emploi du temps</li>
              <li>Les rendez-vous déjà planifiés ne seront pas affectés par ces modifications</li>
            </ul>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={saving || actionLoading}
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Enregistrement...
              </>
            ) : (
              "Enregistrer les horaires"
            )}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setSchedules(defaultSchedules)}
            disabled={saving || actionLoading}
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorSchedules;