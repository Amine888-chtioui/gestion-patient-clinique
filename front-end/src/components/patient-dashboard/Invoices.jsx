// src/components/patient-dashboard/Invoices.jsx - Version mise à jour avec PDF
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import { useNavigate } from "react-router-dom";
import "../common/modal.css"; // Importation du CSS pour le modal
import UnifiedLoadingSpinner from "../common/UnifiedLoadingSpinner"; // Import du spinner unifié

const Invoices = ({ actionLoading }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [downloadingPdf, setDownloadingPdf] = useState(null);
  const navigate = useNavigate();

  // États pour le modal de détails
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // États pour le modal de paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [paymentData, setPaymentData] = useState({
    payment_method: "card",
    card_number: "",
    expiry_date: "",
    cvv: "",
    name_on_card: "",
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

  // Fonction pour télécharger la facture en PDF
  const handleDownloadInvoicePdf = async (invoiceId) => {
    setDownloadingPdf(invoiceId);

    try {
      const response = await axios.get(
        `/api/patient/invoices/${invoiceId}/download-pdf`,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}` 
          },
          responseType: 'blob', // Important pour recevoir le fichier PDF
        }
      );

      // Créer une URL pour le blob PDF
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      
      // Créer un lien de téléchargement temporaire
      const link = document.createElement('a');
      link.href = url;
      
      // Extraire le nom de fichier depuis les en-têtes de réponse ou utiliser un nom par défaut
      let filename = `facture_${invoiceId}.pdf`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      
      // Ajouter temporairement le lien au DOM et cliquer dessus
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Erreur lors du téléchargement du PDF:", err);
      
      let errorMessage = "Erreur lors du téléchargement de la facture.";
      
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = "Cette facture n'existe pas ou n'est pas accessible.";
        } else if (err.response.status === 403) {
          errorMessage = "Vous n'avez pas l'autorisation d'accéder à cette facture.";
        } else if (err.response.status === 500) {
          errorMessage = "Erreur du serveur lors de la génération du PDF. Veuillez réessayer plus tard.";
        }
      }
      
      alert(errorMessage);
    } finally {
      setDownloadingPdf(null);
    }
  };

  // Fonction pour imprimer la facture
  const handlePrintInvoice = async (invoiceId) => {
    try {
      const response = await axios.get(
        `/api/patient/invoices/${invoiceId}/download-pdf`,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}` 
          },
          responseType: 'blob',
        }
      );

      // Créer une URL pour le blob PDF
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      
      // Ouvrir le PDF dans une nouvelle fenêtre pour impression
      const printWindow = window.open(url, '_blank');
      
      // Nettoyer l'URL après un délai
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

    } catch (err) {
      console.error("Erreur lors de l'ouverture pour impression:", err);
      alert("Erreur lors de l'ouverture de la facture pour impression.");
    }
  };

  // Télécharger une facture en PDF (méthode existante mise à jour)
  const handleDownloadInvoice = async (id) => {
    await handleDownloadInvoicePdf(id);
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

  // Ouvrir le modal de paiement
  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
    // Réinitialiser les états de paiement
    setPaymentError(null);
    setPaymentSuccess(null);
    setPaymentData({
      payment_method: "card",
      card_number: "",
      expiry_date: "",
      cvv: "",
      name_on_card: "",
    });
  };

  // Fermer le modal de paiement
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setPaymentProcessing(false);
  };

  // Gérer les changements des champs de paiement
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({
      ...paymentData,
      [name]: value,
    });
  };

  // Traiter le paiement
  const handleProcessPayment = async (e) => {
    if (e) e.preventDefault();

    if (!selectedInvoice) return;

    setPaymentProcessing(true);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      // Dans un environnement réel, vous appelleriez ici votre API de paiement
      // Exemple d'appel API avec le backend
      const response = await axios.post(
        `/api/patient/payments/process`,
        {
          invoice_id: selectedInvoice.id,
          payment_method_id: 1, // On utilise un ID de méthode de paiement par défaut
          payment_session_id: "sess_" + Math.random().toString(36).substr(2, 9), // ID de session simulé
        },
        getAuthHeaders()
      );

      setPaymentSuccess("Paiement effectué avec succès!");

      // Mise à jour du statut de la facture dans l'état local
      setInvoices((prevInvoices) =>
        prevInvoices.map((invoice) =>
          invoice.id === selectedInvoice.id
            ? {
                ...invoice,
                status: "paid",
                payment_date: new Date().toISOString(),
              }
            : invoice
        )
      );

      // Si nous avons ouvert les détails de la facture, mettons également à jour ces détails
      if (invoiceDetails && invoiceDetails.id === selectedInvoice.id) {
        setInvoiceDetails({
          ...invoiceDetails,
          status: "paid",
          payment_date: new Date().toISOString(),
        });
      }

      // Fermer le modal après 2 secondes et rafraîchir les données
      setTimeout(() => {
        closePaymentModal();
        // Rafraîchir la liste des factures depuis le serveur
        fetchInvoices();
      }, 2000);
    } catch (err) {
      console.error("Erreur lors du paiement:", err);
      setPaymentError(
        "Une erreur s'est produite lors du traitement du paiement. Veuillez réessayer."
      );
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
                    
                    {/* Bouton de téléchargement PDF mis à jour */}
                    <button
                      className="btn-icon"
                      title="Télécharger la facture en PDF"
                      onClick={() => handleDownloadInvoicePdf(invoice.id)}
                      disabled={actionLoading || downloadingPdf === invoice.id}
                    >
                      {downloadingPdf === invoice.id ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-file-pdf"></i>
                      )}
                    </button>
                    
                    {/* Bouton d'impression */}
                    <button
                      className="btn-icon"
                      title="Imprimer la facture"
                      onClick={() => handlePrintInvoice(invoice.id)}
                      disabled={actionLoading || downloadingPdf === invoice.id}
                    >
                      <i className="fas fa-print"></i>
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
                    onClick={() => handleDownloadInvoicePdf(invoiceDetails.id)}
                    disabled={downloadingPdf === invoiceDetails.id}
                  >
                    {downloadingPdf === invoiceDetails.id ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Génération...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-file-pdf"></i> Télécharger PDF
                      </>
                    )}
                  </button>

                  <button
                    className="btn-outline"
                    onClick={() => handlePrintInvoice(invoiceDetails.id)}
                  >
                    <i className="fas fa-print"></i> Imprimer
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

      {/* Modal de paiement - reste identique */}
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
              {/* Récapitulatif de la facture */}
              <div className="payment-summary">
                <h4>Récapitulatif</h4>
                <div className="detail-row">
                  <span className="detail-label">Numéro de facture:</span>
                  <span className="detail-value">
                    {selectedInvoice.number || `#${selectedInvoice.id}`}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date d'émission:</span>
                  <span className="detail-value">
                    {formatDate(selectedInvoice.date)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Montant à payer:</span>
                  <span className="detail-value payment-amount">
                    {formatAmount(selectedInvoice.total_amount)}
                  </span>
                </div>
              </div>

              {/* Messages de succès ou d'erreur */}
              {paymentSuccess && (
                <div className="payment-success">
                  <i className="fas fa-check-circle"></i> {paymentSuccess}
                </div>
              )}

              {paymentError && (
                <div className="payment-error">
                  <i className="fas fa-exclamation-circle"></i> {paymentError}
                </div>
              )}

              {/* État de traitement du paiement */}
              {paymentProcessing && (
                <div className="payment-processing">
                  <UnifiedLoadingSpinner text="Traitement du paiement en cours..." />
                </div>
              )}

              {/* Formulaire de paiement */}
              {!paymentSuccess && !paymentProcessing && (
                <form onSubmit={handleProcessPayment} className="payment-form">
                  <h4>Informations de paiement</h4>

                  <div className="form-group">
                    <label htmlFor="payment_method">Méthode de paiement</label>
                    <select
                      id="payment_method"
                      name="payment_method"
                      value={paymentData.payment_method}
                      onChange={handlePaymentInputChange}
                      required
                      disabled={paymentProcessing}
                    >
                      <option value="card">Carte bancaire</option>
                      <option value="transfer">Virement bancaire</option>
                    </select>
                  </div>

                  {paymentData.payment_method === "card" && (
                    <>
                      <div className="form-group">
                        <label htmlFor="name_on_card">Nom sur la carte</label>
                        <input
                          type="text"
                          id="name_on_card"
                          name="name_on_card"
                          value={paymentData.name_on_card}
                          onChange={handlePaymentInputChange}
                          placeholder="Nom sur la carte"
                          required
                          disabled={paymentProcessing}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="card_number">Numéro de carte</label>
                        <input
                          type="text"
                          id="card_number"
                          name="card_number"
                          value={paymentData.card_number}
                          onChange={handlePaymentInputChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                          required
                          disabled={paymentProcessing}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="expiry_date">Date d'expiration</label>
                          <input
                            type="text"
                            id="expiry_date"
                            name="expiry_date"
                            value={paymentData.expiry_date}
                            onChange={handlePaymentInputChange}
                            placeholder="MM/AA"
                            maxLength="5"
                            required
                            disabled={paymentProcessing}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="cvv">CVV</label>
                          <input
                            type="text"
                            id="cvv"
                            name="cvv"
                            value={paymentData.cvv}
                            onChange={handlePaymentInputChange}
                            placeholder="123"
                            maxLength="4"
                            required
                            disabled={paymentProcessing}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {paymentData.payment_method === "transfer" && (
                    <div className="transfer-info">
                      <p>
                        Pour effectuer un virement bancaire, utilisez les
                        informations suivantes:
                      </p>
                      <div className="detail-row">
                        <span className="detail-label">Bénéficiaire:</span>
                        <span className="detail-value">Centre Médical</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">IBAN:</span>
                        <span className="detail-value">
                          FR76 1234 5678 9012 3456 7890 123
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">BIC:</span>
                        <span className="detail-value">ABCDEFGH</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Référence:</span>
                        <span className="detail-value">
                          {selectedInvoice.number ||
                            `FAC-${selectedInvoice.id}`}
                        </span>
                      </div>
                      <p className="transfer-note">
                        Veuillez noter que le paiement sera validé une fois que
                        nous aurons reçu la confirmation de votre banque.
                      </p>
                    </div>
                  )}

                  <div className="payment-actions">
                    {paymentData.payment_method === "card" ? (
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={paymentProcessing}
                      >
                        <i className="fas fa-lock"></i> Payer{" "}
                        {formatAmount(selectedInvoice.total_amount)}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleProcessPayment}
                        disabled={paymentProcessing}
                      >
                        J'ai effectué le virement
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={closePaymentModal}
                      disabled={paymentProcessing}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              {/* Section de sécurité */}
              <div className="payment-security">
                <i className="fas fa-shield-alt"></i>
                <p>
                  Paiement sécurisé - Vos données sont chiffrées et sécurisées.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;