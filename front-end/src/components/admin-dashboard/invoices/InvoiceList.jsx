// src/components/admin-dashboard/invoices/InvoiceList.jsx
import React from "react";

const InvoiceList = ({
  invoices,
  statistics,
  filters,
  patients,
  onFilterChange,
  onResetFilters,
  onCreateClick,
  onViewDetails,
  onDeleteClick,
  onMarkAsPaid,
  actionLoading
}) => {
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
        return 'status-badge-success';
      case 'draft':
        return 'status-badge-secondary';
      case 'sent':
        return 'status-badge-info';
      case 'overdue':
        return 'status-badge-danger';
      case 'cancelled':
        return 'status-badge-warning';
      default:
        return 'status-badge-secondary';
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

  return (
    <div className="invoice-list-container">
      <div className="data-table-header">
        <h3>Gestion des factures</h3>
        <button 
          className="btn-primary" 
          onClick={onCreateClick}
          disabled={actionLoading}
        >
          <i className="fas fa-plus"></i> Créer une facture
        </button>
      </div>

      <div className="invoice-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-file-invoice-dollar"></i>
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(statistics.unpaid_total)}</h3>
            <p>Montant impayé</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-content">
            <h3>{statistics.overdue_count}</h3>
            <p>Factures en retard</p>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Rechercher une facture..." 
            name="search"
            value={filters.search}
            onChange={onFilterChange}
          />
        </div>
        <div className="filter-options">
          <select 
            name="status" 
            value={filters.status} 
            onChange={onFilterChange}
            className="form-control"
          >
            <option value="">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyée</option>
            <option value="paid">Payée</option>
            <option value="overdue">En retard</option>
            <option value="cancelled">Annulée</option>
          </select>
          
          <select 
            name="patient_id" 
            value={filters.patient_id} 
            onChange={onFilterChange}
            className="form-control"
          >
            <option value="">Tous les patients</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
          
          <div className="date-filter">
            <input 
              type="date" 
              name="date_from" 
              value={filters.date_from} 
              onChange={onFilterChange}
              className="form-control"
              placeholder="Date de début"
            />
            <span className="date-separator">à</span>
            <input 
              type="date" 
              name="date_to" 
              value={filters.date_to} 
              onChange={onFilterChange}
              className="form-control"
              placeholder="Date de fin"
            />
          </div>
          
          <button 
            className="btn-secondary" 
            onClick={onResetFilters}
            disabled={actionLoading}
          >
            <i className="fas fa-sync-alt"></i> Réinitialiser
          </button>
        </div>
      </div>

      <div className="data-table-container">
        {invoices.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Patient</th>
                <th>Date</th>
                <th>Échéance</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>{invoice.number}</td>
                  <td>{invoice.patient ? invoice.patient.name : 'N/A'}</td>
                  <td>{new Date(invoice.date).toLocaleDateString()}</td>
                  <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                  <td>{formatCurrency(invoice.total_amount)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-icon" 
                      title="Voir les détails"
                      onClick={() => onViewDetails(invoice)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    {invoice.status !== 'paid' && (
                      <button 
                        className="btn-icon" 
                        title="Marquer comme payée"
                        onClick={() => onMarkAsPaid(invoice.id, { payment_method: 'cash', payment_date: new Date().toISOString().split('T')[0] })}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-check-circle"></i>
                      </button>
                    )}
                    {invoice.status !== 'paid' && (
                      <button 
                        className="btn-icon danger" 
                        title="Supprimer"
                        onClick={() => onDeleteClick(invoice.id)}
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
        ) : (
          <div className="empty-state">
            <i className="fas fa-file-invoice-dollar"></i>
            <h3>Aucune facture trouvée</h3>
            <p>Créez une nouvelle facture ou modifiez vos critères de recherche</p>
            <button 
              className="btn-primary"
              onClick={onCreateClick}
              disabled={actionLoading}
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
