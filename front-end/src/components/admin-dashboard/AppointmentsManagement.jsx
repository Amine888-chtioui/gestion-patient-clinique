// src/components/admin-dashboard/AppointmentsManagement.jsx
import React, { useState } from "react";

const AppointmentsManagement = ({ 
  appointments,
  patients,
  doctors,
  handleAddAppointment, 
  handleUpdateAppointment, 
  handleDeleteAppointment, 
  actionLoading 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  
  // Modèle vide pour un nouveau rendez-vous
  const emptyAppointment = {
    patient_id: "",
    doctor_id: "",
    date: "",
    time: "",
    reason: "",
    status: "en attente",
    notes: ""
  };
  
  // État du formulaire (pour ajout ou édition)
  const [formData, setFormData] = useState(emptyAppointment);
  
  // Filtrer les rendez-vous selon les critères
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.reason && appointment.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    
    const matchesDate = !dateFilter || appointment.date === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });
  
  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Démarrer l'édition d'un rendez-vous
  const startEditing = (appointment) => {
    setFormData({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      date: appointment.date,
      time: appointment.time,
      reason: appointment.reason || "",
      status: appointment.status,
      notes: appointment.notes || ""
    });
    setEditingAppointment(appointment.id);
    setShowAddForm(true);
  };
  
  // Annuler l'édition ou l'ajout
  const cancelForm = () => {
    setFormData(emptyAppointment);
    setEditingAppointment(null);
    setShowAddForm(false);
  };
  
  // Soumettre le formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingAppointment) {
      // Mise à jour d'un rendez-vous existant
      handleUpdateAppointment(editingAppointment, formData);
    } else {
      // Ajout d'un nouveau rendez-vous
      handleAddAppointment(formData);
    }
    
    // Réinitialiser le formulaire après soumission
    cancelForm();
  };
  
  // Confirmer la suppression d'un rendez-vous
  const confirmDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
      handleDeleteAppointment(id);
    }
  };

  // Formater la date pour l'affichage
  const formatDate = (date) => {
    if (!date) return "";
    
    // Si la date est déjà au format 'YYYY-MM-DD', nous l'utilisons directement
    return date;
  };

  return (
    <div className="appointments-management">
      {/* En-tête avec filtres et bouton d'ajout */}
      <div className="data-table-header">
        <div className="search-filters" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-control"
            style={{ width: 'auto' }}
          >
            <option value="all">Tous les statuts</option>
            <option value="en attente">En attente</option>
            <option value="confirmé">Confirmé</option>
            <option value="annulé">Annulé</option>
          </select>
          
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="form-control"
            style={{ width: 'auto' }}
            placeholder="Filtrer par date"
          />
          
          <button 
            className="btn-secondary" 
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setDateFilter("");
            }}
            disabled={actionLoading}
          >
            <i className="fas fa-sync-alt"></i> Réinitialiser
          </button>
        </div>
        
        <button 
          className="btn-primary" 
          onClick={() => {
            setFormData(emptyAppointment);
            setEditingAppointment(null);
            setShowAddForm(true);
          }}
          disabled={actionLoading}
        >
          <i className="fas fa-calendar-plus"></i> Ajouter un rendez-vous
        </button>
      </div>

      {/* Formulaire d'ajout/édition */}
      {showAddForm && (
        <div className="form-container">
          <h3>{editingAppointment ? "Modifier le rendez-vous" : "Ajouter un nouveau rendez-vous"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h4>Informations du rendez-vous</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="patient_id">Patient*</label>
                  <select
                    id="patient_id"
                    name="patient_id"
                    className="form-control"
                    value={formData.patient_id}
                    onChange={handleChange}
                    required
                    disabled={actionLoading}
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} ({patient.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="doctor_id">Médecin*</label>
                  <select
                    id="doctor_id"
                    name="doctor_id"
                    className="form-control"
                    value={formData.doctor_id}
                    onChange={handleChange}
                    required
                    disabled={actionLoading}
                  >
                    <option value="">Sélectionner un médecin</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} {doctor.speciality ? `(${doctor.speciality})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date*</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="form-control"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    disabled={actionLoading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="time">Heure*</label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    className="form-control"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    disabled={actionLoading}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="reason">Motif de consultation</label>
                <textarea
                  id="reason"
                  name="reason"
                  className="form-control"
                  value={formData.reason}
                  onChange={handleChange}
                  rows="2"
                  disabled={actionLoading}
                ></textarea>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Statut*</label>
                  <select
                    id="status"
                    name="status"
                    className="form-control"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    disabled={actionLoading}
                  >
                    <option value="en attente">En attente</option>
                    <option value="confirmé">Confirmé</option>
                    <option value="annulé">Annulé</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="form-control"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="2"
                    disabled={actionLoading}
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <span><i className="loading-spinner"></i> Traitement...</span>
                ) : (
                  <span><i className="fas fa-save"></i> {editingAppointment ? "Mettre à jour" : "Ajouter"}</span>
                )}
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={cancelForm}
                disabled={actionLoading}
              >
                <i className="fas fa-times"></i> Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tableau des rendez-vous */}
      {!showAddForm && (
        <div className="data-table-container">
          {filteredAppointments.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Patient</th>
                  <th>Médecin</th>
                  <th>Motif</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map(appointment => (
                  <tr key={appointment.id}>
                    <td>{formatDate(appointment.date)}</td>
                    <td>{appointment.time}</td>
                    <td>{appointment.patient_name}</td>
                    <td>{appointment.doctor_name}</td>
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
                        title="Modifier" 
                        onClick={() => startEditing(appointment)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn-icon danger" 
                        title="Supprimer" 
                        onClick={() => confirmDelete(appointment.id)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <h3>Aucun rendez-vous trouvé</h3>
              <p>Ajoutez de nouveaux rendez-vous ou modifiez vos filtres</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentsManagement;