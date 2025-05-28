// src/components/invoices/InvoiceDetails.jsx - Version corrigée
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../axios";
import UnifiedLoadingSpinner from "../../components/common/UnifiedLoadingSpinner";
import ErrorDisplay from "../../components/common/ErrorDisplay";
import { generateInvoicePDF } from "../../utils/invoicePdfGenerator";

const InvoiceDetails = ({ onInvoiceAction, selectedInvoiceId }) => {
  const { id: urlId } = useParams();
  const navigate = useNavigate();
  
  // Utiliser l'ID de l'URL ou celui passé en props
  const invoiceId = urlId || selectedInvoiceId;
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  
  useEffect(() => {
    console.log('🔍 InvoiceDetails - ID reçu:', invoiceId);
    if (invoiceId) {
      fetchInvoiceDetails();
    } else {
      setError("ID de facture manquant");
      setLoading(false);
    }
  }, [invoiceId]);
  
  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      console.log(`🔄 Récupération des détails de la facture ${invoiceId}...`);
      
      const response = await axios.get(`/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      console.log('📄 Réponse API:', response.data);
      
      // Gérer différents formats de réponse
      const invoiceData = response.data.data || response.data.invoice || response.data;
      
      if (!invoiceData) {
        throw new Error('Données de facture introuvables');
      }
      
      setInvoice(invoiceData);
      setError(null);
    } catch (err) {
      console.error("❌ Erreur lors de la récupération des détails:", err);
      
      if (err.response?.status === 404) {
        setError("Facture non trouvée. Elle a peut-être été supprimée.");
      } else if (err.response?.status === 403) {
        setError("Vous n'avez pas l'autorisation d'accéder à cette facture.");
      } else {
        setError(err.response?.data?.message || "Impossible de charger les détails de la facture.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour télécharger le PDF
  const handleDownloadPDF = async () => {
    if (!invoice) {
      alert("Aucune donnée de facture disponible pour le téléchargement");
      return;
    }

    try {
      setDownloadingPdf(true);
      console.log(`🔄 Génération du PDF pour la facture ${invoice.number}...`);
      
      // Informations de la clinique
      const clinicInfo = {
        name: "Clinique Médicale Excellence",
        address: "123 Avenue de la Santé",
        city: "75001 Paris, France",
        phone: "01 23 45 67 89",
        email: "contact@clinique-excellence.fr"
      };
      
      // Générer et télécharger le PDF
      await generateInvoicePDF(invoice, clinicInfo);
      
      console.log("✅ PDF généré et téléchargé avec succès");
      showSuccessMessage("PDF téléchargé avec succès !");
      
    } catch (err) {
      console.error("❌ Erreur lors de la génération du PDF:", err);
      alert("Erreur lors de la génération du PDF: " + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Fonction pour afficher un message de succès temporaire
  const showSuccessMessage = (message) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'download-success';
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    successDiv.innerHTML = `
      <i class="fas fa-check-circle"></i>
      ${message}
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (successDiv && successDiv.parentNode) {
        successDiv.remove();
      }
    }, 3000);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifiée';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      return dateString;
    }
  };
  
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(num);
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'paid':
        return 'status-paid';
      case 'unpaid':
      case 'pending':
        return 'status-unpaid';
      case 'overdue':
        return 'status-overdue';
      case 'cancelled':
        return 'status-cancelled';
      case 'draft':
        return 'status-draft';
      default:
        return 'status-unknown';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'unpaid':
        return 'Non payée';
      case 'pending':
        return 'En attente';
      case 'overdue':
        return 'En retard';
      case 'cancelled':
        return 'Annulée';
      case 'draft':
        return 'Brouillon';
      case 'sent':
        return 'Envoyée';
      default:
        return status;
    }
  };
  
  if (loading) {
    return <UnifiedLoadingSpinner size="medium" text="Chargement des détails de la facture..." />;
  }
  
  if (error) {
    return (
      <div className="invoice-details-container">
        <div className="invoice-details-header">
          <h2>Erreur</h2>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => onInvoiceAction('list')}>
              <i className="fas fa-arrow-left"></i> Retour à la liste
            </button>
          </div>
        </div>
        <ErrorDisplay error={error} />
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="invoice-details-container">
        <ErrorDisplay error="Aucune donnée de facture disponible." />
        <button className="btn-outline" onClick={() => onInvoiceAction('list')}>
          <i className="fas fa-arrow-left"></i> Retour à la liste
        </button>
      </div>
    );
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
          <button 
            className="btn-primary"
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Génération...
              </>
            ) : (
              <>
                <i className="fas fa-file-pdf"></i> Télécharger PDF
              </>
            )}
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
            <span className="info-value">{formatDate(invoice.date || invoice.issue_date)}</span>
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
            <p>Clinique Médicale Excellence</p>
            <p>123 Avenue de la Santé</p>
            <p>75001 Paris, France</p>
            <p>Tél: 01 23 45 67 89</p>
            <p>Email: contact@clinique-excellence.fr</p>
          </div>
          
          <div className="party-section patient">
            <h3>Patient</h3>
            <p>{invoice.patient?.name || "N/A"}</p>
            {invoice.patient?.email && <p>Email: {invoice.patient.email}</p>}
            {invoice.patient?.phone && <p>Tél: {invoice.patient.phone}</p>}
            {invoice.patient?.address && <p>{invoice.patient.address}</p>}
          </div>
        </div>
        
        <div className="invoice-items">
          <h3>Détails des prestations</h3>
          <table className="items-table">
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
                    <td>{formatCurrency(item.total_price || (parseFloat(item.quantity) * parseFloat(item.unit_price)))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>Consultation médicale</td>
                  <td>1</td>
                  <td>{formatCurrency(invoice.amount || invoice.total_amount || 0)}</td>
                  <td>{formatCurrency(invoice.amount || invoice.total_amount || 0)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="invoice-summary">
          <div className="summary-row">
            <span className="summary-label">Sous-total:</span>
            <span className="summary-value">
              {formatCurrency(invoice.subtotal_amount || invoice.amount || invoice.total_amount || 0)}
            </span>
          </div>
          {(invoice.tax_amount > 0 || invoice.tax_percent > 0) && (
            <div className="summary-row">
              <span className="summary-label">TVA ({invoice.tax_percent || invoice.tax_rate || 20}%):</span>
              <span className="summary-value">
                {formatCurrency(invoice.tax_amount || 0)}
              </span>
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
            <span className="summary-value">
              {formatCurrency(invoice.total_amount || invoice.amount || 0)}
            </span>
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