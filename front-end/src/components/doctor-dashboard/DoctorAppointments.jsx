// src/components/doctor-dashboard/DoctorAppointments.jsx
import React, { useState } from "react";

const DoctorAppointments = ({ 
  appointments, 
  handleUpdateStatus,
  handleAppointmentSelect, 
  actionLoading 
}) => {
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter appointments based on criteria
  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = filter === "all" || appointment.status === filter;
    const matchesDate = !dateFilter || appointment.date === dateFilter;
    const matchesSearch = !searchTerm || 
      appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.reason && appointment.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesDate && matchesSearch;
  });

  return (
    <div className="appointments-container">
      {/* Filter and search section */}
      <div className="filter-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Rechercher un patient ou un motif..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-options">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les statuts</option>
            <option value="confirmé">Confirmés</option>
            <option value="en attente">En attente</option>
            <option value="annulé">Annulés</option>
          </select>
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="date-filter"
          />
          <button 
            className="btn-outline"
            onClick={() => {
              setFilter("all");
              setDateFilter("");
              setSearchTerm("");
            }}
            disabled={actionLoading}
          >
            <i className="fas fa-sync-alt"></i> Réinitialiser
          </button>
        </div>
      </div>

      {/* Quick date filter tabs */}
      <div className="tabs">
        <button 
          className={`tab ${dateFilter === '' ? 'active' : ''}`}
          onClick={() => setDateFilter('')}
        >
          Tous
        </button>
        <button 
          className={`tab ${dateFilter === new Date().toISOString().split('T')[0] ? 'active' : ''}`}
          onClick={() => setDateFilter(new Date().toISOString().split('T')[0])}
        >
          Aujourd'hui
        </button>
        <button 
          className={`tab ${dateFilter === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? 'active' : ''}`}
          onClick={() => setDateFilter(new Date(Date.now() + 86400000).toISOString().split('T')[0])}
        >
          Demain
        </button>
        <button 
          className={`tab ${dateFilter && !['', new Date().toISOString().split('T')[0], new Date(Date.now() + 86400000).toISOString().split('T')[0]].includes(dateFilter) ? 'active' : ''}`}
          onClick={() => {/* Custom date filter is handled via date input */}}
        >
          Personnalisé
        </button>
      </div>

      {/* Appointments table */}
      <div className="appointments-list">
        {filteredAppointments.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Heure</th>
                <th>Patient</th>
                <th>Motif</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map(appointment => (
                <tr key={appointment.id}>
                  <td>{appointment.date}</td>
                  <td>{appointment.time}</td>
                  <td>{appointment.patient_name}</td>
                  <td>
                    {appointment.reason
                      ? appointment.reason.length > 30
                        ? `${appointment.reason.substring(0, 30)}...`
                        : appointment.reason
                      : "Non spécifié"}
                  </td>
                  <td>
                    <span className={`status-badge ${appointment.status.replace(" ", "")}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-icon" 
                      title="Voir les détails"
                      onClick={() => handleAppointmentSelect(appointment)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    
                    {appointment.status === "en attente" && (
                      <>
                        <button 
                          className="btn-icon" 
                          title="Confirmer"
                          onClick={() => handleUpdateStatus(appointment.id, "confirmé")}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button 
                          className="btn-icon" 
                          title="Annuler"
                          onClick={() => handleUpdateStatus(appointment.id, "annulé")}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </>
                    )}
                    
                    {appointment.status === "confirmé" && (
                      <button 
                        className="btn-icon" 
                        title="Créer un dossier médical"
                        onClick={() => handleAppointmentSelect(appointment)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-file-medical"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <i className="fas fa-calendar-times"></i>
            <h3>Aucun rendez-vous trouvé</h3>
            <p>Aucun rendez-vous ne correspond à vos critères de recherche</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;