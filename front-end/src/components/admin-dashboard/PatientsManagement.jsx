// src/components/admin-dashboard/PatientsManagement.jsx
import React, { useState } from "react";

const PatientsManagement = ({ 
  patients, 
  doctors,
  handleAddPatient, 
  handleUpdatePatient, 
  handleDeletePatient, 
  actionLoading 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modèle vide pour un nouveau patient
  const emptyPatient = {
    name: "",
    email: "",
    password: "",
    phone: "",
    date_of_birth: "",
    address: "",
    blood_type: "",
    allergies: [],
    chronic_diseases: [],
    emergency_contact: ""
  };
  
  // État du formulaire (pour ajout ou édition)
  const [formData, setFormData] = useState(emptyPatient);
  
  // Filtrer les patients selon le terme de recherche
  const filteredPatients = patients.filter(patient => {
    return (
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phone && patient.phone.includes(searchTerm))
    );
  });
  
  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gérer les changements dans les champs de tableau (allergies, maladies chroniques)
  const handleArrayChange = (e, field) => {
    const value = e.target.value;
    // Diviser la chaîne par des virgules et supprimer les espaces
    const array = value.split(',').map(item => item.trim()).filter(item => item !== '');
    setFormData(prev => ({
      ...prev,
      [field]: array
    }));
  };
  
  // Démarrer l'édition d'un patient
  const startEditing = (patient) => {
    // Convertir les allergies et maladies chroniques au format formulaire
    const formattedPatient = {
      ...patient,
      allergies: patient.allergies || [],
      chronic_diseases: patient.chronic_diseases || []
    };
    setFormData(formattedPatient);
    setEditingPatient(patient.id);
    setShowAddForm(true);
  };
  
  // Annuler l'édition ou l'ajout
  const cancelForm = () => {
    setFormData(emptyPatient);
    setEditingPatient(null);
    setShowAddForm(false);
  };
  
  // Soumettre le formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingPatient) {
      // Mise à jour d'un patient existant
      handleUpdatePatient(editingPatient, formData);
    } else {
      // Ajout d'un nouveau patient
      handleAddPatient(formData);
    }
    
    // Réinitialiser le formulaire après soumission
    cancelForm();
  };
  
  // Confirmer la suppression d'un patient
  const confirmDelete = (id, name) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le patient ${name} ?`)) {
      handleDeletePatient(id);
    }
  };

  return (
    <div className="patients-management">
      {/* En-tête avec recherche et bouton d'ajout */}
      <div className="data-table-header">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Rechercher un patient..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn-primary" 
          onClick={() => {
            setFormData(emptyPatient);
            setEditingPatient(null);
            setShowAddForm(true);
          }}
          disabled={actionLoading}
        >
          <i className="fas fa-user-plus"></i> Ajouter un patient
        </button>
      </div>

      {/* Formulaire d'ajout/édition */}
      {showAddForm && (
        <div className="form-container">
          <h3>{editingPatient ? "Modifier le patient" : "Ajouter un nouveau patient"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h4>Informations personnelles</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Nom complet*</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={actionLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email*</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={actionLoading}
                  />
                </div>
              </div>
              
              {!editingPatient && (
                <div className="form-group">
                  <label htmlFor="password">Mot de passe*</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                    required={!editingPatient}
                    disabled={actionLoading}
                  />
                  <small className="form-text">
                    Doit contenir au moins 8 caractères.
                  </small>
                </div>
              )}
              
              {editingPatient && (
                <div className="form-group">
                  <label htmlFor="password">Nouveau mot de passe (laisser vide pour ne pas modifier)</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control"
                    value={formData.password || ''}
                    onChange={handleChange}
                    disabled={actionLoading}
                  />
                </div>
              )}
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Téléphone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="form-control"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    disabled={actionLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="date_of_birth">Date de naissance</label>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    className="form-control"
                    value={formData.date_of_birth || ''}
                    onChange={handleChange}
                    disabled={actionLoading}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Adresse</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  className="form-control"
                  value={formData.address || ''}
                  onChange={handleChange}
                  disabled={actionLoading}
                />
              </div>
            </div>
            
            <div className="form-section">
              <h4>Informations médicales</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="blood_type">Groupe sanguin</label>
                  <select
                    id="blood_type"
                    name="blood_type"
                    className="form-control"
                    value={formData.blood_type || ''}
                    onChange={handleChange}
                    disabled={actionLoading}
                  >
                    <option value="">Sélectionner</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="emergency_contact">Contact d'urgence</label>
                  <input
                    type="text"
                    id="emergency_contact"
                    name="emergency_contact"
                    className="form-control"
                    value={formData.emergency_contact || ''}
                    onChange={handleChange}
                    disabled={actionLoading}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="allergies">Allergies (séparées par des virgules)</label>
                <input
                  type="text"
                  id="allergies"
                  className="form-control"
                  value={formData.allergies ? formData.allergies.join(', ') : ''}
                  onChange={(e) => handleArrayChange(e, 'allergies')}
                  placeholder="Ex: pénicilline, arachides, lactose"
                  disabled={actionLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="chronic_diseases">Maladies chroniques (séparées par des virgules)</label>
                <input
                  type="text"
                  id="chronic_diseases"
                  className="form-control"
                  value={formData.chronic_diseases ? formData.chronic_diseases.join(', ') : ''}
                  onChange={(e) => handleArrayChange(e, 'chronic_diseases')}
                  placeholder="Ex: asthme, diabète, hypertension"
                  disabled={actionLoading}
                />
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
                  <span><i className="fas fa-save"></i> {editingPatient ? "Mettre à jour" : "Ajouter"}</span>
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

      {/* Tableau des patients */}
      {!showAddForm && (
        <div className="data-table-container">
          {filteredPatients.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Date de naissance</th>
                  <th>Groupe sanguin</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(patient => (
                  <tr key={patient.id}>
                    <td>{patient.name}</td>
                    <td>{patient.email}</td>
                    <td>{patient.phone || "Non renseigné"}</td>
                    <td>{patient.date_of_birth || "Non renseignée"}</td>
                    <td>{patient.blood_type || "Non renseigné"}</td>
                    <td className="actions">
                      <button 
                        className="btn-icon" 
                        title="Modifier" 
                        onClick={() => startEditing(patient)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn-icon danger" 
                        title="Supprimer" 
                        onClick={() => confirmDelete(patient.id, patient.name)}
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
              <i className="fas fa-user-injured"></i>
              <h3>Aucun patient trouvé</h3>
              <p>Ajoutez de nouveaux patients ou modifiez votre recherche</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientsManagement;