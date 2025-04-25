// src/components/patient-dashboard/PatientInvoicesList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../axios";
import "../components/patient-dashboard/patient-invoices.css";

// Composants communs
import LoadingSpinner from "./common/LoadingSpinner";
import ErrorDisplay from "./common/ErrorDisplay";
import ActionMessages from "./common/ActionMessages";

const PatientInvoicesList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [unpaidTotal, setUnpaidTotal] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0
  });

  // États pour les filtres
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // État pour les messages d'action
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  const navigate = useNavigate();

  // Fonction utilitaire pour les en-têtes d'autorisation
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // Récupérer les factures
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        
        // Construire les paramètres de requête
        const params = {};
        if (statusFilter && statusFilter !== "all") {
          params.status = statusFilter;
        }
        if (dateFrom) {
          params.date_from = dateFrom;
        }
        if (dateTo) {
          params.date_to = dateTo;
        }
        
        const response = await axios.get("/api/patient/invoices", {
          ...getAuthHeaders(),
          params
        });
        
        setInvoices(response.data.invoices.data || []);
        setUnpaidTotal(response.data.unpaid_total || 0);
        
        // Calculer les statistiques
        const allInvoices = response.data.invoices.data || [];
        const stats = {
          total: allInvoices.length,
          paid: allInvoices.filter(inv => inv.status === 'paid').length,
          unpaid: allInvoices.filter(inv => inv.status === 'unpaid').length,
          overdue: allInvoices.filter(inv => 
            inv.status === 'unpaid' && new Date(inv.due_date) < new Date()
          ).length
        };
        
        setStats(stats);
        
      } catch (err) {
        console.error("Erreur lors de la récupération des factures:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("Impossible de charger les factures. Veuillez réessayer plus tard.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [navigate, statusFilter, dateFrom, dateTo]);

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
      setActionError("Impossible de télécharger la facture. Veuillez réessayer plus tard.");
      setTimeout(() => setActionError(null), 3000);
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

  // Réinitialiser les filtres
  const resetFilters = () => {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  // Affichage en cas de chargement
  if (loading) {
    return <LoadingSpinner />;
  }

  // Affichage en cas d'erreur
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="patient-invoices-container">
      <div className="invoices-header">
        <h1>Mes factures</h1>
        <button className="btn-outline" onClick={() => navigate("/patient/dashboard")}>
          <i className="fas fa-arrow-left"></i> Retour au tableau de bord
        </button>
      </div>

      <ActionMessages success={actionSuccess} error={actionError} />

      <div className="summary-cards">
        <div className="invoice-summary-card">
          <div className="summary-title">
            <i className="fas fa-file-invoice"></i>
            <h3>Total des factures</h3>
          </div>
          <div className="summary-count">{stats.total}</div>
        </div>
        
        <div className="invoice-summary-card">
          <div className="summary-title">
            <i className="fas fa-check-circle" style={{ color: 'var(--success-color)' }}></i>
            <h3>Factures payées</h3>
          </div>
          <div className="summary-count">{stats.paid}</div>
        </div>
        
        <div className="invoice-summary-card">
          <div className="summary-title">
            <i className="fas fa-clock" style={{ color: 'var(--warning-color)' }}></i>
            <h3>En attente de paiement</h3>
          </div>
          <div className="summary-count">{stats.unpaid}</div>
        </div>
        
        <div className="invoice-summary-card">
          <div className="summary-title">
            <i className="fas fa-euro-sign" style={{ color: 'var(--primary-color)' }}></i>
            <h3>Montant dû</h3>
          </div>
          <div className="summary-amount">{formatAmount(unpaidTotal)}</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="date-filters">
          <div className="date-filter">
            <label htmlFor="date-from">Du:</label>
            <input
              type="date"
              id="date-from"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          
          <div className="date-filter">
            <label htmlFor="date-to">Au:</label>
            <input
              type="date"
              id="date-to"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
        
        <div className="status-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="paid">Payées</option>
            <option value="unpaid">Non payées</option>
          </select>
        </div>
        
        <button className="btn-secondary" onClick={resetFilters}>
          <i className="fas fa-sync-alt"></i> Réinitialiser
        </button>
      </div>

      {invoices.length > 0 ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Date</th>
                <th>Date d'échéance</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => (
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
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      className="btn-icon" 
                      title="Télécharger" 
                      onClick={() => handleDownloadInvoice(invoice.id)}
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

export default PatientInvoicesList;