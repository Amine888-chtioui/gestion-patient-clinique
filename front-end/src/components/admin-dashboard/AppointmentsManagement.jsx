// src/components/admin-dashboard/AppointmentsManagement.jsx - CORRECTION CHAMP MÉDECIN
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

  // DEBUG: Vérifier les données reçues
  console.log("🔍 AppointmentsManagement - Données reçues:", {
    appointments: appointments?.length || 0,
    patients: patients?.length || 0,
    doctors: doctors?.length || 0,
    showAddForm
  });
  
  // Filtrer les rendez-vous selon les critères
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // Helper pour afficher les infos de notification
  const showNotificationInfo = (action, patientName, doctorName) => {
    const messages = {
      create: `📩 Le patient ${patientName} et le Dr ${doctorName} recevront une notification`,
      update: `📩 Les personnes concernées recevront une notification des changements`,
      delete: `📩 Le patient ${patientName} et le Dr ${doctorName} recevront une notification d'annulation`
    };
    
    return (
      <div className="notification-info">
        <small style={{ color: '#6c757d', fontStyle: 'italic' }}>
          <i className="fas fa-info-circle"></i> {messages[action]}
        </small>
      </div>
    );
  };
  
  // Soumettre le formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingAppointment) {
      handleUpdateAppointment(editingAppointment, formData);
    } else {
      handleAddAppointment(formData);
    }
    
    cancelForm();
  };
  
  // Confirmer la suppression d'un rendez-vous
  const confirmDelete = (id) => {
    const appointment = appointments.find(apt => apt.id === id);
    
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer ce rendez-vous ?

📩 Le patient ${appointment.patient_name} et le Dr ${appointment.doctor_name} recevront une notification d'annulation.`;
    
    if (window.confirm(confirmMessage)) {
      handleDeleteAppointment(id);
    }
  };

  // Formater la date pour l'affichage
  const formatDate = (date) => {
    if (!date) return "";
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

      {/* Formulaire d'ajout/édition - AVEC CHAMP MÉDECIN CORRIGÉ */}
      {showAddForm && (
        <div className="form-container">
          <h3>{editingAppointment ? "Modifier le rendez-vous" : "Ajouter un nouveau rendez-vous"}</h3>
          
          {/* Messages de debug si pas de données */}
          {(!patients || patients.length === 0) && (
            <div className="alert alert-warning" style={{
              padding: '10px',
              marginBottom: '15px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              color: '#856404'
            }}>
              ⚠️ Aucun patient disponible. Veuillez d'abord ajouter des patients.
            </div>
          )}
          
          {(!doctors || doctors.length === 0) && (
            <div className="alert alert-warning" style={{
              padding: '10px',
              marginBottom: '15px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              color: '#856404'
            }}>
              ⚠️ Aucun médecin disponible. Veuillez d'abord ajouter des médecins.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h4>Informations du rendez-vous</h4>
              
              {/* PREMIÈRE LIGNE - Patient et Médecin côte à côte */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="patient_id">
                    Patient* 
                    <span style={{ color: '#6c757d', fontSize: '0.8em', marginLeft: '5px' }}>
                      ({patients?.length || 0} disponibles)
                    </span>
                  </label>
                  <select
                    id="patient_id"
                    name="patient_id"
                    className="form-control"
                    value={formData.patient_id}
                    onChange={handleChange}
                    required
                    disabled={actionLoading || !patients || patients.length === 0}
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients && patients.length > 0 ? (
                      patients.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} ({patient.email})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Aucun patient disponible</option>
                    )}
                  </select>
                </div>
                
                {/* CHAMP MÉDECIN - OBLIGATOIRE ET VISIBLE */}
                <div className="form-group">
                  <label htmlFor="doctor_id">
                    Médecin* 
                    <span style={{ color: '#6c757d', fontSize: '0.8em', marginLeft: '5px' }}>
                      ({doctors?.length || 0} disponibles)
                    </span>
                  </label>
                  <select
                    id="doctor_id"
                    name="doctor_id"
                    className="form-control"
                    value={formData.doctor_id}
                    onChange={handleChange}
                    required
                    disabled={actionLoading || !doctors || doctors.length === 0}
                  >
                    <option value="">Sélectionner un médecin</option>
                    {doctors && doctors.length > 0 ? (
                      doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} {doctor.speciality ? `(${doctor.speciality})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Aucun médecin disponible</option>
                    )}
                  </select>
                </div>
              </div>
              
              {/* DEUXIÈME LIGNE - Date et Heure */}
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
              
              {/* TROISIÈME LIGNE - Motif */}
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
                  placeholder="Décrivez le motif de la consultation..."
                />
              </div>
              
              {/* QUATRIÈME LIGNE - Statut et Notes */}
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
                    placeholder="Notes supplémentaires..."
                  />
                </div>
              </div>

              {/* Affichage des infos de notification */}
              {formData.patient_id && formData.doctor_id && (
                <div className="notification-preview">
                  {showNotificationInfo(
                    editingAppointment ? 'update' : 'create',
                    patients.find(p => p.id === parseInt(formData.patient_id))?.name,
                    doctors.find(d => d.id === parseInt(formData.doctor_id))?.name
                  )}
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={actionLoading || !formData.patient_id || !formData.doctor_id}
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

      {/* Styles CSS */}
      <style jsx>{`
        .notification-info, .notification-preview {
          margin: 15px 0;
          padding: 10px;
          background-color: rgba(40, 167, 69, 0.1);
          border-left: 3px solid #28a745;
          border-radius: 4px;
        }

        .notification-info small, .notification-preview small {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #495057;
        }

        .notification-info i, .notification-preview i {
          color: #17a2b8;
        }

        .alert {
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .form-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          flex: 1;
        }

        .form-control {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ced4da;
          border-radius: 4px;
        }

        .form-control:disabled {
          background-color: #e9ecef;
          opacity: 0.6;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default AppointmentsManagement;