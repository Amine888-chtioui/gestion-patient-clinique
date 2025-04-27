// src/components/patient-dashboard/PaymentInterface.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../axios";

const PaymentInterface = () => {
  const [invoice, setInvoice] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();
  
  // Récupérer les détails de la facture et les méthodes de paiement
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Récupérer la facture et les méthodes de paiement en parallèle
        const [invoiceResponse, methodsResponse] = await Promise.all([
          axios.get(`/api/patient/invoices/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }),
          axios.get("/api/patient/payment-methods", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          })
        ]);
        
        setInvoice(invoiceResponse.data.invoice);
        setPaymentMethods(methodsResponse.data.payment_methods || []);
        
        // Sélectionner automatiquement la première méthode si disponible
        if (methodsResponse.data.payment_methods?.length > 0) {
          setSelectedMethod(methodsResponse.data.payment_methods[0].id);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setError("Impossible de charger les informations de paiement. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Initialiser le processus de paiement
  const handleInitializePayment = async (e) => {
    e.preventDefault();
    
    if (!selectedMethod) {
      setError("Veuillez sélectionner une méthode de paiement");
      return;
    }
    
    setProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.post(`/api/patient/invoices/${id}/payment/initialize`, 
        { payment_method_id: selectedMethod },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      
      // Simuler une redirection vers une page de paiement
      setSuccess("Paiement en cours de traitement...");
      
      // Dans une implémentation réelle, vous redirigeriez vers la page de paiement
      // window.location.href = response.data.redirect_url;
      
      // Pour notre démonstration, nous allons simuler un paiement réussi après un court délai
      setTimeout(() => {
        handleProcessPayment(response.data.payment_session);
      }, 2000);
      
    } catch (err) {
      console.error("Erreur lors de l'initialisation du paiement:", err);
      setError(err.response?.data?.message || "Impossible d'initialiser le paiement. Veuillez réessayer plus tard.");
      setProcessing(false);
    }
  };
  
  // Finaliser le paiement (simulé)
  const handleProcessPayment = async (paymentSession) => {
    try {
      const response = await axios.post('/api/patient/payments/process', 
        {
          invoice_id: id,
          payment_method_id: selectedMethod,
          payment_session_id: paymentSession.id
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      
      setSuccess("Paiement réussi! Vous allez être redirigé vers les détails de votre facture.");
      
      // Rediriger vers la page de détails de la facture après un court délai
      setTimeout(() => {
        navigate(`/patient-invoices/${id}`);
      }, 2000);
      
    } catch (err) {
      console.error("Erreur lors du traitement du paiement:", err);
      setError(err.response?.data?.message || "Le paiement a échoué. Veuillez réessayer plus tard.");
      setProcessing(false);
    }
  };

  // Formater un montant en devise
  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="spinner"></div>
        <p>Chargement des informations de paiement...</p>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="error-container">
        <i className="fas fa-exclamation-triangle"></i>
        <h3>Erreur</h3>
        <p>{error}</p>
        <button className="btn-primary" onClick={() => navigate("/patient-invoices")}>
          Retour aux factures
        </button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="error-container">
        <i className="fas fa-exclamation-triangle"></i>
        <h3>Facture introuvable</h3>
        <p>La facture que vous essayez de payer n'existe pas ou a été supprimée.</p>
        <button className="btn-primary" onClick={() => navigate("/patient-invoices")}>
          Retour aux factures
        </button>
      </div>
    );
  }

  // Si la facture est déjà payée
  if (invoice.status === 'paid') {
    return (
      <div className="success-container">
        <i className="fas fa-check-circle"></i>
        <h3>Facture déjà payée</h3>
        <p>Cette facture a déjà été réglée le {new Date(invoice.payment_date).toLocaleDateString()}.</p>
        <button className="btn-primary" onClick={() => navigate(`/patient-invoices/${id}`)}>
          Voir les détails de la facture
        </button>
      </div>
    );
  }

  return (
    <div className="payment-interface-container">
      <div className="payment-header">
        <button className="btn-secondary" onClick={() => navigate(`/patient-invoices/${id}`)}>
          <i className="fas fa-arrow-left"></i> Retour à la facture
        </button>
        <h1>Paiement de la facture #{invoice.number}</h1>
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i> {success}
        </div>
      )}

      <div className="payment-content">
        <div className="invoice-summary-card">
          <h3>Récapitulatif de la facture</h3>
          <div className="summary-details">
            <div className="summary-row">
              <div className="summary-label">Numéro de facture:</div>
              <div className="summary-value">{invoice.number}</div>
            </div>
            <div className="summary-row">
              <div className="summary-label">Date:</div>
              <div className="summary-value">{new Date(invoice.date).toLocaleDateString()}</div>
            </div>
            <div className="summary-row">
              <div className="summary-label">Date d'échéance:</div>
              <div className="summary-value">{new Date(invoice.due_date).toLocaleDateString()}</div>
            </div>
            <div className="summary-row">
              <div className="summary-label">Sous-total:</div>
              <div className="summary-value">{formatCurrency(invoice.amount)}</div>
            </div>
            <div className="summary-row">
              <div className="summary-label">TVA ({invoice.tax_percent}%):</div>
              <div className="summary-value">{formatCurrency(invoice.tax_amount)}</div>
            </div>
            <div className="summary-row total">
              <div className="summary-label">Montant total à payer:</div>
              <div className="summary-value">{formatCurrency(invoice.total_amount)}</div>
            </div>
          </div>
        </div>

        <div className="payment-methods-card">
          <h3>Choisissez votre méthode de paiement</h3>

          {paymentMethods.length === 0 ? (
            <div className="empty-payment-methods">
              <i className="fas fa-exclamation-triangle"></i>
              <p>Aucune méthode de paiement n'est disponible actuellement. Veuillez contacter l'administration.</p>
            </div>
          ) : (
            <form onSubmit={handleInitializePayment}>
              <div className="payment-methods-list">
                {paymentMethods.map(method => (
                  <div className="payment-method-option" key={method.id}>
                    <label>
                      <input
                        type="radio"
                        name="payment_method"
                        value={method.id}
                        checked={selectedMethod === method.id}
                        onChange={() => setSelectedMethod(method.id)}
                        disabled={processing}
                      />
                      <div className="payment-method-details">
                        <div className="payment-method-name">{method.name}</div>
                        {method.description && (
                          <div className="payment-method-description">{method.description}</div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="payment-actions">
                <button 
                  type="submit" 
                  className="btn-primary btn-lg" 
                  disabled={processing || !selectedMethod}
                >
                  {processing ? (
                    <><i className="fas fa-spinner fa-spin"></i> Traitement en cours...</>
                  ) : (
                    <><i className="fas fa-credit-card"></i> Payer maintenant {formatCurrency(invoice.total_amount)}</>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => navigate(`/patient-invoices/${id}`)}
                  disabled={processing}
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="payment-info-section">
        <div className="info-header">
          <i className="fas fa-shield-alt"></i>
          <h3>Paiement sécurisé</h3>
        </div>
        <p>
          Toutes nos transactions sont sécurisées avec un cryptage SSL. Vos informations de paiement ne sont jamais stockées sur nos serveurs.
        </p>
      </div>
    </div>
  );
};

export default PaymentInterface;