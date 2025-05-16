import React, { useState, useEffect } from "react";
import axios from "../../axios";

const ServicesManagement = ({ actionLoading, setActionLoading, setActionError, setActionSuccess }) => {
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // État du formulaire
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    is_active: true
  });

  // État pour l'assignation de médecins
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("");

  // Charger les services au chargement du composant
  useEffect(() => {
    fetchServices();
    fetchDoctors();
  }, []);

  // Récupérer la liste des services
  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/services", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setServices(response.data.services || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des services:", err);
      setActionError("Impossible de charger les services");
    } finally {
      setLoading(false);
    }
  };

  // Récupérer la liste des médecins
  const fetchDoctors = async () => {
    try {
      const response = await axios.get("/api/admin/doctors", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setDoctors(response.data.doctors || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des médecins:", err);
    }
  };

  // Récupérer les détails d'un service spécifique (avec ses médecins)
  const fetchServiceDetails = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/services/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setSelectedService(response.data.service || null);
    } catch (err) {
      console.error("Erreur lors de la récupération des détails du service:", err);
      setActionError("Impossible de charger les détails du service");
    } finally {
      setLoading(false);
    }
  };

  // Soumettre le formulaire (ajout/modification)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      let response;
      if (editingService) {
        // Mise à jour d'un service existant
        response = await axios.put(
          `/api/admin/services/${editingService.id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }
        );

        // Mettre à jour la liste des services
        setServices(
          services.map(service =>
            service.id === editingService.id ? response.data.service : service
          )
        );
        
        setActionSuccess("Service mis à jour avec succès!");
      } else {
        // Création d'un nouveau service
        response = await axios.post(
          "/api/admin/services",
          formData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }
        );

        // Ajouter le nouveau service à la liste
        setServices([...services, response.data.service]);
        
        setActionSuccess("Service créé avec succès!");
      }

      // Réinitialiser le formulaire
      resetForm();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du service:", err);
      setActionError(
        err.response?.data?.message ||
        "Impossible d'enregistrer le service. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Assigner un médecin à un service
  const handleAssignDoctor = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedService) return;
    
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await axios.post(
        `/api/admin/services/${selectedService.id}/doctors`,
        { doctor_id: selectedDoctor },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );
      
      // Rafraîchir les détails du service
      await fetchServiceDetails(selectedService.id);
      setActionSuccess("Médecin assigné au service avec succès!");
      setSelectedDoctor("");
    } catch (err) {
      console.error("Erreur lors de l'assignation du médecin:", err);
      setActionError(
        err.response?.data?.message ||
        "Impossible d'assigner le médecin au service. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Retirer un médecin d'un service
  const handleRemoveDoctor = async (doctorId) => {
    if (!selectedService) return;
    
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await axios.delete(
        `/api/admin/services/${selectedService.id}/doctors`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          data: { doctor_id: doctorId }
        }
      );
      
      // Rafraîchir les détails du service
      await fetchServiceDetails(selectedService.id);
      setActionSuccess("Médecin retiré du service avec succès!");
    } catch (err) {
      console.error("Erreur lors du retrait du médecin:", err);
      setActionError(
        err.response?.data?.message ||
        "Impossible de retirer le médecin du service. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Supprimer un service
  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce service?")) {
      return;
    }
    
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await axios.delete(`/api/admin/services/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Retirer le service de la liste
      setServices(services.filter(service => service.id !== id));
      
      // Si le service supprimé était sélectionné, le désélectionner
      if (selectedService && selectedService.id === id) {
        setSelectedService(null);
      }
      
      setActionSuccess("Service supprimé avec succès!");
    } catch (err) {
      console.error("Erreur lors de la suppression du service:", err);
      setActionError(
        err.response?.data?.message ||
        "Impossible de supprimer le service. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Modifier un service
  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      icon: service.icon || "",
      is_active: service.is_active
    });
    setShowForm(true);
  };

  // Voir les détails d'un service
  const handleViewDetails = (id) => {
    fetchServiceDetails(id);
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "",
      is_active: true
    });
    setEditingService(null);
    setShowForm(false);
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  // Filtrer les services selon le terme de recherche
  const filteredServices = services.filter(service => {
    return service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Affichage pendant le chargement
  if (loading && !selectedService && services.length === 0) {
    return <div className="loading-state">Chargement des services...</div>;
  }

  return (
    <div className="services-management" style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      margin: '0',
      overflow: 'hidden'
    }}>
      <div className="data-table-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e9ecef'
      }}>
        <h3>Gestion des services</h3>
        <button 
          className="btn-primary" 
          onClick={() => { 
            setShowForm(true); 
            setEditingService(null);
            setSelectedService(null);
          }}
          disabled={actionLoading}
        >
          <i className="fas fa-plus"></i> Ajouter un service
        </button>
      </div>

      {/* Formulaire d'ajout/édition */}
      {showForm && (
        <div className="form-container">
          <h3>{editingService ? "Modifier le service" : "Ajouter un nouveau service"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nom du service *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={actionLoading}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                disabled={actionLoading}
                className="form-control"
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="icon">Icône (classe FontAwesome)</label>
              <input
                type="text"
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                disabled={actionLoading}
                className="form-control"
                placeholder="Ex: fa-heartbeat, fa-stethoscope"
              />
              <small className="form-text">
                Entrez le nom de l'icône FontAwesome sans le préfixe "fa-". Ex: "heartbeat" pour une icône de cœur.
              </small>
            </div>
            
            <div className="form-group">
              <div className="form-check">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  disabled={actionLoading}
                  className="form-check-input"
                />
                <label htmlFor="is_active" className="form-check-label">Service actif</label>
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
                  <span><i className="fas fa-save"></i> {editingService ? "Mettre à jour" : "Ajouter"}</span>
                )}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={resetForm}
                disabled={actionLoading}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Détails d'un service sélectionné */}
      {selectedService && !showForm && (
        <div className="service-details">
          <div className="service-details-header">
            <h3>
              {selectedService.icon && <i className={`fas fa-${selectedService.icon}`}></i>} 
              {selectedService.name}
            </h3>
            <div className="header-actions">
              <button 
                className="btn-outline" 
                onClick={() => handleEdit(selectedService)}
                disabled={actionLoading}
              >
                <i className="fas fa-edit"></i> Modifier
              </button>
              <button 
                className="btn-danger" 
                onClick={() => handleDelete(selectedService.id)}
                disabled={actionLoading}
              >
                <i className="fas fa-trash"></i> Supprimer
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedService(null)}
                disabled={actionLoading}
              >
                <i className="fas fa-arrow-left"></i> Retour
              </button>
            </div>
          </div>
          
          <div className="service-details-content">
            <div className="detail-item">
              <span className="detail-label">Description:</span>
              <span className="detail-value">{selectedService.description || "Non spécifiée"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Statut:</span>
              <span className={`status-badge ${selectedService.is_active ? "confirmé" : "annulé"}`}>
                {selectedService.is_active ? "Actif" : "Inactif"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Icône:</span>
              <span className="detail-value">
                {selectedService.icon ? (
                  <>
                    <i className={`fas fa-${selectedService.icon}`}></i> {selectedService.icon}
                  </>
                ) : (
                  "Non spécifiée"
                )}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Nombre de médecins:</span>
              <span className="detail-value">{selectedService.doctors_count || 0}</span>
            </div>
          </div>
          
          <div className="service-doctors">
            <div className="section-header">
              <h4>Médecins associés</h4>
              <button 
                className="btn-outline" 
                onClick={() => setShowAssignForm(!showAssignForm)}
                disabled={actionLoading}
              >
                <i className="fas fa-user-md"></i> {showAssignForm ? "Annuler" : "Assigner un médecin"}
              </button>
            </div>
            
            {showAssignForm && (
              <div className="assign-form">
                <form onSubmit={handleAssignDoctor}>
                  <div className="form-group">
                    <label htmlFor="doctor_id">Sélectionner un médecin</label>
                    <select
                      id="doctor_id"
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      required
                      disabled={actionLoading}
                      className="form-control"
                    >
                      <option value="">Choisir un médecin</option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} {doctor.speciality ? `(${doctor.speciality})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={!selectedDoctor || actionLoading}
                  >
                    {actionLoading ? (
                      <span><i className="loading-spinner"></i> Traitement...</span>
                    ) : (
                      <span><i className="fas fa-plus"></i> Assigner</span>
                    )}
                  </button>
                </form>
              </div>
            )}
            
            {selectedService.doctors && selectedService.doctors.length > 0 ? (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Spécialité</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedService.doctors.map(doctor => (
                      <tr key={doctor.user.id}>
                        <td>{doctor.user.name}</td>
                        <td>{doctor.user.email}</td>
                        <td>{doctor.specialite || "Non spécifiée"}</td>
                        <td className="actions">
                          <button 
                            className="btn-icon danger" 
                            title="Retirer du service" 
                            onClick={() => handleRemoveDoctor(doctor.user.id)}
                            disabled={actionLoading}
                          >
                            <i className="fas fa-user-minus"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-user-md"></i>
                <h3>Aucun médecin associé</h3>
                <p>Ce service n'a pas encore de médecin assigné.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liste des services */}
      {!selectedService && !showForm && (
        <>
          <div className="search-box" style={{
            position: 'relative',
            marginBottom: '1.5rem'
          }}>
            <i className="fas fa-search" style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6c757d'
            }}></i>
            <input 
              type="text" 
              placeholder="Rechercher un service..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '0.95rem'
              }}
            />
          </div>
          
          <div className="data-table-container">
            {filteredServices.length > 0 ? (
              <table className="data-table" style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Icône</th>
                    <th>Statut</th>
                    <th>Médecins</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map(service => (
                    <tr key={service.id}>
                      <td>{service.name}</td>
                      <td>
                        {service.description
                          ? service.description.length > 50
                            ? `${service.description.substring(0, 50)}...`
                            : service.description
                          : "Non spécifiée"}
                      </td>
                      <td>
                        {service.icon ? (
                          <i className={`fas fa-${service.icon}`}></i>
                        ) : (
                          "Non spécifiée"
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${service.is_active ? "confirmé" : "annulé"}`} style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '50px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          background: service.is_active ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                          color: service.is_active ? '#28a745' : '#dc3545'
                        }}>
                          {service.is_active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td>{service.doctors_count || 0}</td>
                      <td className="actions" style={{
                        display: 'flex',
                        gap: '0.5rem'
                      }}>
                        <button 
                          className="btn-icon" 
                          title="Voir les détails" 
                          onClick={() => handleViewDetails(service.id)}
                          disabled={actionLoading}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent',
                            border: 'none',
                            color: '#6c757d',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button 
                          className="btn-icon" 
                          title="Modifier" 
                          onClick={() => handleEdit(service)}
                          disabled={actionLoading}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent',
                            border: 'none',
                            color: '#6c757d',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn-icon danger" 
                          title="Supprimer" 
                          onClick={() => handleDelete(service.id)}
                          disabled={actionLoading}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent',
                            border: 'none',
                            color: '#dc3545',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem',
                textAlign: 'center'
              }}>
                <i className="fas fa-hospital" style={{
                  fontSize: '3rem',
                  color: '#ced4da',
                  marginBottom: '1rem'
                }}></i>
                <h3>Aucun service trouvé</h3>
                <p>Ajoutez de nouveaux services ou modifiez votre recherche</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ServicesManagement;