// src/components/patient-dashboard/Invoices.jsx - Version optimisée
import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../../services/apiClient";
import "../common/modal.css";
import UnifiedLoadingSpinner from "../common/UnifiedLoadingSpinner";

const Invoices = ({ actionLoading }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [downloadingPdf, setDownloadingPdf] = useState(null);

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

  // Fonctions utilitaires
  const formatAmount = useCallback((amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR");
  }, []);

  const getStatusClass = useCallback((status) => {
    const statusClasses = {
      paid: "status-badge confirmed",
      unpaid: "status-badge pending",
      pending: "status-badge pending",
      overdue: "status-badge cancelled",
    };
    return statusClasses[status] || "status-badge";
  }, []);

  const getStatusLabel = useCallback((status) => {
    const statusLabels = {
      paid: "Payée",
      unpaid: "Non payée",
      draft: "Brouillon",
      cancelled: "Annulée",
    };
    return statusLabels[status] || status;
  }, []);

  // Chargement des factures
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }

      const invoicesData = await apiClient.getInvoices(params);
      setInvoices(invoicesData);
    } catch (err) {
      console.error("Erreur lors de la récupération des factures:", err);
      setError("Impossible de charger les factures. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Gestion des téléchargements PDF
  const handleDownloadFile = useCallback(async (invoiceId, action = "download") => {
    setDownloadingPdf(invoiceId);

    try {
      const response = await apiClient.downloadInvoicePdf(invoiceId);

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );

      if (action === "print") {
        const printWindow = window.open(url, "_blank");
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        const link = document.createElement("a");
        link.href = url;

        let filename = `facture_${invoiceId}.pdf`;
        const contentDisposition = response.headers["content-disposition"];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) filename = filenameMatch[1];
        }

        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Erreur lors du traitement du PDF:", err);
      const errorMessages = {
        404: "Cette facture n'existe pas ou n'est pas accessible.",
        403: "Vous n'avez pas l'autorisation d'accéder à cette facture.",
        500: "Erreur du serveur lors de la génération du PDF. Veuillez réessayer plus tard.",
      };
      alert(errorMessages[err.response?.status] || "Erreur lors du traitement de la facture.");
    } finally {
      setDownloadingPdf(null);
    }
  }, []);

  // Gestion des détails de facture
  const handleViewDetails = useCallback(async (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);

    try {
      setLoadingDetails(true);
      const details = await apiClient.getInvoice(invoice.id);
      setInvoiceDetails(details);
    } catch (err) {
      console.error("Erreur lors de la récupération des détails:", err);
      setInvoiceDetails(invoice);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  // Gestion du paiement
  const handleOpenPaymentModal = useCallback((invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
    setPaymentError(null);
    setPaymentSuccess(null);
    setPaymentData({
      payment_method: "card",
      card_number: "",
      expiry_date: "",
      cvv: "",
      name_on_card: "",
    });
  }, []);

  const handleProcessPayment = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!selectedInvoice) return;

    setPaymentProcessing(true);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      await apiClient.processPayment({
        invoice_id: selectedInvoice.id,
        payment_method_id: 1,
        payment_session_id: "sess_" + Math.random().toString(36).substr(2, 9),
      });

      setPaymentSuccess("Paiement effectué avec succès!");

      // Mettre à jour l'état local
      setInvoices((prevInvoices) =>
        prevInvoices.map((invoice) =>
          invoice.id === selectedInvoice.id
            ? { ...invoice, status: "paid", payment_date: new Date().toISOString() }
            : invoice
        )
      );

      if (invoiceDetails && invoiceDetails.id === selectedInvoice.id) {
        setInvoiceDetails({
          ...invoiceDetails,
          status: "paid",
          payment_date: new Date().toISOString(),
        });
      }

      setTimeout(() => {
        setShowPaymentModal(false);
        fetchInvoices();
      }, 2000);
    } catch (err) {
      console.error("Erreur lors du paiement:", err);
      setPaymentError("Une erreur s'est produite lors du traitement du paiement. Veuillez réessayer.");
      setPaymentProcessing(false);
    }
  }, [selectedInvoice, invoiceDetails, fetchInvoices]);

  // Fonctions de fermeture des modals
  const closeDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedInvoice(null);
    setInvoiceDetails(null);
  }, []);

  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setPaymentProcessing(false);
  }, []);

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
                      title="Télécharger la facture en PDF"
                      onClick={() => handleDownloadFile(invoice.id, "download")}
                      disabled={actionLoading || downloadingPdf === invoice.id}
                    >
                      {downloadingPdf === invoice.id ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-file-pdf"></i>
                      )}
                    </button>

                    <button
                      className="btn-icon"
                      title="Imprimer la facture"
                      onClick={() => handleDownloadFile(invoice.id, "print")}
                      disabled={actionLoading || downloadingPdf === invoice.id}
                    >
                      <i className="fas fa-print"></i>
                    </button>

                    {(invoice.status === "unpaid" || invoice.status === "pending") && (
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
        <InvoiceDetailsModal
          invoice={invoiceDetails}
          isLoading={loadingDetails}
          onClose={closeDetailsModal}
          onDownload={() => handleDownloadFile(invoiceDetails.id)}
          onPrint={() => handleDownloadFile(invoiceDetails.id, "print")}
          onPay={() => {
            closeDetailsModal();
            handleOpenPaymentModal(invoiceDetails);
          }}
          formatAmount={formatAmount}
          formatDate={formatDate}
          getStatusClass={getStatusClass}
          getStatusLabel={getStatusLabel}
          downloadingPdf={downloadingPdf}
        />
      )}

      {/* Modal de paiement */}
      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          paymentData={paymentData}
          setPaymentData={setPaymentData}
          paymentProcessing={paymentProcessing}
          paymentError={paymentError}
          paymentSuccess={paymentSuccess}
          onProcess={handleProcessPayment}
          onClose={closePaymentModal}
          formatAmount={formatAmount}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

