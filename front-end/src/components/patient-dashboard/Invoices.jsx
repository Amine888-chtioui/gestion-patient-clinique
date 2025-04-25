// src/components/patient-dashboard/Invoices.jsx
import React, { useState } from "react";

const Invoices = ({ invoices, actionLoading }) => {
  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filtrer les factures en fonction des filtres appliqués
  const filteredInvoices = invoices.filter(invoice => {
    // Filtre par statut
    if (filter !== "all" && invoice.status !== filter) return false;
    
    // Filtre par date de début
    if (dateRange.from && new Date(invoice.date) < new Date(dateRange.from)) return false;
    
    // Filtre par date de fin
    if (dateRange.to && new Date(invoice.date) > new Date(dateRange.to)) return false;
    
    // Filtre par terme de recherche
    if (searchTerm && !invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !invoice.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Gérer le changement de filtre
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  // Gérer le changement de plage de dates
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  // Gérer le changement du terme de recherche
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilter("all");
    setDateRange({ from: "", to: "" });
    setSearchTerm("");
  };
  
  // Formater un montant en devise
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  
  // Obtenir la classe CSS pour le badge de statut
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'status-badge paid';
      case 'draft':
        return 'status-badge draft';
      case 'sent':
        return 'status-badge sent';
      case 'overdue':
        return 'status-badge overdue';
      case 'cancelled':
        return 'status-badge cancelled';
      default:
        return 'status-badge';
    }
  };
  
  // Obtenir le libellé traduit pour le statut
  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'draft':
        return 'Brouillon';
      case 'sent':
        return 'Envoyée';
      case 'overdue':
        return 'En retard';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };
  
  // Calculer le montant total des factures impayées
  const calculateUnpaidTotal = () => {
    return invoices
      .filter(invoice => invoice.status !== 'paid' && invoice.status !== 'cancelled')
      .reduce((total, invoice) => total + invoice.total_amount, 0);
  };

  // Télécharger une facture
  const handleDownloadInvoice = (invoiceId) => {
    console.log(`Téléchargement de la facture ${invoiceId}`);
    // Implémentation réelle à faire ici avec appel API
    alert("Fonctionnalité de téléchargement en cours de développement");
  };

  // Payer une facture
  const handlePayInvoice = (invoiceId) => {
    console.log(`Paiement de la facture ${invoiceId}`);
    // Implémentation réelle à faire ici avec redirection vers une passerelle de paiement
    alert("Redirection vers la page de paiement...");
  };

  return (
    <div className="invoices-container">
      <div className="section-header">
        <h3>Mes factures</h3>
        <div className="unpaid-total">
          <span>Total impayé:</span>
          <span className="total-amount">{formatCurrency(calculateUnpaidTotal())}</span>
        </div>
      </div>
      
      <div className="filter-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Rechercher une facture..." 
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="filter-options">
          <div className="filter-group">
            <label htmlFor="status-filter">Statut</label>
            <select
              id="status-filter"
              value={filter}
              onChange={handleFilterChange}
              disabled={actionLoading}
            >
              <option value="all">Tous</option>
              <option value="paid">Payées</option>
              <option value="sent">Envoyées</option>
              <option value="overdue">En retard</option>
              <option value="draft">Brouillons</option>
              <option value="cancelled">Annulées</option>
            </select>
          </div>
          
          <div className="filter-group date-range">
            <div className="date-input">
              <label htmlFor="from">Du</label>
              <input
                type="date"
                id="from"
                name="from"
                value={dateRange.from}
                onChange={handleDateChange}
                disabled={actionLoading}
              />
            </div>
            
            <div className="date-input">
              <label htmlFor="to">Au</label>
              <input
                type="date"
                id="to"
                name="to"
                value={dateRange.to}
                onChange={handleDateChange}
                disabled={actionLoading}
              />
            </div>
          </div>
          
          <button 
            className="btn-outline" 
            onClick={resetFilters}
            disabled={actionLoading}
          >
            <i className="fas fa-sync-alt"></i> Réinitialiser
          </button>
        </div>
      </div>
      
      {filteredInvoices.length > 0 ? (
        <div className="invoices-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Date</th>
                <th>Description</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>{invoice.invoice_number}</td>
                  <td>{new Date(invoice.date).toLocaleDateString('fr-FR')}</td>
                  <td>{invoice.description}</td>
                  <td className="amount-column">{formatCurrency(invoice.total_amount)}</td>
                  <td>
                    <span className={getStatusBadgeClass(invoice.status)}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-icon" 
                      title="Voir les détails" 
                      onClick={() => alert(`Détails de la facture ${invoice.invoice_number}`)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    
                    <button 
                      className="btn-icon" 
                      title="Télécharger la facture" 
                      onClick={() => handleDownloadInvoice(invoice.id)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-download"></i>
                    </button>
                    
                    {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                      <button 
                        className="btn-icon success" 
                        title="Payer la facture" 
                        onClick={() => handlePayInvoice(invoice.id)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-credit-card"></i>
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
          <i className="fas fa-file-invoice-dollar"></i>
          <h3>Aucune facture trouvée</h3>
          <p>Aucune facture ne correspond à vos critères de recherche.</p>
        </div>
      )}
      
      <div className="invoices-summary">
        <div className="summary-card">
          <div className="summary-title">Factures non payées</div>
          <div className="summary-count">
            {invoices.filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue').length}
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-title">Factures payées</div>
          <div className="summary-count">
            {invoices.filter(invoice => invoice.status === 'paid').length}
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-title">En retard</div>
          <div className="summary-count">
            {invoices.filter(invoice => invoice.status === 'overdue').length}
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-title">Total</div>
          <div className="summary-amount">
            {formatCurrency(invoices.reduce((total, invoice) => total + invoice.total_amount, 0))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoices;