// src/components/admin-dashboard/DoctorsManagement.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";

const DoctorsManagement = ({ 
  doctors,
  handleAddDoctor, 
  handleUpdateDoctor, 
  handleDeleteDoctor, 
  actionLoading 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [services, setServices] = useState([]);
  
  // Modèle vide pour un nouveau médecin
  const emptyDoctor = {
    name: "",
    email: "",
    password: "",
    speciality: "",
    phone: "",
    bio: "",
    education: "",
    experience: "",
    service_id: ""
  };
  
  // État du formulaire (pour ajout ou édition)
  const [formData, setFormData] = useState(emptyDoctor);

  // Charger les services disponibles
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get("/api/admin/services", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        
        setServices(response.data.services || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des services:", err);
      }
    };

    fetchServices();
  }, []);
  
  // Filtrer les médecins selon le terme de recherche
  const filteredDoctors = doctors.filter(doctor => {
    return (
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.speciality && doctor.speciality.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doctor.phone && doctor.phone.includes(searchTerm))
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
  
  // Démarrer l'édition d'un médecin
  const startEditing = (doctor) => {
    setFormData({
      ...doctor,
      password: "", // Ne pas afficher le mot de passe actuel
      service_id: doctor.service?.id || ""
    });
    setEditingDoctor(doctor.id);
    setShowAddForm(true);
  };
  
  // Annuler l'édition ou l'ajout
  const cancelForm = () => {
    setFormData(emptyDoctor);
    setEditingDoctor(null);
    setShowAddForm(false);
  };
  
  // Soumettre le formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingDoctor) {
      // Mise à jour d'un médecin existant
      handleUpdateDoctor(editingDoctor, formData);
    } else {
      // Ajout d'un nouveau médecin
      handleAddDoctor(formData);
    }
    
    // Réinitialiser le formulaire après soumission
    cancelForm();
  };
  
  // Confirmer la suppression d'un médecin
  const confirmDelete = (id, name) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le médecin ${name} ?`)) {
      handleDeleteDoctor(id);
    }
  };

  // Obtenir le nom d'un service à partir de son ID
  const getServiceName = (serviceId) => {
    if (!serviceId) return "Non assigné";
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : "Service inconnu";
  };

  return (
    <div className="doctors-management">
      {/* En-tête avec recherche et bouton d'ajout */}
      <div className="data-table-header">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Rechercher un médecin..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn-primary" 
          onClick={() => {
            setFormData(emptyDoctor);
            setEditingDoctor(null);
            setShowAddForm(true);
          }}
          disabled={actionLoading}
        >
          <i className="fas fa-user-md"></i> Ajouter un médecin
        </button>
      </div>

      {/* Formulaire d'ajout/édition */}
      {showAddForm && (
        <div className="form-container">
          <h3>{editingDoctor ? "Modifier le médecin" : "Ajouter un nouveau médecin"}</h3>
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
              
              {!editingDoctor && (
                <div className="form-group">
                  <label htmlFor="password">Mot de passe*</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                    required={!editingDoctor}
                    disabled={actionLoading}
                  />
                  <small className="form-text">
                    Doit contenir au moins 8 caractères.
                  </small>
                </div>
              )}
              
              {editingDoctor && (
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
                  <label htmlFor="speciality">Spécialité</label>
                  <input
                    type="text"
                    id="speciality"
                    name="speciality"
                    className="form-control"
                    value={formData.speciality || ''}
                    onChange={handleChange}
                    disabled={actionLoading}
                  />
                </div>
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
              </div>

              <div className="form-group">
                <label htmlFor="service_id">Service</label>
                <select
                  id="service_id"
                  name="service_id"
                  className="form-control"
                  value={formData.service_id || ''}
                  onChange={handleChange}
                  disabled={actionLoading}
                >
                  <option value="">Sélectionner un service</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-section">
              <h4>Profil professionnel</h4>
              <div className="form-group">
                <label htmlFor="bio">Biographie</label>
                <textarea
                  id="bio"
                  name="bio"
                  className="form-control"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  rows="3"
                  disabled={actionLoading}
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="education">Formation</label>
                <textarea
                  id="education"
                  name="education"
                  className="form-control"
                  value={formData.education || ''}
                  onChange={handleChange}
                  rows="3"
                  disabled={actionLoading}
                  placeholder="Diplômes, formations, établissements..."
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="experience">Expérience professionnelle</label>
                <textarea
                  id="experience"
                  name="experience"
                  className="form-control"
                  value={formData.experience || ''}
                  onChange={handleChange}
                  rows="3"
                  disabled={actionLoading}
                  placeholder="Postes occupés, établissements, années..."
                ></textarea>
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
                  <span><i className="fas fa-save"></i> {editingDoctor ? "Mettre à jour" : "Ajouter"}</span>
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

      {/* Tableau des médecins */}
      {!showAddForm && (
        <div className="data-table-container">
          {filteredDoctors.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Spécialité</th>
                  <th>Service</th>
                  <th>Téléphone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map(doctor => (
                  <tr key={doctor.id}>
                    <td>{doctor.name}</td>
                    <td>{doctor.email}</td>
                    <td>{doctor.speciality || "Non spécifiée"}</td>
                    <td>{doctor.service ? doctor.service.name : "Non assigné"}</td>
                    <td>{doctor.phone || "Non renseigné"}</td>
                    <td className="actions">
                      <button 
                        className="btn-icon" 
                        title="Modifier" 
                        onClick={() => startEditing(doctor)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn-icon danger" 
                        title="Supprimer" 
                        onClick={() => confirmDelete(doctor.id, doctor.name)}
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
              <i className="fas fa-user-md"></i>
              <h3>Aucun médecin trouvé</h3>
              <p>Ajoutez de nouveaux médecins ou modifiez votre recherche</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorsManagement;