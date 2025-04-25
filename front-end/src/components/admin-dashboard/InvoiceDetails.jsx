// src/components/admin-dashboard/invoice/InvoiceDetails.jsx
import React, { useState } from "react";

const InvoiceDetails = ({ 
  invoice, 
  onEdit,
  onBack,
  onDelete,
  onFinalize,
  onSend,
  onExport,
  actionLoading 
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: invoice.total_amount,
    payment_method: invoice.payment_method || 'card',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_id: '',
    notes: ''
  });
  
  // Ouvrir la fenêtre modale de paiement
  const openPaymentModal = () => {
    setShowPaymentModal(true);
  };
  
  // Fermer la fenêtre modale de paiement
  const closePaymentModal = () => {
    setShowPaymentModal(false);
  };
  
  // Gérer les changements dans le formulaire de paiement
  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({
      ...paymentData,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    });
  };
  
  // Soumettre le paiement
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    
    // Mettre à jour le statut de la facture
    onFinalize(invoice.id, {
      status: 'paid',
      payment_details: paymentData
    });
    
    // Fermer la fenêtre modale
    closePaymentModal();
  };
  
  // Générer le PDF de la facture
  const handleExportPDF = () => {
    onExport(invoice.id, 'pdf');
  };
  
  // Envoyer la facture par e-mail
  const handleSendEmail = () => {
    onSend(invoice.id);
  };
  
  // Calculer le montant d'un élément
  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.unit_price;
    const discount = subtotal * (item.discount / 100);
    return subtotal - discount;
  };
  
  // Formater la date
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };
  
  // Obtenir le libellé du statut
  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'pending':
        return 'En attente';
      case 'paid':
        return 'Payée';
      case 'overdue':
        return 'En retard';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };
  
  // Obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return '#6c757d';
      case 'pending':
        return '#ffc107';
      case 'paid':
        return '#28a745';
      case 'overdue':
        return '#dc3545';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };
  
  return (
    <div className="invoice-details">
      <div className="details-header">
        <button 
          className="btn-secondary"
          onClick={onBack}
          disabled={actionLoading}
        >
          <i className="fas fa-arrow-left"></i> Retour
        </button>
        
        <div className="header-actions">
          {invoice.status === 'pending' && (
            <button 
              className="btn-success"
              onClick={openPaymentModal}
              disabled={actionLoading}
            >
              <i className="fas fa-check-circle"></i> Marquer comme payée
            </button>
          )}
          
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <button 
              className="btn-primary"
              onClick={() => onEdit(invoice)}
              disabled={actionLoading}
            >
              <i className="fas fa-edit"></i> Modifier
            </button>
          )}
          
          <button 
            className="btn-outline"
            onClick={handleExportPDF}
            disabled={actionLoading}
          >
            <i className="fas fa-file-pdf"></i> Exporter en PDF
          </button>
          
          {invoice.status === 'draft' && (
            <button 
              className="btn-primary"
              onClick={() => onFinalize(invoice.id, { status: 'pending' })}
              disabled={actionLoading}
            >
              <i className="fas fa-paper-plane"></i> Finaliser et envoyer
            </button>
          )}
          
          {invoice.status === 'pending' && (
            <button 
              className="btn-outline"
              onClick={handleSendEmail}
              disabled={actionLoading}
            >
              <i className="fas fa-envelope"></i> Envoyer par e-mail
            </button>
          )}
          
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <button 
              className="btn-danger"
              onClick={() => onDelete(invoice.id)}
              disabled={actionLoading}
            >
              <i className="fas fa-trash-alt"></i> Supprimer
            </button>
          )}
        </div>
      </div>
      
      <div className="invoice-preview">
        <div className="preview-header">
          <div className="company-info">
            <img src="/images/logo.png" alt="Logo Clinique" className="company-logo" />
            <div className="company-details">
              <h2>Clinique Médicale</h2>
              <p>246 Rte de l'Oasis, Casablanca 20250</p>
              <p>Téléphone: +212 (0) 522 23 14 14</p>
              <p>Email: contact@clinique-medicale.ma</p>
            </div>
          </div>
          
          <div className="invoice-info">
            <h1>FACTURE</h1>
            <div className="invoice-meta">
              <div className="meta-item">
                <span className="meta-label">N° Facture:</span>
                <span className="meta-value">{invoice.invoice_number}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Date:</span>
                <span className="meta-value">{formatDate(invoice.date)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Échéance:</span>
                <span className="meta-value">{formatDate(invoice.due_date)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Statut:</span>
                <span className="meta-value">
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(invoice.status) + '20', color: getStatusColor(invoice.status) }}
                  >
                    {getStatusLabel(invoice.status)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="invoice-parties">
          <div className="party-block">
            <h3>Facturé à</h3>
            <div className="party-details">
              <p className="party-name">{invoice.patient_name}</p>
              <p>{invoice.patient_address || 'Adresse non spécifiée'}</p>
              <p>Email: {invoice.patient_email || 'Email non spécifié'}</p>
              <p>Téléphone: {invoice.patient_phone || 'Téléphone non spécifié'}</p>
            </div>
          </div>
          
          {invoice.doctor_name && (
            <div className="party-block">
              <h3>Médecin traitant</h3>
              <div className="party-details">
                <p className="party-name">Dr. {invoice.doctor_name}</p>
                <p>{invoice.doctor_speciality || 'Spécialité non spécifiée'}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="invoice-items-table">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Remise</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit_price.toFixed(2)} €</td>
                  <td>{item.discount > 0 ? `${item.discount}%` : '-'}</td>
                  <td>{calculateItemTotal(item).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" className="text-right">Sous-total</td>
                <td>{invoice.sub_total.toFixed(2)} €</td>
              </tr>
              <tr>
                <td colSpan="4" className="text-right">TVA (20%)</td>
                <td>{invoice.tax_amount.toFixed(2)} €</td>
              </tr>
              <tr className="total-row">
                <td colSpan="4" className="text-right">Total</td>
                <td>{invoice.total_amount.toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div className="invoice-footer">
          <div className="terms-section">
            <h3>Conditions de paiement</h3>
            <p>{invoice.terms}</p>
          </div>
          
          {invoice.notes && (
            <div className="notes-section">
              <h3>Notes</h3>
              <p>{invoice.notes}</p>
            </div>
          )}
          
          <div className="payment-info">
            <h3>Informations de paiement</h3>
            <p>Méthode de paiement préférée: {getPaymentMethodLabel(invoice.payment_method)}</p>
            <p>IBAN: FR76 3000 4000 0100 0191 9489 183</p>
            <p>BIC: BNPAFRPP</p>
          </div>
          
          {invoice.status === 'paid' && invoice.payment_details && (
            <div className="payment-details">
              <h3>Détails du paiement</h3>
              <p>Date de paiement: {formatDate(invoice.payment_details.payment_date)}</p>
              <p>Méthode: {getPaymentMethodLabel(invoice.payment_details.payment_method)}</p>
              {invoice.payment_details.transaction_id && (
                <p>Transaction ID: {invoice.payment_details.transaction_id}</p>
              )}
              {invoice.payment_details.notes && (
                <p>Notes: {invoice.payment_details.notes}</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de paiement */}
      {showPaymentModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Enregistrer un paiement</h3>
              <button 
                type="button" 
                className="modal-close"
                onClick={closePaymentModal}
                disabled={actionLoading}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="payment-form">
              <div className="form-group">
                <label htmlFor="amount">Montant reçu (€)*</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={paymentData.amount}
                  onChange={handlePaymentChange}
                  min="0"
                  step="0.01"
                  required
                  disabled={actionLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="payment_method">Méthode de paiement*</label>
                <select
                  id="payment_method"
                  name="payment_method"
                  value={paymentData.payment_method}
                  onChange={handlePaymentChange}
                  required
                  disabled={actionLoading}
                >
                  <option value="card">Carte bancaire</option>
                  <option value="transfer">Virement bancaire</option>
                  <option value="check">Chèque</option>
                  <option value="cash">Espèces</option>
                  <option value="insurance">Assurance</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="payment_date">Date de paiement*</label>
                <input
                  type="date"
                  id="payment_date"
                  name="payment_date"
                  value={paymentData.payment_date}
                  onChange={handlePaymentChange}
                  required
                  disabled={actionLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="transaction_id">ID de transaction</label>
                <input
                  type="text"
                  id="transaction_id"
                  name="transaction_id"
                  value={paymentData.transaction_id}
                  onChange={handlePaymentChange}
                  placeholder="Numéro de référence, ID de transaction, etc."
                  disabled={actionLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={paymentData.notes}
                  onChange={handlePaymentChange}
                  rows="3"
                  placeholder="Notes additionnelles concernant ce paiement"
                  disabled={actionLoading}
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-success"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Traitement en cours...</>
                  ) : (
                    <><i className="fas fa-check-circle"></i> Confirmer le paiement</>
                  )}
                </button>
                
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={closePaymentModal}
                  disabled={actionLoading}
                >
                  <i className="fas fa-times"></i> Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Obtenir le libellé de la méthode de paiement
function getPaymentMethodLabel(method) {
  switch (method) {
    case 'card':
      return 'Carte bancaire';
    case 'transfer':
      return 'Virement bancaire';
    case 'check':
      return 'Chèque';
    case 'cash':
      return 'Espèces';
    case 'insurance':
      return 'Assurance';
    default:
      return method;
  }
}

export default InvoiceDetails;