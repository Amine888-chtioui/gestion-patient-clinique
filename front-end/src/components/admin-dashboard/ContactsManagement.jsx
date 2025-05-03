// src/components/admin-dashboard/ContactsManagement.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";

const ContactsManagement = ({ actionLoading, setActionLoading, setActionError, setActionSuccess }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/contacts", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setContacts(response.data.contacts || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des messages:", err);
      setActionError("Impossible de charger les messages de contact");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    setActionLoading(true);
    try {
      await axios.put(`/api/admin/contacts/${id}/mark-as-read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Mettre à jour l'état local
      setContacts(contacts.map(contact => 
        contact.id === id ? { ...contact, read: true } : contact
      ));
      
      setActionSuccess("Message marqué comme lu");
    } catch (err) {
      console.error("Erreur:", err);
      setActionError("Impossible de marquer le message comme lu");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce message?")) {
      return;
    }
    
    setActionLoading(true);
    try {
      await axios.delete(`/api/admin/contacts/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Retirer le message de la liste
      setContacts(contacts.filter(contact => contact.id !== id));
      setSelectedContact(null);
      setActionSuccess("Message supprimé avec succès");
    } catch (err) {
      console.error("Erreur:", err);
      setActionError("Impossible de supprimer le message");
    } finally {
      setActionLoading(false);
    }
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="loading-state">Chargement des messages...</div>;
  }

  return (
    <div className="contacts-management">
      <div className="data-table-header">
        <h3>Messages de contact</h3>
        <div className="header-actions">
          <button 
            className="btn-outline" 
            onClick={fetchContacts}
            disabled={actionLoading}
          >
            <i className="fas fa-sync-alt"></i> Actualiser
          </button>
        </div>
      </div>

      <div className="data-table-container">
        {contacts.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>Aucun message de contact</h3>
            <p>Vous n'avez pas encore reçu de messages de contact.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Message</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(contact => (
                <tr key={contact.id} className={!contact.read ? 'unread' : ''}>
                  <td>{formatDate(contact.created_at)}</td>
                  <td>{contact.name}</td>
                  <td>{contact.email}</td>
                  <td>
                    {contact.message.length > 50
                      ? `${contact.message.substring(0, 50)}...`
                      : contact.message}
                  </td>
                  <td>
                    <span className={`status-badge ${contact.read ? 'confirmé' : 'en attente'}`}>
                      {contact.read ? 'Lu' : 'Non lu'}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-icon" 
                      title="Voir les détails" 
                      onClick={() => setSelectedContact(contact)}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    {!contact.read && (
                      <button 
                        className="btn-icon" 
                        title="Marquer comme lu"
                        onClick={() => handleMarkAsRead(contact.id)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-check"></i>
                      </button>
                    )}
                    <button 
                      className="btn-icon danger" 
                      title="Supprimer" 
                      onClick={() => handleDelete(contact.id)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedContact && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Détails du message</h3>
              <button 
                className="modal-close" 
                onClick={() => setSelectedContact(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Date:</strong> {formatDate(selectedContact.created_at)}
              </div>
              <div className="detail-row">
                <strong>Nom:</strong> {selectedContact.name}
              </div>
              <div className="detail-row">
                <strong>Email:</strong> {selectedContact.email}
              </div>
              <div className="detail-row">
                <strong>Message:</strong>
                <p className="detail-message">{selectedContact.message}</p>
              </div>
              <div className="detail-row">
                <strong>Statut:</strong> {selectedContact.read ? 'Lu' : 'Non lu'}
              </div>
            </div>
            <div className="modal-footer">
              {!selectedContact.read && (
                <button 
                  className="btn-primary" 
                  onClick={() => handleMarkAsRead(selectedContact.id)}
                  disabled={actionLoading}
                >
                  <i className="fas fa-check"></i> Marquer comme lu
                </button>
              )}
              <button 
                className="btn-danger" 
                onClick={() => handleDelete(selectedContact.id)}
                disabled={actionLoading}
              >
                <i className="fas fa-trash"></i> Supprimer
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedContact(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsManagement;