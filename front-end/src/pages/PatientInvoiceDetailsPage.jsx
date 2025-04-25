// src/pages/PatientInvoiceDetailsPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../axios";
import "../components/patient-dashboard/patient-invoice-details.css";
import "../components/patient-dashboard/PatientDashboard.css";

const PatientInvoiceDetailsPage = () => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      try {
        const response = await axios.get(`/api/patient/invoices/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        console.log("Réponse du serveur (détails):", response.data);
        setInvoice(response.data.invoice);
      } catch (apiError) {
        console.error("Erreur API, utilisation de données fictives:", apiError);
        
        // Utiliser des données fictives pour test/développement
        const mockInvoice = {
          id: parseInt(id),
          number: `INV-2023${id.padStart(3, '0')}`,
          date: "2023-05-10",
          due_date: "2023-06-10",
          status: "unpaid",
          total_amount: 120.50,
          amount: 100.42,
          tax_percent: 20,
          tax_amount: 20.08,
          items: [
            {
              id: 1,
              description: "Consultation médicale",
              quantity: 1,
              unit_price: 60.00,
              total_price: 60.00
            },
            {
              id: 2,
              description: "Analyse de sang",
              quantity: 1,
              unit_price: 40.42,
              total_price: 40.42
            }
          ],
          notes: "Paiement à effectuer sous 30 jours. Merci de votre confiance."
        };
        
        setInvoice(mockInvoice);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des détails de la facture:", err);
      setError("Impossible de charger les détails de la facture. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      // Simuler le téléchargement d'un PDF
      alert(`Téléchargement de la facture ${id} en cours...`);
      
      // Dans une implémentation réelle, vous feriez un appel à l'API
      // const response = await axios.get(`/api/patient/invoices/${id}/download`, {
      //   responseType: 'blob',
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      // });
      
      // // Créer un URL pour le blob et déclencher le téléchargement
      // const url = window.URL.createObjectURL(new Blob([response.data]));
      // const link = document.createElement('a');
      // link.href = url;
      // link.setAttribute('download', `facture_${id}.pdf`);
      // document.body.appendChild(link);
      // link.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(link);
    } catch (err) {
      console.error("Erreur lors du téléchargement de la facture:", err);
      alert("Impossible de télécharger la facture. Veuillez réessayer plus tard.");
    }
  };

  const handlePaymentRedirect = () => {
    // Redirection vers une page de paiement fictive
    alert("Redirection vers la plateforme de paiement...");
    // Dans une implémentation réelle, vous pourriez rediriger vers une page de paiement
    // window.location.href = "/payment-gateway?invoice=" + id;
  };

  // Formater un montant en devise
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Traduction des statuts
  const getStatusLabel = (status) => {
    const statuses = {
      unpaid: "À payer",
      paid: "Payée",
      cancelled: "Annulée",
      overdue: "En retard",
    };
    return statuses[status] || status;
  };

  // Classes pour les badges de statut
  const getStatusClass = (status) => {
    switch (status) {
      case "paid":
        return "status-badge confirmé";
      case "unpaid":
        return "status-badge en";
      case "overdue":
        return "status-badge annulé";
      case "cancelled":
        return "status-badge annulé";
      default:
        return "status-badge";
    }
  };

  if (loading) return (
    <div className="patient-dashboard loading-container">
      <div className="spinner"></div>
      <p>Chargement en cours...</p>
    </div>
  );

  if (error) return (
    <div className="patient-dashboard error-container">
      <div className="error-message">
        <i className="fas fa-exclamation-triangle"></i>
        <h2>Une erreur est survenue</h2>
        <p>{error}</p>
        <button className="btn-primary" onClick={() => navigate("/patient-invoices")}>
          Retour aux factures
        </button>
      </div>
    </div>
  );

  if (!invoice) return (
    <div className="patient-dashboard error-container">
      <div className="error-message">
        <i className="fas fa-exclamation-triangle"></i>
        <h2>Facture introuvable</h2>
        <p>La facture demandée n'existe pas ou a été supprimée.</p>
        <button className="btn-primary" onClick={() => navigate("/patient-invoices")}>
          Retour aux factures
        </button>
      </div>
    </div>
  );

  return (
    <div className="invoice-details-container">
      <div className="invoice-details-header">
        <button className="btn-secondary" onClick={() => navigate("/patient-invoices")}>
          <i className="fas fa-arrow-left"></i> Retour
        </button>
        <h1>Facture #{invoice.number}</h1>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleDownloadInvoice}>
            <i className="fas fa-download"></i> Télécharger PDF
          </button>
          {invoice.status === "unpaid" && (
            <button className="btn-primary" onClick={handlePaymentRedirect}>
              <i className="fas fa-credit-card"></i> Payer maintenant
            </button>
          )}
        </div>
      </div>

      <div className="invoice-status-banner">
        <span className={getStatusClass(invoice.status)}>
          {getStatusLabel(invoice.status)}
        </span>
        {invoice.status === "paid" && invoice.payment_date && (
          <div className="payment-info">
            Payée le {new Date(invoice.payment_date).toLocaleDateString()}
            {invoice.payment_method && ` par ${invoice.payment_method}`}
          </div>
        )}
        {invoice.status === "unpaid" && (
          <div className="payment-info">
            À régler avant le {new Date(invoice.due_date).toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="invoice-details-grid">
        <div className="invoice-info-card">
          <h3>Informations</h3>
          <div className="info-row">
            <span className="info-label">Numéro:</span>
            <span className="info-value">{invoice.number}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Date d'émission:</span>
            <span className="info-value">{new Date(invoice.date).toLocaleDateString()}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Date d'échéance:</span>
            <span className="info-value">{new Date(invoice.due_date).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="invoice-info-card">
          <h3>Prestataire</h3>
          <div className="info-row">
            <span className="info-label">Nom:</span>
            <span className="info-value">Centre Médical</span>
          </div>
          <div className="info-row">
            <span className="info-label">Adresse:</span>
            <span className="info-value">123 Rue de la Santé, 75000 Paris</span>
          </div>
          <div className="info-row">
            <span className="info-label">Téléphone:</span>
            <span className="info-value">01 23 45 67 89</span>
          </div>
        </div>
      </div>

      <div className="invoice-items-section">
        <h3>Détail des prestations</h3>
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
              {invoice.items && Array.isArray(invoice.items) && invoice.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unit_price)}</td>
                  <td>{formatCurrency(item.quantity * item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="text-right">Sous-total:</td>
                <td>{formatCurrency(invoice.amount)}</td>
              </tr>
              <tr>
                <td colSpan="3" className="text-right">TVA ({invoice.tax_percent}%):</td>
                <td>{formatCurrency(invoice.tax_amount)}</td>
              </tr>
              <tr className="total-row">
                <td colSpan="3" className="text-right">Total:</td>
                <td>{formatCurrency(invoice.total_amount)}</td>
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

      {invoice.status === "unpaid" && (
        <div className="payment-actions">
          <button className="btn-primary" onClick={handlePaymentRedirect}>
            <i className="fas fa-credit-card"></i> Procéder au paiement
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientInvoiceDetailsPage;