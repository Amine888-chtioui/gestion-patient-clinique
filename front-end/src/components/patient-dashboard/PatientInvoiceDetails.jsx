// src/components/patient-dashboard/PatientInvoiceDetails.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../axios";
import "../components/patient-dashboard/patient-invoice-details.css";

// Composants communs
import LoadingSpinner from "./common/LoadingSpinner";
import ErrorDisplay from "./common/ErrorDisplay";
import ActionMessages from "./common/ActionMessages";

const PatientInvoiceDetails = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoice, setInvoice] = useState(null);
  
  // État pour les messages d'action
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  
  const { id } = useParams();
  const navigate = useNavigate();

  // Fonction utilitaire pour les en-têtes d'autorisation
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // Récupérer les détails de la facture
  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(`/api/patient/invoices/${id}`, getAuthHeaders());
        
        setInvoice(response.data.invoice);
        
      } catch (err) {
        console.error("Erreur lors de la récupération des détails de la facture:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else if (err.response?.status === 404) {
          setError("Facture non trouvée.");
        } else {
          setError("Impossible de charger les détails de la facture. Veuillez réessayer plus tard.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [id, navigate]);

  // Télécharger la facture en PDF
  const handleDownloadInvoice = async () => {
    try {
      const response = await axios.get(`/api/patient/invoices/${id}/download`, {
        ...getAuthHeaders(),
        responseType: 'blob'
      });
      
      // Créer une URL pour le blob et télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture-${invoice.number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setActionSuccess("Facture téléchargée avec succès");
      setTimeout(() => setActionSuccess(null), 3000);
      
    } catch (err) {
      console.error("Erreur lors du téléchargement de la facture:", err);
      setActionError("Impossible de télécharger la facture. Veuillez réessayer plus tard.");
      setTimeout(() => setActionError(null), 3000);
    }
  };

  // Imprimer la facture
  const handlePrintInvoice = () => {
    window.print();
  };

  // Payer la facture
  const handlePayInvoice = () => {
    navigate(`/payment/${invoice.id}`);
  };

  // Formater un montant en euros
  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return "-";
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Formater une date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Obtenir la classe CSS en fonction du statut
  const getStatusClass = (status) => {
    switch (status) {
      case 'paid':
        return 'status-badge confirmed';
      case 'unpaid':
      case 'pending':
        return 'status-badge pending';
      case 'overdue':
        return 'status-badge cancelled';
      default:
        return 'status-badge';
    }
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'unpaid':
      case 'pending':
        return 'Non payée';
      case 'draft':
        return 'Brouillon';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  // Affichage en cas de chargement
  if (loading) {
    return <LoadingSpinner />;
  }

  // Affichage en cas d'erreur
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!invoice) {
    return <ErrorDisplay error="Facture non trouvée." />;
  }

  return (
    <div className="invoice-details-container">
      <div className="invoice-details-header">
        <h1>Facture {invoice.number}</h1>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleDownloadInvoice}>
            <i className="fas fa-download"></i> Télécharger
          </button>
          <button className="btn-outline" onClick={handlePrintInvoice}>
            <i className="fas fa-print"></i> Imprimer
          </button>
          <button className="btn-outline" onClick={() => navigate("/patient-invoices")}>
            <i className="fas fa-arrow-left"></i> Retour aux factures
          </button>
        </div>
      </div>

      <ActionMessages success={actionSuccess} error={actionError} />

      <div className="invoice-status-banner">
        <div>
          <span className={getStatusClass(invoice.status)}>
            {getStatusLabel(invoice.status)}
          </span>
        </div>
        
        {invoice.status === 'paid' && invoice.payment_date && (
          <div className="payment-info">
            Payée le {formatDate(invoice.payment_date)} 
            {invoice.payment_method && ` par ${invoice.payment_method}`}
          </div>
        )}
      </div>

      <div className="invoice-details-grid">
        <div className="invoice-info-card">
          <h3>Informations générales</h3>
          <div className="info-row">
            <span className="info-label">Numéro de facture</span>
            <span className="info-value">{invoice.number}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Date d'émission</span>
            <span className="info-value">{formatDate(invoice.date)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Date d'échéance</span>
            <span className="info-value">{formatDate(invoice.due_date)}</span>
          </div>
          {invoice.appointment && (
            <div className="info-row">
              <span className="info-label">Rendez-vous associé</span>
              <span className="info-value">{formatDate(invoice.appointment.date)}</span>
            </div>
          )}
        </div>
        
        <div className="invoice-info-card">
          <h3>Patient</h3>
          <div className="info-row">
            <span className="info-label">Nom</span>
            <span className="info-value">{invoice.patient?.name || "Non spécifié"}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email</span>
            <span className="info-value">{invoice.patient?.email || "Non spécifié"}</span>
          </div>
        </div>
      </div>

      <div className="invoice-items-section">
        <h3>Détails de la facture</h3>
        <div className="invoice-items-table-container">
          <table className="data-table">
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
                    <td>{formatAmount(item.unit_price)}</td>
                    <td>{formatAmount(item.total_price)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>Aucun élément</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="text-right">Sous-total</td>
                <td>{formatAmount(invoice.amount)}</td>
              </tr>
              <tr>
                <td colSpan="3" className="text-right">TVA ({invoice.tax_percent}%)</td>
                <td>{formatAmount(invoice.tax_amount)}</td>
              </tr>
              <tr className="total-row">
                <td colSpan="3" className="text-right">Total</td>
                <td>{formatAmount(invoice.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {invoice.notes && (
        <div className="invoice-notes">
          <h3>Notes</h3>
          <div className="notes-content">
            {invoice.notes}
          </div>
        </div>
      )}

      {(invoice.status === 'unpaid' || invoice.status === 'pending') && (
        <div className="payment-actions">
          <button className="btn-primary btn-payment" onClick={handlePayInvoice}>
            <i className="fas fa-credit-card"></i> Payer maintenant {formatAmount(invoice.total_amount)}
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientInvoiceDetails;