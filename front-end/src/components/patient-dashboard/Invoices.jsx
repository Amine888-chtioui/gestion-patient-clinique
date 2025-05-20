// src/components/patient-dashboard/Invoices.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import { useNavigate } from "react-router-dom";
import "./patient-invoices.css"; // Importation du CSS pour les factures
import "../common/modal.css"; // Importation du CSS pour le modal
import UnifiedLoadingSpinner from "../common/UnifiedLoadingSpinner"; // Import du spinner unifié

const Invoices = ({ actionLoading }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  // États pour le modal de détails
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // États pour le modal de paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: ""
  });

  // Fonction utilitaire pour les en-têtes d'autorisation
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      // Construire les paramètres de requête
      const params = {};
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await axios.get("/api/patient/invoices", {
        ...getAuthHeaders(),
        params,
      });

      setInvoices(response.data.invoices.data || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des factures:", err);
      setError(
        "Impossible de charger les factures. Veuillez réessayer plus tard."
      );
    } finally {
      setLoading(false);
    }
  };

  // Télécharger une facture en PDF
  const handleDownloadInvoice = async (id) => {
    try {
      const response = await axios.get(`/api/patient/invoices/${id}/download`, {
        ...getAuthHeaders(),
        responseType: "blob",
      });

      // Créer une URL pour le blob et télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `facture-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Erreur lors du téléchargement de la facture:", err);
    }
  };

  // Charger les détails d'une facture
  const handleViewDetails = async (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);

    try {
      setLoadingDetails(true);
      // Récupérer les détails complets de la facture pour s'assurer d'avoir le statut à jour
      const response = await axios.get(
        `/api/patient/invoices/${invoice.id}`,
        getAuthHeaders()
      );
      setInvoiceDetails(response.data.invoice);
    } catch (err) {
      console.error(
        "Erreur lors de la récupération des détails de la facture:",
        err
      );
      // En cas d'erreur, utiliser les données de base de la facture
      setInvoiceDetails(invoice);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fermer le modal de détails
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedInvoice(null);
    setInvoiceDetails(null);
  };

  // Ouvrir le modal de paiement et charger les méthodes de paiement
  const handleOpenPaymentModal = async (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
    // Réinitialiser les états de paiement
    setPaymentError(null);
    setPaymentSuccess(null);
    setSelectedPaymentMethod("");
    setCardDetails({
      cardNumber: "",
      cardHolder: "",
      expiryDate: "",
      cvv: ""
    });

    // Charger les méthodes de paiement disponibles
    try {
      setLoadingPaymentMethods(true);
      const response = await axios.get("/api/patient/payment-methods", getAuthHeaders());
      setPaymentMethods(response.data.payment_methods || []);
      // Sélectionner la première méthode de paiement par défaut
      if (response.data.payment_methods && response.data.payment_methods.length > 0) {
        setSelectedPaymentMethod(response.data.payment_methods[0].id);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des méthodes de paiement:", err);
      setPaymentError("Impossible de charger les méthodes de paiement. Veuillez réessayer plus tard.");
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  // Fermer le modal de paiement
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setSelectedPaymentMethod("");
    setPaymentProcessing(false);
  };

  // Gérer les changements des champs de carte
  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails({
      ...cardDetails,
      [name]: value
    });
  };

  // Initialiser le processus de paiement
  const handleInitiatePayment = async () => {
    if (!selectedPaymentMethod) {
      setPaymentError("Veuillez sélectionner une méthode de paiement");
      return;
    }

    setPaymentProcessing(true);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      // Étape 1: Initialiser le paiement - obtenir une session de paiement
      const initResponse = await axios.post(
        `/api/patient/invoices/${selectedInvoice.id}/payment/initialize`,
        { payment_method_id: selectedPaymentMethod },
        getAuthHeaders()
      );

      // Étape 2: Traiter le paiement avec la session générée
      await processPayment(initResponse.data.payment_session);
    } catch (err) {
      console.error("Erreur lors de l'initialisation du paiement:", err);
      setPaymentError(err.response?.data?.message || "Une erreur est survenue lors de l'initialisation du paiement.");
      setPaymentProcessing(false);
    }
  };

  // Traiter le paiement
  const processPayment = async (paymentSession) => {
    try {
      // Simuler un délai de traitement pour l'expérience utilisateur
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Finaliser le paiement
      const response = await axios.post(
        "/api/patient/payments/process",
        {
          invoice_id: selectedInvoice.id,
          payment_method_id: selectedPaymentMethod,
          payment_session_id: paymentSession.id,
          // Ajouter les détails de la carte si nécessaire (dans une implementation réelle, cela serait géré différemment pour la sécurité)
          // card_details: cardDetails
        },
        getAuthHeaders()
      );

      // Mettre à jour l'état de la facture localement
      setInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.id === selectedInvoice.id 
            ? { ...invoice, status: 'paid', payment_date: new Date().toISOString() } 
            : invoice
        )
      );

      setPaymentSuccess("Paiement effectué avec succès !");

      // Fermer le modal après un délai et rafraîchir les données
      setTimeout(() => {
        closePaymentModal();
        fetchInvoices(); // Rafraîchir les factures
      }, 2500);
    } catch (err) {
      console.error("Erreur lors du traitement du paiement:", err);
      setPaymentError(err.response?.data?.message || "Une erreur est survenue lors du traitement du paiement.");
      setPaymentProcessing(false);
    }
  };

  // Formater un montant en euros
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Formater une date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR");
  };

  // Obtenir la classe CSS en fonction du statut
  const getStatusClass = (status) => {
    switch (status) {
      case "paid":
        return "status-badge confirmed";
      case "unpaid":
      case "pending":
        return "status-badge pending";
      case "overdue":
        return "status-badge cancelled";
      default:
        return "status-badge";
    }
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (status) => {
    switch (status) {
      case "paid":
        return "Payée";
      case "unpaid":
        return "Non payée";
      case "draft":
        return "Brouillon";
      case "cancelled":
        return "Annulée";
      default:
        return status;
    }
  };

  // Affichage pendant le chargement des données
  if (loading) {
    return <UnifiedLoadingSpinner text="Chargement des factures..." />;
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="error-message">
        <i className="fas fa-exclamation-triangle"></i>
        <h3>Une erreur est survenue</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="invoices-container">
      <h3>Mes factures</h3>

      <div className="filter-bar">
        <div className="filter-item">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={actionLoading}
          >
            <option value="all">Tous les statuts</option>
            <option value="paid">Payées</option>
            <option value="unpaid">Non payées</option>
          </select>
        </div>
        <button
          className="btn-secondary"
          onClick={fetchInvoices}
          disabled={actionLoading}
        >
          <i className="fas fa-sync-alt"></i> Actualiser
        </button>
      </div>

      {invoices.length > 0 ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Date</th>
                <th>Date d'échéance</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id || Math.random()}>
                  <td>{invoice.number || `FAC-${invoice.id}`}</td>
                  <td>{formatDate(invoice.date)}</td>
                  <td>{formatDate(invoice.due_date)}</td>
                  <td>{formatAmount(invoice.total_amount)}</td>
                  <td>
                    <span className={getStatusClass(invoice.status)}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="btn-icon"
                      title="Voir les détails"
                      onClick={() => handleViewDetails(invoice)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      className="btn-icon"
                      title="Télécharger"
                      onClick={() => handleDownloadInvoice(invoice.id)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-download"></i>
                    </button>
                    {/* Bouton pour payer les factures non payées */}
                    {(invoice.status === "unpaid" ||
                      invoice.status === "pending") && (
                      <button
                        className="btn-icon payment-icon"
                        title="Payer cette facture"
                        onClick={() => handleOpenPaymentModal(invoice)}
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
          <p>
            Vous n'avez pas encore de factures ou aucune facture ne correspond à
            vos critères de recherche.
          </p>
        </div>
      )}

      {/* Modal de détails de facture */}
      {showDetailsModal && invoiceDetails && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div
            className="modal-content modal-content-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                Détails de la facture{" "}
                {invoiceDetails.number || `#${invoiceDetails.id}`}
              </h3>
              <button className="modal-close" onClick={closeDetailsModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {loadingDetails ? (
              <div className="modal-body">
                <UnifiedLoadingSpinner text="Chargement des détails..." />
              </div>
            ) : (
              <div className="modal-body">
                <div className="invoice-status-banner">
                  <span className={getStatusClass(invoiceDetails.status)}>
                    {getStatusLabel(invoiceDetails.status)}
                  </span>

                  {invoiceDetails.status === "paid" &&
                    invoiceDetails.payment_date && (
                      <div className="payment-info">
                        Payée le {formatDate(invoiceDetails.payment_date)}
                        {invoiceDetails.payment_method &&
                          ` par ${invoiceDetails.payment_method}`}
                      </div>
                    )}
                </div>

                <div className="invoice-details-grid">
                  <div className="invoice-info-card">
                    <h4>Informations générales</h4>
                    <div className="detail-row">
                      <span className="detail-label">Numéro de facture:</span>
                      <span className="detail-value">
                        {invoiceDetails.number || `#${invoiceDetails.id}`}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Date d'émission:</span>
                      <span className="detail-value">
                        {formatDate(invoiceDetails.date)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Date d'échéance:</span>
                      <span className="detail-value">
                        {formatDate(invoiceDetails.due_date)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Montant total:</span>
                      <span className="detail-value">
                        {formatAmount(invoiceDetails.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Détails des prestations/produits */}
                {invoiceDetails.items && invoiceDetails.items.length > 0 && (
                  <div className="invoice-items-section">
                    <h4>Détails des prestations</h4>
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
                        {invoiceDetails.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>{formatAmount(item.unit_price)}</td>
                            <td>
                              {formatAmount(item.quantity * item.unit_price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" className="text-right">
                            Sous-total:
                          </td>
                          <td>
                            {formatAmount(
                              invoiceDetails.amount ||
                                invoiceDetails.total_amount
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-right">
                            TVA ({invoiceDetails.tax_percent || 20}%):
                          </td>
                          <td>
                            {formatAmount(invoiceDetails.tax_amount || 0)}
                          </td>
                        </tr>
                        <tr className="total-row">
                          <td colSpan="3" className="text-right">
                            Total:
                          </td>
                          <td>{formatAmount(invoiceDetails.total_amount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Notes */}
                {invoiceDetails.notes && (
                  <div className="invoice-notes">
                    <h4>Notes</h4>
                    <p>{invoiceDetails.notes}</p>
                  </div>
                )}

                {/* Actions de facture */}
                <div className="detail-actions">
                  <button
                    className="btn-outline"
                    onClick={() => handleDownloadInvoice(invoiceDetails.id)}
                  >
                    <i className="fas fa-download"></i> Télécharger
                  </button>

                  {(invoiceDetails.status === "unpaid" ||
                    invoiceDetails.status === "pending") && (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        closeDetailsModal();
                        handleOpenPaymentModal(invoiceDetails);
                      }}
                    >
                      <i className="fas fa-credit-card"></i> Payer maintenant
                    </button>
                  )}

                  <button className="btn-secondary" onClick={closeDetailsModal}>
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de paiement */}
      {showPaymentModal && selectedInvoice && (
        <div
          className="modal-overlay"
          onClick={paymentProcessing ? null : closePaymentModal}
        >
          <div
            className="modal-content modal-content-medium"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                Paiement de la facture{" "}
                {selectedInvoice.number || `#${selectedInvoice.id}`}
              </h3>
              {!paymentProcessing && (
                <button className="modal-close" onClick={closePaymentModal}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            <div className="modal-body">
              <div className="payment-summary">
                <h4>Récapitulatif</h4>
                <div className="detail-row">
                  <span className="detail-label">Facture:</span>
                  <span className="detail-value">
                    {selectedInvoice.number || `#${selectedInvoice.id}`}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Montant à payer:</span>
                  <span className="detail-value payment-amount">
                    {formatAmount(selectedInvoice.total_amount)}
                  </span>
                </div>
              </div>

              {/* Affichage des erreurs ou succès */}
              {paymentError && (
                <div className="alert alert-danger">
                  <i className="fas fa-exclamation-circle"></i> {paymentError}
                </div>
              )}
              
              {paymentSuccess && (
                <div className="alert alert-success">
                  <i className="fas fa-check-circle"></i> {paymentSuccess}
                </div>
              )}

              {/* Chargement des méthodes de paiement */}
              {loadingPaymentMethods ? (
                <div className="payment-methods-loading">
                  <UnifiedLoadingSpinner 
                    size="small" 
                    text="Chargement des méthodes de paiement..." 
                  />
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="payment-methods-empty">
                  <i className="fas fa-exclamation-triangle"></i>
                  <p>Aucune méthode de paiement disponible. Veuillez contacter l'administration.</p>
                </div>
              ) : (
                <div className="payment-methods-section">
                  <h4>Méthode de paiement</h4>
                  <div className="payment-methods-list">
                    {paymentMethods.map(method => (
                      <div className="payment-method-item" key={method.id}>
                        <label className="payment-method-label">
                          <input
                            type="radio"
                            name="payment_method"
                            value={method.id}
                            checked={selectedPaymentMethod === method.id}
                            onChange={() => setSelectedPaymentMethod(method.id)}
                            disabled={paymentProcessing}
                          />
                          <div className="payment-method-info">
                            <span className="payment-method-name">{method.name}</span>
                            {method.description && (
                              <span className="payment-method-description">{method.description}</span>
                            )}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Formulaire pour les détails de carte (visible uniquement pour la méthode de paiement par carte) */}
                  {selectedPaymentMethod && paymentMethods.find(m => m.id === selectedPaymentMethod)?.code === 'card' && (
                    <div className="card-details-form">
                      <h4>Informations de carte</h4>
                      <div className="form-group">
                        <label>Numéro de carte</label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={cardDetails.cardNumber}
                          onChange={handleCardInputChange}
                          placeholder="1234 5678 9012 3456"
                          disabled={paymentProcessing}
                          maxLength="19"
                        />
                      </div>
                      <div className="form-group">
                        <label>Titulaire de la carte</label>
                        <input
                          type="text"
                          name="cardHolder"
                          value={cardDetails.cardHolder}
                          onChange={handleCardInputChange}
                          placeholder="NOM Prénom"
                          disabled={paymentProcessing}
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Date d'expiration</label>
                          <input
                            type="text"
                            name="expiryDate"
                            value={cardDetails.expiryDate}
                            onChange={handleCardInputChange}
                            placeholder="MM/AA"
                            disabled={paymentProcessing}
                            maxLength="5"
                          />
                        </div>
                        <div className="form-group">
                          <label>CVV</label>
                          <input
                            type="text"
                            name="cvv"
                            value={cardDetails.cvv}
                            onChange={handleCardInputChange}
                            placeholder="123"
                            disabled={paymentProcessing}
                            maxLength="4"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* État de traitement du paiement */}
              {paymentProcessing && (
                <div className="payment-processing">
                  <UnifiedLoadingSpinner text="Traitement du paiement..." />
                </div>
              )}

              {/* Actions de paiement */}
              <div className="payment-actions">
                <button
                  className="btn-primary"
                  onClick={handleInitiatePayment}
                  disabled={!selectedPaymentMethod || paymentProcessing || paymentSuccess}
                >
                  {paymentProcessing ? (
                    <span><i className="fas fa-spinner fa-spin"></i> Traitement en cours...</span>
                  ) : (
                    <span><i className="fas fa-credit-card"></i> Payer {formatAmount(selectedInvoice.total_amount)}</span>
                  )}
                </button>
                <button
                  className="btn-secondary"
                  onClick={closePaymentModal}
                  disabled={paymentProcessing}
                >
                  Annuler
                </button>
              </div>

              {/* Note de sécurité */}
              <div className="payment-security-note">
                <i className="fas fa-lock"></i>
                <span>Paiement sécurisé - Vos données sont chiffrées et sécurisées</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Invoices;