// Composant Modal pour les détails de facture
const InvoiceDetailsModal = React.memo(({
  invoice,
  isLoading,
  onClose,
  onDownload,
  onPrint,
  onPay,
  formatAmount,
  formatDate,
  getStatusClass,
  getStatusLabel,
  downloadingPdf,
}) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>Détails de la facture {invoice.number || `#${invoice.id}`}</h3>
        <button className="modal-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {isLoading ? (
        <div className="modal-body">
          <UnifiedLoadingSpinner text="Chargement des détails..." />
        </div>
      ) : (
        <div className="modal-body">
          <div className="invoice-status-banner">
            <span className={getStatusClass(invoice.status)}>
              {getStatusLabel(invoice.status)}
            </span>
            {invoice.status === "paid" && invoice.payment_date && (
              <div className="payment-info">
                Payée le {formatDate(invoice.payment_date)}
                {invoice.payment_method && ` par ${invoice.payment_method}`}
              </div>
            )}
          </div>

          <div className="invoice-details-grid">
            <div className="invoice-info-card">
              <h4>Informations générales</h4>
              <div className="detail-row">
                <span className="detail-label">Numéro de facture:</span>
                <span className="detail-value">{invoice.number || `#${invoice.id}`}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date d'émission:</span>
                <span className="detail-value">{formatDate(invoice.date)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date d'échéance:</span>
                <span className="detail-value">{formatDate(invoice.due_date)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Montant total:</span>
                <span className="detail-value">{formatAmount(invoice.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Détails des prestations */}
          {invoice.items && invoice.items.length > 0 && (
            <InvoiceItemsTable items={invoice.items} formatAmount={formatAmount} />
          )}

          {invoice.notes && (
            <div className="invoice-notes">
              <h4>Notes</h4>
              <p>{invoice.notes}</p>
            </div>
          )}

          <div className="detail-actions">
            <button
              className="btn-outline"
              onClick={onDownload}
              disabled={downloadingPdf === invoice.id}
            >
              {downloadingPdf === invoice.id ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Génération...
                </>
              ) : (
                <>
                  <i className="fas fa-file-pdf"></i> Télécharger PDF
                </>
              )}
            </button>

            <button className="btn-outline" onClick={onPrint}>
              <i className="fas fa-print"></i> Imprimer
            </button>

            {(invoice.status === "unpaid" || invoice.status === "pending") && (
              <button className="btn-primary" onClick={onPay}>
                <i className="fas fa-credit-card"></i> Payer maintenant
              </button>
            )}

            <button className="btn-secondary" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
));

// Composant pour le tableau des items de facture
const InvoiceItemsTable = React.memo(({ items, formatAmount }) => (
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
        {items.map((item, index) => (
          <tr key={index}>
            <td>{item.description}</td>
            <td>{item.quantity}</td>
            <td>{formatAmount(item.unit_price)}</td>
            <td>{formatAmount(item.quantity * item.unit_price)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
));

// Composant Modal pour le paiement
const PaymentModal = React.memo(({
  invoice,
  paymentData,
  setPaymentData,
  paymentProcessing,
  paymentError,
  paymentSuccess,
  onProcess,
  onClose,
  formatAmount,
  formatDate,
}) => (
  <div className="modal-overlay" onClick={paymentProcessing ? null : onClose}>
    <div className="modal-content modal-content-medium" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>Paiement de la facture {invoice.number || `#${invoice.id}`}</h3>
        {!paymentProcessing && (
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      <div className="modal-body">
        <div className="payment-summary">
          <h4>Récapitulatif</h4>
          <div className="detail-row">
            <span className="detail-label">Numéro de facture:</span>
            <span className="detail-value">{invoice.number || `#${invoice.id}`}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Date d'émission:</span>
            <span className="detail-value">{formatDate(invoice.date)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Montant à payer:</span>
            <span className="detail-value payment-amount">
              {formatAmount(invoice.total_amount)}
            </span>
          </div>
        </div>

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

        {paymentProcessing && (
          <div className="payment-processing">
            <UnifiedLoadingSpinner text="Traitement du paiement en cours..." />
          </div>
        )}

        {!paymentSuccess && !paymentProcessing && (
          <PaymentForm
            paymentData={paymentData}
            setPaymentData={setPaymentData}
            onSubmit={onProcess}
            onCancel={onClose}
            invoice={invoice}
            formatAmount={formatAmount}
          />
        )}

        <div className="payment-security">
          <i className="fas fa-shield-alt"></i>
          <p>Paiement sécurisé - Vos données sont chiffrées et sécurisées.</p>
        </div>
      </div>
    </div>
  </div>
));

// Composant formulaire de paiement
const PaymentForm = React.memo(({
  paymentData,
  setPaymentData,
  onSubmit,
  onCancel,
  invoice,
  formatAmount,
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={onSubmit} className="payment-form">
      <h4>Informations de paiement</h4>

      <div className="form-group">
        <label htmlFor="payment_method">Méthode de paiement</label>
        <select
          id="payment_method"
          name="payment_method"
          value={paymentData.payment_method}
          onChange={handleInputChange}
          required
        >
          <option value="card">Carte bancaire</option>
          <option value="transfer">Virement bancaire</option>
        </select>
      </div>

      {paymentData.payment_method === "card" && (
        <CardPaymentFields paymentData={paymentData} onChange={handleInputChange} />
      )}

      {paymentData.payment_method === "transfer" && (
        <TransferPaymentInfo invoice={invoice} />
      )}

      <div className="payment-actions">
        {paymentData.payment_method === "card" ? (
          <button type="submit" className="btn-primary">
            <i className="fas fa-lock"></i> Payer {formatAmount(invoice.total_amount)}
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={onSubmit}>
            J'ai effectué le virement
          </button>
        )}

        <button type="button" className="btn-secondary" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
});

// Composant pour les champs de carte bancaire
const CardPaymentFields = React.memo(({ paymentData, onChange }) => (
  <>
    <div className="form-group">
      <label htmlFor="name_on_card">Nom sur la carte</label>
      <input
        type="text"
        id="name_on_card"
        name="name_on_card"
        value={paymentData.name_on_card}
        onChange={onChange}
        placeholder="Nom sur la carte"
        required
      />
    </div>

    <div className="form-group">
      <label htmlFor="card_number">Numéro de carte</label>
      <input
        type="text"
        id="card_number"
        name="card_number"
        value={paymentData.card_number}
        onChange={onChange}
        placeholder="1234 5678 9012 3456"
        maxLength="19"
        required
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
          onChange={onChange}
          placeholder="MM/AA"
          maxLength="5"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="cvv">CVV</label>
        <input
          type="text"
          id="cvv"
          name="cvv"
          value={paymentData.cvv}
          onChange={onChange}
          placeholder="123"
          maxLength="4"
          required
        />
      </div>
    </div>
  </>
));

// Composant pour les informations de virement
const TransferPaymentInfo = React.memo(({ invoice }) => (
  <div className="transfer-info">
    <p>Pour effectuer un virement bancaire, utilisez les informations suivantes:</p>
    <div className="detail-row">
      <span className="detail-label">Bénéficiaire:</span>
      <span className="detail-value">Centre Médical</span>
    </div>
    <div className="detail-row">
      <span className="detail-label">IBAN:</span>
      <span className="detail-value">FR76 1234 5678 9012 3456 7890 123</span>
    </div>
    <div className="detail-row">
      <span className="detail-label">BIC:</span>
      <span className="detail-value">ABCDEFGH</span>
    </div>
    <div className="detail-row">
      <span className="detail-label">Référence:</span>
      <span className="detail-value">{invoice.number || `FAC-${invoice.id}`}</span>
    </div>
    <p className="transfer-note">
      Veuillez noter que le paiement sera validé une fois que nous aurons reçu la
      confirmation de votre banque.
    </p>
  </div>
));

export default Invoices;