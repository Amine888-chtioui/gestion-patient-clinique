// src/pages/PatientInvoicesPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axios";
import "../components/patient-dashboard/patient-invoices.css";
import "../components/patient-dashboard/PatientDashboard.css";

const PatientInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unpaidTotal, setUnpaidTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  // S'assurer que invoices est un tableau avant le rendu
  useEffect(() => {
    if (!Array.isArray(invoices)) {
      setInvoices([]);
    }
  }, [invoices]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;

      // Pour le test - utiliser des données fictives si le backend n'est pas disponible
      try {
        const response = await axios.get("/api/patient/invoices", {
          params,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        // Journaliser la réponse pour le débogage
        console.log("Réponse du serveur:", response.data);
        
        // S'assurer que invoices est toujours un tableau
        const invoicesData = Array.isArray(response.data.invoices) 
          ? response.data.invoices 
          : response.data.invoices 
            ? [response.data.invoices] 
            : [];
        
        console.log("invoicesData après traitement:", invoicesData);
        
        setInvoices(invoicesData);
        setUnpaidTotal(response.data.unpaid_total || 0);
      } catch (apiError) {
        console.error("Erreur API, utilisation de données fictives:", apiError);
        
        // Utiliser des données fictives pour test/développement
        const mockInvoices = [
          {
            id: 1,
            number: "INV-2023001",
            date: "2023-04-15",
            due_date: "2023-05-15",
            status: "paid",
            total_amount: 75.00,
            payment_date: "2023-04-20",
            payment_method: "card"
          },
          {
            id: 2,
            number: "INV-2023002",
            date: "2023-05-10",
            due_date: "2023-06-10",
            status: "unpaid",
            total_amount: 120.50
          },
          {
            id: 3,
            number: "INV-2023003",
            date: "2023-06-05",
            due_date: "2023-07-05",
            status: "unpaid",
            total_amount: 45.75
          }
        ];
        
        setInvoices(mockInvoices);
        setUnpaidTotal(166.25); // Somme des factures impayées
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des factures:", err);
      setError("Impossible de charger les factures. Veuillez réessayer plus tard.");
      setInvoices([]); // Initialiser explicitement comme tableau vide
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleResetFilters = () => {
    setFilters({
      status: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const handleViewInvoice = (id) => {
    // Cette fonction pourrait ouvrir une modale ou naviguer vers une page détaillée
    navigate(`/patient-invoices/${id}`);
  };

  const handleDownloadInvoice = async (id) => {
    try {
      // Simuler le téléchargement d'un PDF
      alert(`Téléchargement de la facture ${id} en cours...`);
      
      // Dans une implémentation réelle, vous feriez un appel à l'API
      // const response = await axios.get(`/api/patient/invoices/${id}/download`, {
      //   responseType: 'blob',
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      // });
      
      // // Créer un URL pour le blob et déclencher le téléchargement
      // const url = window.URL.createObjectURL(new Blob([response.data]));
      // const link = document.createElement('a');
      // link.href = url;
      // link.setAttribute('download', `facture_${id}.pdf`);
      // document.body.appendChild(link);
      // link.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(link);
    } catch (err) {
      console.error("Erreur lors du téléchargement de la facture:", err);
      alert("Impossible de télécharger la facture. Veuillez réessayer plus tard.");
    }
  };

  // Formater un montant en devise
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Traduction des statuts
  const getStatusLabel = (status) => {
    const statuses = {
      unpaid: "À payer",
      paid: "Payée",
      cancelled: "Annulée",
      overdue: "En retard",
    };
    return statuses[status] || status;
  };

  // Classes pour les badges de statut
  const getStatusClass = (status) => {
    switch (status) {
      case "paid":
        return "status-badge confirmé";
      case "unpaid":
        return "status-badge en";
      case "overdue":
        return "status-badge annulé";
      case "cancelled":
        return "status-badge annulé";
      default:
        return "status-badge";
    }
  };

  if (loading) return (
    <div className="patient-dashboard loading-container">
      <div className="spinner"></div>
      <p>Chargement en cours...</p>
    </div>
  );

  if (error) return (
    <div className="patient-dashboard error-container">
      <div className="error-message">
        <i className="fas fa-exclamation-triangle"></i>
        <h2>Une erreur est survenue</h2>
        <p>{error}</p>
        <button className="btn-primary" onClick={() => navigate("/patient/dashboard")}>
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );

  return (
    <div className="patient-invoices-container">
      <div className="invoices-header">
        <button className="btn-secondary" onClick={() => navigate("/patient/dashboard")}>
          <i className="fas fa-arrow-left"></i> Retour au tableau de bord
        </button>
        <h1>Mes factures</h1>
      </div>

      <div className="summary-cards">
        <div className="invoice-summary-card">
          <div className="summary-title">
            <i className="fas fa-file-invoice-dollar"></i>
            <h3>Total à payer</h3>
          </div>
          <div className="summary-amount">{formatCurrency(unpaidTotal)}</div>
        </div>
        
        <div className="invoice-summary-card">
          <div className="summary-title">
            <i className="fas fa-calendar-alt"></i>
            <h3>Factures en attente</h3>
          </div>
          <div className="summary-count">
            {Array.isArray(invoices) 
              ? invoices.filter(inv => inv.status === 'unpaid').length 
              : 0}
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Tous les statuts</option>
            <option value="unpaid">À payer</option>
            <option value="paid">Payées</option>
            <option value="overdue">En retard</option>
          </select>
        </div>
        
        <div className="date-filters">
          <div className="date-filter">
            <label htmlFor="dateFrom">Du</label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
            />
          </div>
          <div className="date-filter">
            <label htmlFor="dateTo">Au</label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
            />
          </div>
        </div>
        
        <button className="btn-outline" onClick={handleResetFilters}>
          <i className="fas fa-sync-alt"></i> Réinitialiser
        </button>
      </div>

      {Array.isArray(invoices) && invoices.length > 0 ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Date</th>
                <th>Échéance</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.number}</td>
                  <td>{new Date(invoice.date).toLocaleDateString()}</td>
                  <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                  <td>{formatCurrency(invoice.total_amount)}</td>
                  <td>
                    <span className={getStatusClass(invoice.status)}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="btn-icon"
                      title="Voir les détails"
                      onClick={() => handleViewInvoice(invoice.id)}
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
          <p>Vous n'avez aucune facture correspondant à vos critères.</p>
        </div>
      )}
    </div>
  );
};

export default PatientInvoicesPage;