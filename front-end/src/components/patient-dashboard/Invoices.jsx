// src/components/patient-dashboard/Invoices.jsx - Version corrigée avec méthodes de paiement de la DB
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
  const [paymentMethods, setPaymentMethods] = useState([]); // NOUVEAU: Méthodes de paiement de la DB
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false); // NOUVEAU: État de chargement
  const [paymentData, setPaymentData] = useState({
    payment_method_id: "", // MODIFIÉ: Utiliser l'ID de la méthode
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

  // NOUVEAU: Fonction pour charger les méthodes de paiement depuis la DB
  const fetchPaymentMethods = useCallback(async () => {
    try {
      setLoadingPaymentMethods(true);
      console.log("🔄 Chargement des méthodes de paiement depuis la base de données...");
      
      const response = await apiClient.getPaymentMethods();
      const methods = response.payment_methods || [];
      
      setPaymentMethods(methods);
      console.log(`✅ ${methods.length} méthodes de paiement chargées:`, methods);
      
      // Sélectionner automatiquement la première méthode disponible
      if (methods.length > 0) {
        setPaymentData(prev => ({
          ...prev,
          payment_method_id: methods[0].id.toString()
        }));
      }
      
    } catch (err) {
      console.error("❌ Erreur lors du chargement des méthodes de paiement:", err);
      setPaymentMethods([]);
    } finally {
      setLoadingPaymentMethods(false);
    }
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

  // MODIFIÉ: Gestion du modal de paiement avec chargement des méthodes
  const handleOpenPaymentModal = useCallback(async (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
    setPaymentError(null);
    setPaymentSuccess(null);
    
    // Réinitialiser les données de paiement
    setPaymentData({
      payment_method_id: "",
      card_number: "",
      expiry_date: "",
      cvv: "",
      name_on_card: "",
    });

    // Charger les méthodes de paiement depuis la base de données
    await fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  // MODIFIÉ: Traitement du paiement avec l'ID de la méthode
  const handleProcessPayment = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!selectedInvoice) return;

    // Validation de base
    if (!paymentData.payment_method_id) {
      setPaymentError("Veuillez sélectionner une méthode de paiement");
      return;
    }

    // Trouver la méthode de paiement sélectionnée
    const selectedMethod = paymentMethods.find(m => m.id.toString() === paymentData.payment_method_id);
    if (!selectedMethod) {
      setPaymentError("Méthode de paiement invalide");
      return;
    }

    // Validation pour les cartes bancaires
    if (selectedMethod.code === 'card') {
      if (!paymentData.card_number || !paymentData.expiry_date || !paymentData.cvv || !paymentData.name_on_card) {
        setPaymentError("Veuillez remplir tous les champs de la carte bancaire");
        return;
      }
    }

    setPaymentProcessing(true);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      console.log("💳 Traitement du paiement avec la méthode:", selectedMethod.name);
      
      await apiClient.processPayment({
        invoice_id: selectedInvoice.id,
        payment_method_id: parseInt(paymentData.payment_method_id),
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
      setPaymentError(
        err.response?.data?.message || 
        "Une erreur s'est produite lors du traitement du paiement. Veuillez réessayer."
      );
      setPaymentProcessing(false);
    }
  }, [selectedInvoice, paymentData, paymentMethods, invoiceDetails, fetchInvoices]);

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
    setPaymentMethods([]); // Nettoyer les méthodes de paiement
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

      {/* MODIFIÉ: Modal de paiement avec méthodes dynamiques */}
      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          paymentData={paymentData}
          setPaymentData={setPaymentData}
          paymentMethods={paymentMethods}
          loadingPaymentMethods={loadingPaymentMethods}
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

// Composant Modal pour les détails de facture (inchangé)
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

// Composant pour le tableau des items de facture (inchangé)
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

// MODIFIÉ: Modal de paiement avec méthodes dynamiques
const PaymentModal = React.memo(({
  invoice,
  paymentData,
  setPaymentData,
  paymentMethods,
  loadingPaymentMethods,
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
            paymentMethods={paymentMethods}
            loadingPaymentMethods={loadingPaymentMethods}
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

// MODIFIÉ: Formulaire de paiement avec méthodes dynamiques
const PaymentForm = React.memo(({
  paymentData,
  setPaymentData,
  paymentMethods,
  loadingPaymentMethods,
  onSubmit,
  onCancel,
  invoice,
  formatAmount,
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  // Trouver la méthode de paiement sélectionnée
  const selectedMethod = paymentMethods.find(m => m.id.toString() === paymentData.payment_method_id);

  return (
    <form onSubmit={onSubmit} className="payment-form">
      <h4>Informations de paiement</h4>

      <div className="form-group">
        <label htmlFor="payment_method_id">Méthode de paiement</label>
        {loadingPaymentMethods ? (
          <div style={{ padding: '10px', textAlign: 'center' }}>
            <i className="fas fa-spinner fa-spin"></i> Chargement des méthodes de paiement...
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="no-payment-methods">
            <i className="fas fa-exclamation-triangle"></i>
            <p>Aucune méthode de paiement n'est disponible actuellement.</p>
            <p>Veuillez contacter l'administration.</p>
          </div>
        ) : (
          <select
            id="payment_method_id"
            name="payment_method_id"
            value={paymentData.payment_method_id}
            onChange={handleInputChange}
            required
          >
            <option value="">Sélectionner une méthode</option>
            {paymentMethods.map(method => (
              <option key={method.id} value={method.id}>
                {method.name}
                {method.description && ` - ${method.description}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Afficher les champs spécifiques selon la méthode sélectionnée */}
      {selectedMethod && selectedMethod.code === 'card' && (
        <CardPaymentFields paymentData={paymentData} onChange={handleInputChange} />
      )}

      {selectedMethod && selectedMethod.code === 'transfer' && (
        <TransferPaymentInfo invoice={invoice} />
      )}

      {paymentMethods.length > 0 && (
        <div className="payment-actions">
          {selectedMethod && selectedMethod.code === 'card' ? (
            <button type="submit" className="btn-primary">
              <i className="fas fa-lock"></i> Payer {formatAmount(invoice.total_amount)}
            </button>
          ) : selectedMethod && selectedMethod.code === 'transfer' ? (
            <button type="button" className="btn-primary" onClick={onSubmit}>
              J'ai effectué le virement
            </button>
          ) : selectedMethod ? (
            <button type="submit" className="btn-primary">
              <i className="fas fa-check"></i> Confirmer le paiement
            </button>
          ) : null}

          <button type="button" className="btn-secondary" onClick={onCancel}>
            Annuler
          </button>
        </div>
      )}
    </form>
  );
});

// Composant pour les champs de carte bancaire (inchangé)
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

// Composant pour les informations de virement (inchangé)
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