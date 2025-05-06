// src/components/patient-dashboard/Appointments.jsx
import React, { useState, useEffect } from "react";
import AppointmentEditor from "./AppointmentEditor";
import UnifiedLoadingSpinner from "./common/UnifiedLoadingSpinner";

const Appointments = ({ 
  appointments, 
  doctors,
  handleCancelAppointment, 
  handleUpdateAppointment,
  handleTabChange, 
  actionLoading 
}) => {
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Fonction pour charger des données additionnelles si nécessaire
  useEffect(() => {
    const fetchAdditionalData = async () => {
      if (appointments.length === 0 || doctors.length === 0) {
        setLoading(true);
        try {
          // Logique de chargement des données additionnelles si nécessaire
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation de délai
        } catch (error) {
          console.error('Erreur lors du chargement des données:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAdditionalData();
  }, [appointments.length, doctors.length]);

  // Fonction pour filtrer les rendez-vous
  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = filter === "all" || appointment.status === filter;
    const matchesSearch = searchTerm === "" || 
      appointment.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.reason && appointment.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  // Lancer l'édition d'un rendez-vous
  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditingAppointment(null);
  };

  // Si on est en cours de chargement, afficher le spinner unifié
  if (loading) {
    return <UnifiedLoadingSpinner text="Chargement des rendez-vous en cours..." />;
  }

  // Si on est en mode édition, afficher le formulaire d'édition
  if (editingAppointment) {
    return (
      <AppointmentEditor
        appointment={editingAppointment}
        doctors={doctors}
        handleUpdateAppointment={handleUpdateAppointment}
        handleCancel={handleCancelEdit}
        actionLoading={actionLoading}
      />
    );
  }

  return (
    <div className="appointments-container">
      <div className="filter-bar">
        <div className="filter-options">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="status-filter"
            disabled={actionLoading}
          >
            <option value="all">Tous</option>
            <option value="confirmé">Confirmés</option>
            <option value="en attente">En attente</option>
            <option value="annulé">Annulés</option>
          </select>

          <div className="search-box">
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              disabled={actionLoading}
            />
            <i className="fas fa-search search-icon"></i>
          </div>
        </div>
        
        <button 
          className="btn-outline reset-btn" 
          onClick={() => {
            setFilter("all");
            setSearchTerm("");
          }} 
          disabled={actionLoading}
        >
          <i className="fas fa-redo-alt"></i> Réinitialiser
        </button>
      </div>

      {filteredAppointments.length > 0 ? (
        <div className="appointments-list">
          {filteredAppointments.map(appointment => (
            <div key={appointment.id} className="appointment-card">
              <div className="appointment-header">
                <span className={`status-badge ${appointment.status.replace(" ", "")}`}>
                  {appointment.status}
                </span>
                <span className="appointment-date">{appointment.date}</span>
              </div>
              
              <div className="appointment-body">
                <div className="appointment-info">
                  <div className="info-row">
                    <span className="info-label">Heure:</span>
                    <span className="info-value">{appointment.time}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Médecin:</span>
                    <span className="info-value">{appointment.doctor}</span>
                  </div>
                  {appointment.specialty && (
                    <div className="info-row">
                      <span className="info-label">Spécialité:</span>
                      <span className="info-value">{appointment.specialty}</span>
                    </div>
                  )}
                  {appointment.reason && (
                    <div className="info-row">
                      <span className="info-label">Motif:</span>
                      <span className="info-value reason-text">
                        {appointment.reason.length > 100 
                          ? `${appointment.reason.substring(0, 100)}...` 
                          : appointment.reason}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="appointment-footer">
                <button 
                  className="btn-sm btn-outline" 
                  title="Voir les détails" 
                  disabled={actionLoading}
                >
                  <i className="fas fa-eye"></i> Détails
                </button>
                
                {/* Bouton d'édition pour les rendez-vous non annulés et futurs */}
                {appointment.status !== "annulé" && new Date(appointment.date) > new Date() && (
                  <button 
                    className="btn-sm btn-outline" 
                    title="Modifier" 
                    onClick={() => handleEditAppointment(appointment)}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-edit"></i> Modifier
                  </button>
                )}
                
                {/* Bouton d'annulation pour les rendez-vous non annulés et futurs */}
                {appointment.status !== "annulé" && new Date(appointment.date) > new Date() && (
                  <button 
                    className="btn-sm btn-outline danger" 
                    title="Annuler" 
                    onClick={() => handleCancelAppointment(appointment.id)}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-times-circle"></i> Annuler
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-calendar-times"></i>
          <h3>Aucun rendez-vous</h3>
          <p>Vous n'avez pas encore de rendez-vous programmés</p>
          <button 
            className="btn-primary" 
            onClick={() => handleTabChange("book")} 
            disabled={actionLoading}
          >
            Prendre un rendez-vous
          </button>
        </div>
      )}
    </div>
  );
};

export default Appointments;