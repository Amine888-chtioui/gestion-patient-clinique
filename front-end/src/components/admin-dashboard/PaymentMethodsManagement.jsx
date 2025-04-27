// src/components/admin-dashboard/PaymentMethodsManagement.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";

const PaymentMethodsManagement = ({ actionLoading, setActionLoading, setActionError, setActionSuccess }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    is_active: true,
    is_default: false,
    config: {}
  });

  // Récupérer les méthodes de paiement
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/payment-methods", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setPaymentMethods(response.data.payment_methods || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des méthodes de paiement:", err);
      setActionError("Impossible de charger les méthodes de paiement. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  // Gérer la soumission du formulaire (ajout/modification)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      let response;
      if (editingMethod) {
        // Mise à jour
        response = await axios.put(
          `/api/admin/payment-methods/${editingMethod.id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }
        );

        // Mettre à jour la liste des méthodes de paiement
        setPaymentMethods(
          paymentMethods.map(method =>
            method.id === editingMethod.id ? response.data.payment_method : method
          )
        );
        
        setActionSuccess("Méthode de paiement mise à jour avec succès!");
      } else {
        // Création
        response = await axios.post(
          "/api/admin/payment-methods",
          formData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }
        );

        // Ajouter la nouvelle méthode à la liste
        setPaymentMethods([...paymentMethods, response.data.payment_method]);
        
        setActionSuccess("Méthode de paiement créée avec succès!");
      }

      // Réinitialiser le formulaire
      resetForm();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la méthode de paiement:", err);
      setActionError(
        err.response?.data?.message ||
        "Impossible d'enregistrer la méthode de paiement. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Supprimer une méthode de paiement
  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette méthode de paiement?")) {
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await axios.delete(`/api/admin/payment-methods/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      // Supprimer de la liste
      setPaymentMethods(paymentMethods.filter(method => method.id !== id));
      
      setActionSuccess("Méthode de paiement supprimée avec succès!");
    } catch (err) {
      console.error("Erreur lors de la suppression de la méthode de paiement:", err);
      setActionError(
        err.response?.data?.message ||
        "Impossible de supprimer la méthode de paiement. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Définir comme méthode par défaut
  const handleSetDefault = async (id) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await axios.post(
        `/api/admin/payment-methods/${id}/set-default`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      // Mettre à jour la liste
      fetchPaymentMethods();
      
      setActionSuccess("Méthode de paiement définie comme méthode par défaut avec succès!");
    } catch (err) {
      console.error("Erreur lors de la définition de la méthode par défaut:", err);
      setActionError(
        err.response?.data?.message ||
        "Impossible de définir la méthode par défaut. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Modifier une méthode de paiement
  const handleEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      code: method.code,
      description: method.description || "",
      is_active: method.is_active,
      is_default: method.is_default,
      config: method.config || {}
    });
    setShowForm(true);
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      is_active: true,
      is_default: false,
      config: {}
    });
    setEditingMethod(null);
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

  if (loading) {
    return <div className="loading-indicator">Chargement des méthodes de paiement...</div>;
  }

  return (
    <div className="payment-methods-container">
      <div className="header-with-actions">
        <h2>Méthodes de paiement</h2>
        {!showForm ? (
          <button className="btn-primary" onClick={() => setShowForm(true)} disabled={actionLoading}>
            <i className="fas fa-plus"></i> Ajouter une méthode de paiement
          </button>
        ) : (
          <button className="btn-secondary" onClick={resetForm} disabled={actionLoading}>
            <i className="fas fa-times"></i> Annuler
          </button>
        )}
      </div>

      {/* Formulaire d'ajout/modification */}
      {showForm && (
        <div className="form-card">
          <h3>{editingMethod ? "Modifier la méthode de paiement" : "Ajouter une méthode de paiement"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nom *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={actionLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="code">Code *</label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                disabled={actionLoading || editingMethod}
                placeholder="Ex: card, cash, transfer"
              />
              {editingMethod && (
                <small className="info-text">Le code ne peut pas être modifié une fois créé.</small>
              )}
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
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  disabled={actionLoading}
                />
                Méthode active
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="is_default"
                  checked={formData.is_default}
                  onChange={handleChange}
                  disabled={actionLoading}
                />
                Méthode par défaut
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={actionLoading}>
                {actionLoading ? (
                  <span><i className="fas fa-spinner fa-spin"></i> Enregistrement...</span>
                ) : (
                  <span><i className="fas fa-save"></i> {editingMethod ? "Mettre à jour" : "Ajouter"}</span>
                )}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm} disabled={actionLoading}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des méthodes de paiement */}
      {paymentMethods.length > 0 ? (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Code</th>
                <th>Description</th>
                <th>Statut</th>
                <th>Par défaut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentMethods.map(method => (
                <tr key={method.id}>
                  <td>{method.name}</td>
                  <td><code>{method.code}</code></td>
                  <td>{method.description || "-"}</td>
                  <td>
                    <span className={`status-badge ${method.is_active ? "confirmé" : "annulé"}`}>
                      {method.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {method.is_default ? (
                      <span className="default-badge">
                        <i className="fas fa-check-circle"></i> Par défaut
                      </span>
                    ) : (
                      <button
                        className="btn-sm btn-outline"
                        onClick={() => handleSetDefault(method.id)}
                        disabled={actionLoading}
                      >
                        Définir par défaut
                      </button>
                    )}
                  </td>
                  <td className="actions">
                    <button
                      className="btn-icon"
                      title="Modifier"
                      onClick={() => handleEdit(method)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn-icon danger"
                      title="Supprimer"
                      onClick={() => handleDelete(method.id)}
                      disabled={actionLoading || method.is_default}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-credit-card"></i>
          <h3>Aucune méthode de paiement</h3>
          <p>Vous n'avez pas encore configuré de méthodes de paiement. Cliquez sur le bouton ci-dessus pour en ajouter une.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsManagement;