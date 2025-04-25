// src/components/admin-dashboard/invoices/InvoiceDetails.jsx
import React, { useState } from "react";

const InvoiceDetails = ({
  invoice,
  onBack,
  onEdit,
  onDelete,
  onMarkAsPaid,
  onSendByEmail,
  onGeneratePdf,
  actionLoading
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

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

  // Gérer la soumission du formulaire de paiement
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    onMarkAsPaid(invoice.id, { payment_method: paymentMethod, payment_date: paymentDate });
    setShowPaymentModal(false);
  };

  // Vérifier si la facture est en retard
  const isOverdue = () => {
    if (invoice.status === 'paid') return false;
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    return dueDate < today;
  };

  return (
    <div className="invoice-details-container">
      <div className="details-header">
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={onBack}
            disabled={actionLoading}
          >
            <i className="fas fa-arrow-left"></i> Retour
          </button>
        </div>
        <h2>Facture {invoice.number}</h2>
        <div className="header-actions">
          {invoice.status !== 'paid' && (
            <button 
              className="btn-success"
              onClick={() => setShowPaymentModal(true)}
              disabled={actionLoading}
            >
              <i className="fas fa-check-circle"></i> Marquer comme payée
            </button>
          )}
          <button 
            className="btn-primary"
            onClick={onSendByEmail}
            disabled={actionLoading}
          >
            <i className="fas fa-envelope"></i> Envoyer par email
          </button>
          <button 
            className="btn-outline"
            onClick={onGeneratePdf}
            disabled={actionLoading}
          >
            <i className="fas fa-file-pdf"></i> Générer PDF
          </button>
        </div>
      </div>

      <div className="invoice-status-info">
        <div className={`status-card ${isOverdue() ? 'overdue' : ''}`}>
          <div className="status-icon">
            <i className={`fas ${isOverdue() ? 'fa-exclamation-triangle' : 'fa-info-circle'}`}></i>
          </div>
          <div className="status-text">
            <span className={`status-badge ${getStatusBadgeClass(invoice.status)}`}>
              {getStatusLabel(invoice.status)}
            </span>
            {isOverdue() && <p>Cette facture est en retard de paiement!</p>}
            {invoice.status === 'paid' && invoice.payment_date && (
              <p>Payée le {new Date(invoice.payment_date).toLocaleDateString()} via {invoice.payment_method}</p>
            )}
          </div>
        </div>
      </div>

      <div className="invoice-grid">
        <div className="invoice-info-card">
          <h3>Informations</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Numéro de facture</span>
              <span className="info-value">{invoice.number}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Date de facture</span>
              <span className="info-value">{new Date(invoice.date).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Date d'échéance</span>
              <span className="info-value">{new Date(invoice.due_date).toLocaleDateString()}</span>
            </div>
            {invoice.appointment_id && (
              <div className="info-item">
                <span className="info-label">Rendez-vous associé</span>
                <span className="info-value">
                  {invoice.appointment 
                    ? `${new Date(invoice.appointment.date).toLocaleDateString()} à ${invoice.appointment.time}` 
                    : 'N/A'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="invoice-info-card">
          <h3>Patient</h3>
          {invoice.patient ? (
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Nom</span>
                <span className="info-value">{invoice.patient.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{invoice.patient.email}</span>
              </div>
              {invoice.patient.phone && (
                <div className="info-item">
                  <span className="info-label">Téléphone</span>
                  <span className="info-value">{invoice.patient.phone}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="no-data">Informations du patient non disponibles</p>
          )}
        </div>
      </div>

      <div className="invoice-items-container">
        <h3>Éléments de la facture</h3>
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
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unit_price)}</td>
                  <td>{formatCurrency(item.total_price)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-data">Aucun élément</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className="text-right">Sous-total</td>
              <td>{formatCurrency(invoice.amount)}</td>
            </tr>
            <tr>
              <td colSpan="3" className="text-right">TVA ({invoice.tax_percent}%)</td>
              <td>{formatCurrency(invoice.tax_amount)}</td>
            </tr>
            <tr className="total-row">
              <td colSpan="3" className="text-right">Total</td>
              <td>{formatCurrency(invoice.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {invoice.notes && (
        <div className="invoice-notes">
          <h3>Notes</h3>
          <p>{invoice.notes}</p>
        </div>
      )}

      <div className="details-actions">
        {invoice.status !== 'paid' && (
          <>
            <button 
              className="btn-primary"
              onClick={onEdit}
              disabled={actionLoading}
            >
              <i className="fas fa-edit"></i> Modifier
            </button>
            <button 
              className="btn-danger"
              onClick={() => onDelete(invoice.id)}
              disabled={actionLoading}
            >
              <i className="fas fa-trash-alt"></i> Supprimer
            </button>
          </>
        )}
      </div>

      {showPaymentModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Marquer comme payée</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handlePaymentSubmit}>
                <div className="form-group">
                  <label htmlFor="payment_method">Méthode de paiement</label>
                  <select
                    id="payment_method"
                    className="form-control"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="cash">Espèces</option>
                    <option value="card">Carte bancaire</option>
                    <option value="transfer">Virement bancaire</option>
                    <option value="check">Chèque</option>
                    <option value="insurance">Assurance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="payment_date">Date de paiement</label>
                  <input
                    type="date"
                    id="payment_date"
                    className="form-control"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-success" disabled={actionLoading}>
                    <i className="fas fa-check"></i> Confirmer le paiement
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowPaymentModal(false)}
                    disabled={actionLoading}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetails;