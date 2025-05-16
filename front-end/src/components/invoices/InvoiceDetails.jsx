// src/components/invoices/InvoiceDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../axios";
import UnifiedLoadingSpinner from "../../components/common/UnifiedLoadingSpinner";
import ErrorDisplay from "../../components/common/ErrorDisplay";

const InvoiceDetails = ({ onInvoiceAction }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);
  
  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setInvoice(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des détails de la facture:", err);
      setError("Impossible de charger les détails de la facture. Veuillez réessayer plus tard.");
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'paid':
        return 'status-paid';
      case 'unpaid':
        return 'status-unpaid';
      case 'overdue':
        return 'status-overdue';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'unpaid':
        return 'Non payée';
      case 'overdue':
        return 'En retard';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };
  
  if (loading) {
    return <UnifiedLoadingSpinner size="medium" text="Chargement des détails de la facture..." />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  if (!invoice) {
    return <ErrorDisplay error="Impossible de trouver la facture demandée." />;
  }
  
  return (
    <div className="invoice-details-container">
      <div className="invoice-details-header">
        <h2>Facture #{invoice.number}</h2>
        <div className="header-actions">
          <button className="btn-outline" onClick={() => onInvoiceAction('list')}>
            <i className="fas fa-arrow-left"></i> Retour à la liste
          </button>
          <button className="btn-outline" onClick={() => onInvoiceAction('edit', invoice.id)}>
            <i className="fas fa-edit"></i> Modifier
          </button>
          <button className="btn-primary">
            <i className="fas fa-file-pdf"></i> Télécharger PDF
          </button>
        </div>
      </div>
      
      <div className="invoice-status">
        <span className={`status-badge large ${getStatusClass(invoice.status)}`}>
          {getStatusText(invoice.status)}
        </span>
      </div>
      
      <div className="invoice-content">
        <div className="invoice-info">
          <div className="info-item">
            <span className="info-label">Date d'émission:</span>
            <span className="info-value">{formatDate(invoice.issue_date)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Date d'échéance:</span>
            <span className="info-value">{formatDate(invoice.due_date)}</span>
          </div>
          {invoice.payment_date && (
            <div className="info-item">
              <span className="info-label">Date de paiement:</span>
              <span className="info-value">{formatDate(invoice.payment_date)}</span>
            </div>
          )}
          {invoice.payment_method && (
            <div className="info-item">
              <span className="info-label">Méthode de paiement:</span>
              <span className="info-value">{invoice.payment_method}</span>
            </div>
          )}
        </div>
        
        <div className="invoice-parties">
          <div className="party-section clinic">
            <h3>Clinique</h3>
            <p>{invoice.clinic?.name || "Clinique Médicale"}</p>
            <p>{invoice.clinic?.address || "123 Rue Médicale, Ville, Pays"}</p>
            <p>Tél: {invoice.clinic?.phone || "01 23 45 67 89"}</p>
            <p>Email: {invoice.clinic?.email || "contact@clinique.com"}</p>
          </div>
          
          <div className="party-section patient">
            <h3>Patient</h3>
            <p>{invoice.patient?.name || "N/A"}</p>
            <p>{invoice.patient?.address || "Adresse non spécifiée"}</p>
            {invoice.patient?.phone && <p>Tél: {invoice.patient.phone}</p>}
            {invoice.patient?.email && <p>Email: {invoice.patient.email}</p>}
          </div>
        </div>
        
        <div className="invoice-items">
          <h3>Détails des prestations</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Prix unitaire</th>
                <th>Quantité</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td>{formatCurrency(item.unit_price)}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="invoice-summary">
          <div className="summary-row">
            <span className="summary-label">Sous-total:</span>
            <span className="summary-value">{formatCurrency(invoice.subtotal_amount)}</span>
          </div>
          {invoice.tax_amount > 0 && (
            <div className="summary-row">
              <span className="summary-label">TVA ({invoice.tax_rate}%):</span>
              <span className="summary-value">{formatCurrency(invoice.tax_amount)}</span>
            </div>
          )}
          {invoice.discount_amount > 0 && (
            <div className="summary-row">
              <span className="summary-label">Remise:</span>
              <span className="summary-value">-{formatCurrency(invoice.discount_amount)}</span>
            </div>
          )}
          <div className="summary-row total">
            <span className="summary-label">Total:</span>
            <span className="summary-value">{formatCurrency(invoice.total_amount)}</span>
          </div>
        </div>
        
        {invoice.notes && (
          <div className="invoice-notes">
            <h3>Notes</h3>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetails;