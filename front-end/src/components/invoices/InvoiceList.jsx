// src/components/invoices/InvoiceList.jsx - Avec téléchargement PDF
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import UnifiedLoadingSpinner from "../../components/common/UnifiedLoadingSpinner";
import ErrorDisplay from "../../components/common/ErrorDisplay";
import { generateInvoicePDF } from "../../utils/invoicePdfGenerator";

const InvoiceList = ({ onInvoiceAction }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [downloadingPdf, setDownloadingPdf] = useState(null); // Pour gérer le loading du PDF

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/invoices", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setInvoices(response.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des factures:", err);
      setError("Impossible de charger les factures. Veuillez réessayer plus tard.");
      setLoading(false);
    }
  };

  // Fonction pour télécharger une facture en PDF
  const handleDownloadPDF = async (invoiceId) => {
    try {
      setDownloadingPdf(invoiceId);
      console.log(`🔄 Téléchargement PDF pour la facture ${invoiceId}...`);
      
      // Récupérer les détails complets de la facture
      const response = await axios.get(`/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      const invoiceData = response.data.data;
      console.log("📄 Données de la facture récupérées:", invoiceData);
      
      // Informations de la clinique (vous pouvez les récupérer depuis une API ou les définir ici)
      const clinicInfo = {
        name: "Clinique Médicale Excellence",
        address: "123 Avenue de la Santé",
        city: "75001 Paris, France",
        phone: "01 23 45 67 89",
        email: "contact@clinique-excellence.fr"
      };
      
      // Générer et télécharger le PDF
      generateInvoicePDF(invoiceData, clinicInfo);
      
      console.log("✅ PDF généré et téléchargé avec succès");
      
    } catch (err) {
      console.error("❌ Erreur lors du téléchargement du PDF:", err);
      alert("Erreur lors de la génération du PDF. Veuillez réessayer.");
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredInvoices = invoices.filter(invoice => {
    // Filtre par statut
    if (statusFilter !== "all" && invoice.status !== statusFilter) {
      return false;
    }
    
    // Filtre par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (invoice.number && invoice.number.toLowerCase().includes(searchLower)) ||
        (invoice.patient && invoice.patient.name && invoice.patient.name.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getStatusBadge = (status) => {
    // Pour le cas où le statut est "pending" en anglais, mais affiché comme "En attente" en français
    if (status === "pending") {
      return (
        <span className="status-badge pending">
          En attente
        </span>
      );
    }

    // Pour les autres statuts
    switch (status) {
      case 'paid':
        return <span className="status-badge status-paid">Payée</span>;
      case 'unpaid':
        return <span className="status-badge status-unpaid">Non payée</span>;
      case 'overdue':
        return <span className="status-badge status-overdue">En retard</span>;
      case 'cancelled':
        return <span className="status-badge status-cancelled">Annulée</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  if (loading) {
    return <UnifiedLoadingSpinner size="medium" text="Chargement des factures..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="invoices-container">
      <div className="invoices-header">
        <h2>Liste des factures</h2>
        <button 
          className="btn-primary"
          onClick={() => onInvoiceAction('create')}
        >
          <i className="fas fa-plus"></i> Créer une facture
        </button>
      </div>

      <div className="filters-container">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Rechercher une facture..." 
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="status-filter">Statut:</label>
          <select 
            id="status-filter"
            value={statusFilter}
            onChange={handleStatusChange}
            className="form-control"
          >
            <option value="all">Tous les statuts</option>
            <option value="paid">Payée</option>
            <option value="unpaid">Non payée</option>
            <option value="pending">En attente</option>
            <option value="overdue">En retard</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
        
        <button className="btn-outline btn-refresh" onClick={fetchInvoices}>
          <i className="fas fa-sync-alt"></i> Actualiser
        </button>
      </div>

      <div className="table-container">
        {filteredInvoices.length > 0 ? (
          <table className="invoices-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Date</th>
                <th>Patient</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Échéance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>{invoice.number}</td>
                  <td>{formatDate(invoice.issue_date)}</td>
                  <td>{invoice.patient ? invoice.patient.name : 'N/A'}</td>
                  <td>{formatCurrency(invoice.total_amount)}</td>
                  <td>
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td>{formatDate(invoice.due_date)}</td>
                  <td className="actions">
                    <button 
                      className="btn-icon" 
                      title="Voir les détails"
                      onClick={() => onInvoiceAction('details', invoice.id)}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      className="btn-icon" 
                      title="Modifier"
                      onClick={() => onInvoiceAction('edit', invoice.id)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn-icon btn-pdf" 
                      title="Télécharger PDF"
                      onClick={() => handleDownloadPDF(invoice.id)}
                      disabled={downloadingPdf === invoice.id}
                    >
                      {downloadingPdf === invoice.id ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-file-pdf"></i>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <i className="fas fa-file-invoice-dollar"></i>
            <h3>Aucune facture trouvée</h3>
            <p>Créez une nouvelle facture ou modifiez vos filtres de recherche</p>
            <button 
              className="btn-primary"
              onClick={() => onInvoiceAction('create')}
            >
              <i className="fas fa-plus"></i> Créer une facture
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;