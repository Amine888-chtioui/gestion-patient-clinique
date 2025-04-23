// src/components/admin-dashboard/UsersManagement.jsx
import React, { useState } from "react";
import UserForm from "./forms/UserForm";

const UsersManagement = ({
  users,
  handleAddUser,
  handleUpdateUser,
  handleDeleteUser,
  actionLoading
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Filtrer les utilisateurs selon les critères
  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRole && matchesSearch;
  });

  // Gérer la soumission du formulaire d'ajout
  const handleAddSubmit = (userData) => {
    handleAddUser(userData);
    setIsAdding(false);
  };

  // Gérer la soumission du formulaire de modification
  const handleEditSubmit = (userData) => {
    handleUpdateUser(editingUser.id, userData);
    setEditingUser(null);
  };

  // Annuler l'ajout ou la modification
  const handleCancel = () => {
    setIsAdding(false);
    setEditingUser(null);
  };

  // Si on est en mode ajout ou modification, afficher le formulaire
  if (isAdding || editingUser) {
    return (
      <UserForm
        user={editingUser}
        onSubmit={isAdding ? handleAddSubmit : handleEditSubmit}
        onCancel={handleCancel}
        isLoading={actionLoading}
      />
    );
  }

  return (
    <div className="users-management">
      <div className="panel-header">
        <h2>Gestion des utilisateurs</h2>
        <button
          className="btn-primary"
          onClick={() => setIsAdding(true)}
          disabled={actionLoading}
        >
          <i className="fas fa-user-plus"></i> Ajouter un utilisateur
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-options">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="doctor">Médecins</option>
            <option value="patient">Patients</option>
          </select>
          <button
            className="btn-outline"
            onClick={() => {
              setRoleFilter("all");
              setSearchTerm("");
            }}
            disabled={actionLoading}
          >
            <i className="fas fa-sync-alt"></i> Réinitialiser
          </button>
        </div>
      </div>

      {filteredUsers.length > 0 ? (
        <div className="users-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Date de création</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="user-row">
                  <td>
                    <div className="user-name-cell">
                      <div className={`user-avatar-small ${user.role}`}>
                        {user.role === 'admin' && <i className="fas fa-user-shield"></i>}
                        {user.role === 'doctor' && <i className="fas fa-user-md"></i>}
                        {user.role === 'patient' && <i className="fas fa-user-injured"></i>}
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role === 'admin' && 'Administrateur'}
                      {user.role === 'doctor' && 'Médecin'}
                      {user.role === 'patient' && 'Patient'}
                    </span>
                  </td>
                  <td>{user.created_at || "N/A"}</td>
                  <td>
                    <span className={`status-badge ${user.email_verified_at ? 'confirmé' : 'en attente'}`}>
                      {user.email_verified_at ? 'Vérifié' : 'Non vérifié'}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="btn-icon"
                      title="Modifier"
                      onClick={() => setEditingUser(user)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn-icon"
                      title="Réinitialiser le mot de passe"
                      onClick={() => alert("Fonctionnalité en cours de développement")}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-key"></i>
                    </button>
                    {user.role !== 'admin' && (
                      <button
                        className="btn-icon"
                        title="Supprimer"
                        onClick={() => {
                          if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.name}?`)) {
                            handleDeleteUser(user.id);
                          }
                        }}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-users"></i>
          <h3>Aucun utilisateur trouvé</h3>
          <p>Aucun utilisateur ne correspond à vos critères de recherche</p>
        </div>
      )}

      <div className="roles-legend">
        <h4>Légende des rôles</h4>
        <div className="role-items">
          <div className="role-item">
            <span className="role-badge admin">Administrateur</span>
            <p>Accès complet au système, gestion des utilisateurs et des paramètres</p>
          </div>
          <div className="role-item">
            <span className="role-badge doctor">Médecin</span>
            <p>Gestion des patients, des rendez-vous et des dossiers médicaux</p>
          </div>
          <div className="role-item">
            <span className="role-badge patient">Patient</span>
            <p>Prise de rendez-vous et accès à leur dossier médical personnel</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;