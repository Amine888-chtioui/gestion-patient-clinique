// src/components/invoices/InvoiceList.jsx - Version améliorée avec hook PDF
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

  // Fonction pour télécharger une facture en PDF - Maintenant avec le hook
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
    if (isSelected) {
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
        <div className="header-actions">
          {!showBulkActions && (
            <>
              <button 
                className="btn-outline"
                onClick={toggleBulkActions}
                disabled={invoices.length === 0}
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
              <button 
                className="btn-primary"
                onClick={handleDownloadSelectedPDFs}
                disabled={selectedInvoices.length === 0 || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Génération...
                  </>
                ) : (
                  <>
                    <i className="fas fa-file-pdf"></i> Télécharger PDFs
                  </>
                )}
              </button>
              <button 
                className="btn-secondary"
                onClick={toggleBulkActions}
              >
                <i className="fas fa-times"></i> Annuler
              </button>
            </>
          )}
        </div>
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

      {/* Actions en lot - Section de sélection */}
      {showBulkActions && (
        <div className="bulk-actions-bar">
          <div className="bulk-select-all">
            <label className="checkbox-container">
              <input 
                type="checkbox"
                checked={filteredInvoices.length > 0 && selectedInvoices.length === filteredInvoices.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <span className="checkmark"></span>
              Sélectionner tout ({filteredInvoices.length})
            </label>
          </div>
          
          {selectedInvoices.length > 0 && (
            <div className="bulk-actions">
              <button 
                className="btn-outline btn-sm"
                onClick={() => setSelectedInvoices([])}
              >
                <i className="fas fa-times"></i> Désélectionner tout
              </button>
            </div>
          )}
        </div>
      )}

      <div className="table-container">
        {filteredInvoices.length > 0 ? (
          <table className="invoices-table">
            <thead>
              <tr>
                {showBulkActions && <th width="40px">
                  <input 
                    type="checkbox"
                    checked={filteredInvoices.length > 0 && selectedInvoices.length === filteredInvoices.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>}
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
                <tr key={invoice.id} className={selectedInvoices.includes(invoice.id) ? 'selected' : ''}>
                  {showBulkActions && (
                    <td>
                      <input 
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={(e) => handleInvoiceSelection(invoice.id, e.target.checked)}
                      />
                    </td>
                  )}
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
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
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
      `}</style>
    </div>
  );
};

export default InvoiceList;