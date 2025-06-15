// src/components/invoices/InvoiceList.jsx - Version corrigée
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import UnifiedLoadingSpinner from "../../components/common/UnifiedLoadingSpinner";
import ErrorDisplay from "../../components/common/ErrorDisplay";
import { useInvoicePDF } from "../../hooks/useInvoicePDF";

const InvoiceList = ({ onInvoiceAction }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Utilisation du hook PDF
  const { 
    isGenerating, 
    generatePDFFromId, 
    generateBatchPDFs,
    showSuccessMessage 
  } = useInvoicePDF();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/invoices", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      console.log("Données reçues:", response.data);
      
      // S'assurer que nous avons un tableau
      let invoicesData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          invoicesData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          invoicesData = response.data.data;
        } else if (response.data.invoices && Array.isArray(response.data.invoices)) {
          invoicesData = response.data.invoices;
        }
      }
      
      console.log("Factures extraites:", invoicesData);
      setInvoices(invoicesData);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des factures:", err);
      setError("Impossible de charger les factures. Veuillez réessayer plus tard.");
      setInvoices([]); // S'assurer qu'on a un tableau vide en cas d'erreur
      setLoading(false);
    }
  };

  // Fonction pour télécharger une facture en PDF
  const handleDownloadPDF = async (invoiceId) => {
    await generatePDFFromId(invoiceId);
  };

  // Fonction pour télécharger plusieurs factures en PDF
  const handleDownloadSelectedPDFs = async () => {
    if (selectedInvoices.length === 0) {
      alert("Veuillez sélectionner au moins une facture");
      return;
    }

    await generateBatchPDFs(selectedInvoices);
    setSelectedInvoices([]);
    setShowBulkActions(false);
  };

  // Gestion de la sélection multiple
  const handleInvoiceSelection = (invoiceId, isSelected) => {
    if (isSelected) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  // Sélectionner/désélectionner toutes les factures visibles
  const handleSelectAll = (isSelected) => {
    if (isSelected && Array.isArray(filteredInvoices)) {
      const visibleInvoiceIds = filteredInvoices.map(invoice => invoice.id);
      setSelectedInvoices(visibleInvoiceIds);
    } else {
      setSelectedInvoices([]);
    }
  };

  // Basculer l'affichage des actions en lot
  const toggleBulkActions = () => {
    setShowBulkActions(!showBulkActions);
    if (showBulkActions) {
      setSelectedInvoices([]);
    }
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredInvoices = Array.isArray(invoices) ? invoices.filter(invoice => {
    // Filtre par statut
    if (statusFilter !== "all" && invoice.status !== statusFilter) {
      return false;
    }
    
    // Filtre par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (invoice.number && invoice.number.toLowerCase().includes(searchLower)) ||
        (invoice.patient && invoice.patient.name && invoice.patient.name.toLowerCase().includes(searchLower)) ||
        (invoice.patient_name && invoice.patient_name.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  }) : [];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(numAmount);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="status-badge status-paid">Payée</span>;
      case 'unpaid':
        return <span className="status-badge status-unpaid">Non payée</span>;
      case 'pending':
        return <span className="status-badge pending">En attente</span>;
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
        <div className="header-actions">
          {!showBulkActions && (
            <>
              <button 
                className="btn-outline"
                onClick={toggleBulkActions}
                disabled={!Array.isArray(invoices) || invoices.length === 0}
              >
                <i className="fas fa-tasks"></i> Actions en lot
              </button>
              <button 
                className="btn-primary"
                onClick={() => onInvoiceAction('create')}
              >
                <i className="fas fa-plus"></i> Créer une facture
              </button>
            </>
          )}
          
          {showBulkActions && (
            <>
              <span className="selected-count">
                {selectedInvoices.length} facture{selectedInvoices.length > 1 ? 's' : ''} sélectionnée{selectedInvoices.length > 1 ? 's' : ''}
              </span>
              <div className="bulk-actions">
                <button 
                  className="btn-sm btn-secondary"
                  onClick={handleDownloadSelectedPDFs}
                  disabled={selectedInvoices.length === 0 || isGenerating}
                >
                  {isGenerating ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-download"></i>
                  )}
                  Télécharger PDF
                </button>
                <button 
                  className="btn-sm btn-outline"
                  onClick={toggleBulkActions}
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Barre de filtres et recherche */}
      <div className="filters-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher par numéro ou patient..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="status-filter">
          <select value={statusFilter} onChange={handleStatusChange}>
            <option value="all">Tous les statuts</option>
            <option value="paid">Payées</option>
            <option value="unpaid">Non payées</option>
            <option value="pending">En attente</option>
            <option value="overdue">En retard</option>
            <option value="cancelled">Annulées</option>
          </select>
        </div>
      </div>

      {/* Actions en lot */}
      {showBulkActions && (
        <div className="bulk-actions-bar">
          <div className="bulk-select-all">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={Array.isArray(filteredInvoices) && filteredInvoices.length > 0 && selectedInvoices.length === filteredInvoices.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              Sélectionner tout
            </label>
          </div>
        </div>
      )}

      {/* Messages de succès - Supprimé pour éviter la barre verte */}

      {/* Tableau des factures */}
      <div className="invoices-table-container">
        {Array.isArray(filteredInvoices) && filteredInvoices.length > 0 ? (
          <table className="invoices-table">
            <thead>
              <tr>
                {showBulkActions && <th>Sélection</th>}
                <th>Numéro</th>
                <th>Patient</th>
                <th>Date d'émission</th>
                <th>Date d'échéance</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr 
                  key={invoice.id}
                  className={selectedInvoices.includes(invoice.id) ? 'selected' : ''}
                >
                  {showBulkActions && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={(e) => handleInvoiceSelection(invoice.id, e.target.checked)}
                      />
                    </td>
                  )}
                  <td>{invoice.number || `INV-${invoice.id.toString().padStart(4, '0')}`}</td>
                  <td>{invoice.patient?.name || invoice.patient_name || 'Patient non spécifié'}</td>
                  <td>{formatDate(invoice.issue_date || invoice.created_at)}</td>
                  <td>{formatDate(invoice.due_date)}</td>
                  <td>{formatCurrency(invoice.total_amount || invoice.amount || 0)}</td>
                  <td>{getStatusBadge(invoice.status)}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-sm btn-outline"
                      onClick={() => onInvoiceAction('edit', invoice)}
                      title="Modifier"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn-sm btn-outline btn-pdf"
                      onClick={() => handleDownloadPDF(invoice.id)}
                      disabled={isGenerating}
                      title="Télécharger PDF"
                    >
                      {isGenerating ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-download"></i>
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
            <p>
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucune facture ne correspond à vos critères de recherche'
                : 'Créez une nouvelle facture pour commencer'
              }
            </p>
            <button 
              className="btn-primary"
              onClick={() => onInvoiceAction('create')}
            >
              <i className="fas fa-plus"></i> Créer une facture
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .bulk-actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .bulk-select-all {
          display: flex;
          align-items: center;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-container input[type="checkbox"] {
          margin-right: 8px;
        }

        .selected-count {
          font-weight: 500;
          color: #6c757d;
          margin-right: 12px;
        }

        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .bulk-actions {
          display: flex;
          gap: 8px;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 0.875rem;
        }

        .invoices-table tr.selected {
          background-color: rgba(106, 27, 154, 0.05);
        }

        .invoices-table tr.selected:hover {
          background-color: rgba(106, 27, 154, 0.1);
        }

        .btn-pdf {
          color: #dc3545;
        }

        .btn-pdf:hover {
          background-color: rgba(220, 53, 69, 0.1);
        }

        .success-message {
          background-color: #d4edda;
          color: #155724;
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filters-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          align-items: center;
        }

        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-box i {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }

        .search-box input {
          width: 100%;
          padding: 10px 40px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          font-size: 14px;
        }

        .status-filter select {
          padding: 10px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          font-size: 14px;
          background-color: white;
        }

        .invoices-table-container {
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .invoices-table {
          width: 100%;
          border-collapse: collapse;
        }

        .invoices-table th {
          background-color: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 1px solid #dee2e6;
        }

        .invoices-table td {
          padding: 12px;
          border-bottom: 1px solid #f1f3f4;
        }

        .invoices-table tr:hover {
          background-color: #f8f9fa;
        }

        .actions-cell {
          display: flex;
          gap: 8px;
        }

        .btn-pdf {
          color: #dc3545 !important;
          border: 1px solid #dc3545 !important;
          background-color: transparent !important;
        }

        .btn-pdf:hover {
          background-color: #dc3545 !important;
          color: white !important;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #6c757d;
        }

        .empty-state i {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: #dee2e6;
        }

        .empty-state h3 {
          margin-bottom: 0.5rem;
          color: #343a40;
        }

        .empty-state p {
          margin-bottom: 1.5rem;
        }
      `}</style>
    </div>
  );
};

export default InvoiceList;