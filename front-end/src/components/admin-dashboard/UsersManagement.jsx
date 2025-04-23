// src/components/admin-dashboard/UsersManagement.jsx
import React, { useState } from "react";

const UsersManagement = ({ 
  users,
  handleAddUser, 
  handleUpdateUser, 
  handleDeleteUser, 
  actionLoading 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  // Modèle vide pour un nouvel utilisateur
  const emptyUser = {
    name: "",
    email: "",
    password: "",
    role: "patient"
  };
  
  // État du formulaire (pour ajout ou édition)
  const [formData, setFormData] = useState(emptyUser);
  
  // Filtrer les utilisateurs selon les critères
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });
  
  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Démarrer l'édition d'un utilisateur
  const startEditing = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Ne pas afficher le mot de passe actuel
      role: user.role
    });
    setEditingUser(user.id);
    setShowAddForm(true);
  };
  
  // Annuler l'édition ou l'ajout
  const cancelForm = () => {
    setFormData(emptyUser);
    setEditingUser(null);
    setShowAddForm(false);
  };
  
  // Soumettre le formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingUser) {
      // Mise à jour d'un utilisateur existant
      handleUpdateUser(editingUser, formData);
    } else {
      // Ajout d'un nouvel utilisateur
      handleAddUser(formData);
    }
    
    // Réinitialiser le formulaire après soumission
    cancelForm();
  };
  
  // Confirmer la suppression d'un utilisateur
  const confirmDelete = (id, name, role) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${name} (${role}) ?`)) {
      handleDeleteUser(id);
    }
  };

  // Obtenir la classe CSS pour le badge du rôle
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "admin":
        return "role-badge admin";
      case "doctor":
        return "role-badge doctor";
      case "patient":
        return "role-badge patient";
      default:
        return "role-badge";
    }
  };

  // Obtenir le libellé traduit pour le rôle
  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "doctor":
        return "Médecin";
      case "patient":
        return "Patient";
      default:
        return role;
    }
  };

  return (
    <div className="users-management">
      {/* En-tête avec filtres et bouton d'ajout */}
      <div className="data-table-header">
        <div className="search-filters" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Rechercher un utilisateur..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="form-control"
            style={{ width: 'auto' }}
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="doctor">Médecins</option>
            <option value="patient">Patients</option>
          </select>
          
          <button 
            className="btn-secondary" 
            onClick={() => {
              setSearchTerm("");
              setRoleFilter("all");
            }}
            disabled={actionLoading}
          >
            <i className="fas fa-sync-alt"></i> Réinitialiser
          </button>
        </div>
        
        <button 
          className="btn-primary" 
          onClick={() => {
            setFormData(emptyUser);
            setEditingUser(null);
            setShowAddForm(true);
          }}
          disabled={actionLoading}
        >
          <i className="fas fa-user-plus"></i> Ajouter un utilisateur
        </button>
      </div>

      {/* Formulaire d'ajout/édition */}
      {showAddForm && (
        <div className="form-container">
          <h3>{editingUser ? "Modifier l'utilisateur" : "Ajouter un nouvel utilisateur"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h4>Informations utilisateur</h4>
              
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
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">
                    {editingUser ? "Nouveau mot de passe (laisser vide pour ne pas modifier)" : "Mot de passe*"}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                    required={!editingUser}
                    disabled={actionLoading}
                  />
                  {!editingUser && (
                    <small className="form-text">
                      Doit contenir au moins 8 caractères.
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="role">Rôle*</label>
                  <select
                    id="role"
                    name="role"
                    className="form-control"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    disabled={actionLoading}
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Médecin</option>
                    <option value="admin">Administrateur</option>
                  </select>
                  <small className="form-text">
                    Attention: attribuer le rôle d'administrateur donne un accès complet au système.
                  </small>
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
                  <span><i className="fas fa-save"></i> {editingUser ? "Mettre à jour" : "Ajouter"}</span>
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

      {/* Tableau des utilisateurs */}
      {!showAddForm && (
        <div className="data-table-container">
          {filteredUsers.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Date de création</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={getRoleBadgeClass(user.role)}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td>{user.created_at}</td>
                    <td className="actions">
                      <button 
                        className="btn-icon" 
                        title="Modifier" 
                        onClick={() => startEditing(user)}
                        disabled={actionLoading || user.role === "admin"}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn-icon danger" 
                        title="Supprimer" 
                        onClick={() => confirmDelete(user.id, user.name, getRoleLabel(user.role))}
                        disabled={actionLoading || user.role === "admin"}
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
              <i className="fas fa-users-slash"></i>
              <h3>Aucun utilisateur trouvé</h3>
              <p>Ajoutez de nouveaux utilisateurs ou modifiez vos filtres</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UsersManagement;