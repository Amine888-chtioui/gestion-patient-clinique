// src/components/doctor-dashboard/DoctorInvoices.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";

const DoctorInvoices = ({ 
  patients, 
  selectedPatient,
  handlePatientSelect, 
  actionLoading 
}) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);

  // Fetch all invoices when component mounts or when selectedPatient changes
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Different API endpoint based on whether we're viewing all invoices or a specific patient's invoices
        const endpoint = selectedPatient 
          ? `/api/doctor/patients/${selectedPatient.id}/invoices` 
          : `/api/doctor/invoices`;
        
        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        
        setInvoices(response.data.invoices || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError("Impossible de charger les factures. Veuillez réessayer plus tard.");
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [selectedPatient]);

  // Filter invoices based on criteria
  const filteredInvoices = invoices.filter(invoice => {
    // Filter by status
    const statusMatch = filterStatus === "all" || invoice.status === filterStatus;
    
    // Filter by search term (patient name or invoice number)
    const searchMatch = !searchTerm || 
      (invoice.patient_name && invoice.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (invoice.number && invoice.number.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by date range
    const dateFromMatch = !dateRange.from || new Date(invoice.date) >= new Date(dateRange.from);
    const dateToMatch = !dateRange.to || new Date(invoice.date) <= new Date(dateRange.to);
    
    return statusMatch && searchMatch && dateFromMatch && dateToMatch;
  });

  // Handle viewing invoice details
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetails(true);
  };

  // Handle closing invoice details
  const handleCloseDetails = () => {
    setShowInvoiceDetails(false);
    setSelectedInvoice(null);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilterStatus("all");
    setSearchTerm("");
    setDateRange({ from: "", to: "" });
  };

  // If viewing a specific patient's invoices, show a different layout
  if (selectedPatient) {
    return (
      <div className="doctor-invoices-container">
        <div className="section-header">
          <div className="header-left">
            <button 
              className="btn-outline btn-back"
              onClick={() => handlePatientSelect(null)}
              disabled={actionLoading}
            >
              <i className="fas fa-arrow-left"></i> Retour
            </button>
            <h2>Factures de {selectedPatient.name}</h2>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Chargement des factures...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <i className="fas fa-exclamation-circle"></i>
            <h3>Erreur</h3>
            <p>{error}</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-file-invoice-dollar"></i>
            <h3>Aucune facture</h3>
            <p>Ce patient n'a pas encore de factures</p>
          </div>
        ) : (
          <>
            <div className="filter-bar">
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Rechercher une facture..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-options">
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="paid">Payées</option>
                  <option value="unpaid">Non payées</option>
                  <option value="overdue">En retard</option>
                </select>
                <button 
                  className="btn-outline"
                  onClick={resetFilters}
                  disabled={actionLoading}
                >
                  <i className="fas fa-sync-alt"></i> Réinitialiser
                </button>
              </div>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="empty-state small">
                <i className="fas fa-filter"></i>
                <h3>Aucun résultat</h3>
                <p>Aucune facture ne correspond à vos critères de recherche</p>
              </div>
            ) : (
              <div className="invoices-list">
                {filteredInvoices.map(invoice => (
                  <div key={invoice.id} className="invoice-card">
                    <div className="invoice-header">
                      <div className="invoice-number">
                        <h4>{invoice.number}</h4>
                        <span className={`status-badge ${invoice.status}`}>
                          {invoice.status === 'paid' ? 'Payée' : 
                           invoice.status === 'overdue' ? 'En retard' : 'Non payée'}
                        </span>
                      </div>
                      <div className="invoice-dates">
                        <div className="date-item">
                          <span className="date-label">Date:</span>
                          <span className="date-value">{invoice.date}</span>
                        </div>
                        <div className="date-item">
                          <span className="date-label">Échéance:</span>
                          <span className="date-value">{invoice.due_date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="invoice-body">
                      <div className="amount-section">
                        <div className="amount-label">Montant total:</div>
                        <div className="amount-value">{formatCurrency(invoice.total_amount)}</div>
                      </div>
                      {invoice.status === 'paid' && (
                        <div className="payment-info">
                          <div className="payment-method">
                            <i className="fas fa-credit-card"></i> Payée par {invoice.payment_method || 'N/A'}
                          </div>
                          <div className="payment-date">
                            <i className="fas fa-calendar-check"></i> le {invoice.payment_date || 'N/A'}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="invoice-footer">
                      <button 
                        className="btn-primary"
                        onClick={() => handleViewInvoice(invoice)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-eye"></i> Voir détails
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {showInvoiceDetails && selectedInvoice && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>Détails de la facture {selectedInvoice.number}</h3>
                <button 
                  className="btn-icon"
                  onClick={handleCloseDetails}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="invoice-details">
                  <div className="invoice-info-grid">
                    <div className="info-group">
                      <h4>Informations générales</h4>
                      <div className="info-row">
                        <div className="info-label">Numéro:</div>
                        <div className="info-value">{selectedInvoice.number}</div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Statut:</div>
                        <div className="info-value">
                          <span className={`status-badge ${selectedInvoice.status}`}>
                            {selectedInvoice.status === 'paid' ? 'Payée' : 
                             selectedInvoice.status === 'overdue' ? 'En retard' : 'Non payée'}
                          </span>
                        </div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Date d'émission:</div>
                        <div className="info-value">{selectedInvoice.date}</div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Date d'échéance:</div>
                        <div className="info-value">{selectedInvoice.due_date}</div>
                      </div>
                    </div>
                    <div className="info-group">
                      <h4>Informations de paiement</h4>
                      {selectedInvoice.status === 'paid' ? (
                        <>
                          <div className="info-row">
                            <div className="info-label">Date de paiement:</div>
                            <div className="info-value">{selectedInvoice.payment_date || 'N/A'}</div>
                          </div>
                          <div className="info-row">
                            <div className="info-label">Méthode de paiement:</div>
                            <div className="info-value">{selectedInvoice.payment_method || 'N/A'}</div>
                          </div>
                        </>
                      ) : (
                        <div className="info-row">
                          <div className="info-value">Cette facture n'a pas encore été payée.</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="invoice-items-section">
                    <h4>Éléments facturés</h4>
                    <table className="invoice-items-table">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Quantité</th>
                          <th>Prix unitaire</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items && selectedInvoice.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.unit_price)}</td>
                            <td>{formatCurrency(item.total_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" className="text-right">Sous-total:</td>
                          <td>{formatCurrency(selectedInvoice.amount)}</td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-right">TVA ({selectedInvoice.tax_percent}%):</td>
                          <td>{formatCurrency(selectedInvoice.tax_amount)}</td>
                        </tr>
                        <tr className="total-row">
                          <td colSpan="3" className="text-right">Total:</td>
                          <td>{formatCurrency(selectedInvoice.total_amount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {selectedInvoice.notes && (
                    <div className="invoice-notes">
                      <h4>Notes</h4>
                      <p>{selectedInvoice.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn-secondary"
                  onClick={handleCloseDetails}
                >
                  Fermer
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => window.print()} // Simple solution for printing
                  disabled={actionLoading}
                >
                  <i className="fas fa-print"></i> Imprimer facture
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main view when no patient is selected
  return (
    <div className="doctor-invoices-container">
      <div className="section-header">
        <h2>Gestion des factures</h2>
      </div>

      {loading ? (
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Chargement des factures...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <i className="fas fa-exclamation-circle"></i>
          <h3>Erreur</h3>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="filter-bar">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Rechercher par patient ou numéro de facture..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-options">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tous les statuts</option>
                <option value="paid">Payées</option>
                <option value="unpaid">Non payées</option>
                <option value="overdue">En retard</option>
              </select>
              <div className="date-filters">
                <input 
                  type="date" 
                  placeholder="Date début" 
                  value={dateRange.from}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                />
                <input 
                  type="date" 
                  placeholder="Date fin" 
                  value={dateRange.to}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                />
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

          {/* Dashboard summary boxes */}
          <div className="invoices-summary">
            <div className="summary-card">
              <div className="summary-icon">
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
              <div className="summary-info">
                <h3>{invoices.length}</h3>
                <p>Total factures</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon paid">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="summary-info">
                <h3>{invoices.filter(inv => inv.status === 'paid').length}</h3>
                <p>Factures payées</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon unpaid">
                <i className="fas fa-clock"></i>
              </div>
              <div className="summary-info">
                <h3>{invoices.filter(inv => inv.status === 'unpaid').length}</h3>
                <p>Factures en attente</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon overdue">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <div className="summary-info">
                <h3>{invoices.filter(inv => inv.status === 'overdue').length}</h3>
                <p>Factures en retard</p>
              </div>
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-file-invoice-dollar"></i>
              <h3>Aucune facture trouvée</h3>
              <p>Aucune facture ne correspond à vos critères de recherche</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table invoices-table">
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
                  {filteredInvoices.map(invoice => (
                    <tr key={invoice.id}>
                      <td>{invoice.number}</td>
                      <td>{invoice.patient_name}</td>
                      <td>{invoice.date}</td>
                      <td>{invoice.due_date}</td>
                      <td>{formatCurrency(invoice.total_amount)}</td>
                      <td>
                        <span className={`status-badge ${invoice.status}`}>
                          {invoice.status === 'paid' ? 'Payée' : 
                           invoice.status === 'overdue' ? 'En retard' : 'Non payée'}
                        </span>
                      </td>
                      <td className="actions">
                        <button 
                          className="btn-icon" 
                          title="Voir les détails"
                          onClick={() => handleViewInvoice(invoice)}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        {/* "View Patient" button has been removed here */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showInvoiceDetails && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Détails de la facture {selectedInvoice.number}</h3>
              <button 
                className="btn-icon"
                onClick={handleCloseDetails}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="invoice-details">
                <div className="invoice-info-grid">
                  <div className="info-group">
                    <h4>Informations générales</h4>
                    <div className="info-row">
                      <div className="info-label">Numéro:</div>
                      <div className="info-value">{selectedInvoice.number}</div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Patient:</div>
                      <div className="info-value">{selectedInvoice.patient_name}</div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Statut:</div>
                      <div className="info-value">
                        <span className={`status-badge ${selectedInvoice.status}`}>
                          {selectedInvoice.status === 'paid' ? 'Payée' : 
                           selectedInvoice.status === 'overdue' ? 'En retard' : 'Non payée'}
                        </span>
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Date d'émission:</div>
                      <div className="info-value">{selectedInvoice.date}</div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Date d'échéance:</div>
                      <div className="info-value">{selectedInvoice.due_date}</div>
                    </div>
                  </div>
                  <div className="info-group">
                    <h4>Informations de paiement</h4>
                    {selectedInvoice.status === 'paid' ? (
                      <>
                        <div className="info-row">
                          <div className="info-label">Date de paiement:</div>
                          <div className="info-value">{selectedInvoice.payment_date || 'N/A'}</div>
                        </div>
                        <div className="info-row">
                          <div className="info-label">Méthode de paiement:</div>
                          <div className="info-value">{selectedInvoice.payment_method || 'N/A'}</div>
                        </div>
                      </>
                    ) : (
                      <div className="info-row">
                        <div className="info-value">Cette facture n'a pas encore été payée.</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="invoice-items-section">
                  <h4>Éléments facturés</h4>
                  <table className="invoice-items-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Quantité</th>
                        <th>Prix unitaire</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items && selectedInvoice.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.description}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.unit_price)}</td>
                          <td>{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-right">Sous-total:</td>
                        <td>{formatCurrency(selectedInvoice.amount)}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="text-right">TVA ({selectedInvoice.tax_percent}%):</td>
                        <td>{formatCurrency(selectedInvoice.tax_amount)}</td>
                      </tr>
                      <tr className="total-row">
                        <td colSpan="3" className="text-right">Total:</td>
                        <td>{formatCurrency(selectedInvoice.total_amount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedInvoice.notes && (
                  <div className="invoice-notes">
                    <h4>Notes</h4>
                    <p>{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={handleCloseDetails}
              >
                Fermer
              </button>
              {/* "View Patient" button has been removed here as well */}
              <button 
                className="btn-primary"
                onClick={() => window.print()} // Simple solution for printing
                disabled={actionLoading}
              >
                <i className="fas fa-print"></i> Imprimer facture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorInvoices;