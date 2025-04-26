// src/components/patient-dashboard/Invoices.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../axios";

const Invoices = ({ actionLoading }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  
  const navigate = useNavigate();

  // Fonction utilitaire pour les en-têtes d'autorisation
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // Construire les paramètres de requête
      const params = {};
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }
      
      const response = await axios.get("/api/patient/invoices", {
        ...getAuthHeaders(),
        params
      });
      
      setInvoices(response.data.invoices.data || []);
      
    } catch (err) {
      console.error("Erreur lors de la récupération des factures:", err);
      setError("Impossible de charger les factures. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  // Télécharger une facture en PDF
  const handleDownloadInvoice = async (id) => {
    try {
      const response = await axios.get(`/api/patient/invoices/${id}/download`, {
        ...getAuthHeaders(),
        responseType: 'blob'
      });
      
      // Créer une URL pour le blob et télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err) {
      console.error("Erreur lors du téléchargement de la facture:", err);
    }
  };

  // Formater un montant en euros
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Formater une date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Obtenir la classe CSS en fonction du statut
  const getStatusClass = (status) => {
    switch (status) {
      case 'paid':
        return 'status-badge confirmed';
      case 'unpaid':
        return 'status-badge pending';
      case 'overdue':
        return 'status-badge cancelled';
      default:
        return 'status-badge';
    }
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'unpaid':
        return 'Non payée';
      case 'draft':
        return 'Brouillon';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="loading-indicator">Chargement des factures...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="invoices-container">
      <h3>Mes factures</h3>
      
      <div className="filter-bar">
        <div className="filter-item">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={actionLoading}
          >
            <option value="all">Tous les statuts</option>
            <option value="paid">Payées</option>
            <option value="unpaid">Non payées</option>
          </select>
        </div>
        
        <button 
          className="btn-outline"
          onClick={() => navigate("/patient-invoices")}
          disabled={actionLoading}
        >
          <i className="fas fa-external-link-alt"></i> Voir toutes mes factures
        </button>
      </div>

      {invoices.length > 0 ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Date</th>
                <th>Échéance</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 5).map(invoice => (
                <tr key={invoice.id}>
                  <td>{invoice.number}</td>
                  <td>{formatDate(invoice.date)}</td>
                  <td>{formatDate(invoice.due_date)}</td>
                  <td>{formatAmount(invoice.total_amount)}</td>
                  <td>
                    <span className={getStatusClass(invoice.status)}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-icon" 
                      title="Voir les détails" 
                      onClick={() => navigate(`/patient-invoices/${invoice.id}`)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      className="btn-icon" 
                      title="Télécharger" 
                      onClick={() => handleDownloadInvoice(invoice.id)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-file-invoice-dollar"></i>
          <h3>Aucune facture trouvée</h3>
          <p>Vous n'avez pas encore de factures ou aucune facture ne correspond à vos critères de recherche.</p>
        </div>
      )}
    </div>
  );
};

export default Invoices;