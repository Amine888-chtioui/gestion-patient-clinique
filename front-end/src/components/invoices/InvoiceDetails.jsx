// src/components/invoices/InvoiceDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../axios";

const InvoiceDetails = () => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_method: "card",
    payment_date: new Date().toISOString().split("T")[0],
  });

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setInvoice(response.data.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des détails de la facture:", err);
      setError("Impossible de charger les détails de la facture. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoice = () => {
    navigate(`/invoices/edit/${id}`);
  };

  const handleDeleteInvoice = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) return;

    try {
      await axios.delete(`/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      navigate("/invoices");
    } catch (err) {
      console.error("Erreur lors de la suppression de la facture:", err);
      alert("Impossible de supprimer la facture. " + (err.response?.data?.message || "Veuillez réessayer plus tard."));
    }
  };

  const handlePaymentChange = (e) => {
    setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
  };

  const handlePayInvoice = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `/api/invoices/${id}/pay`,
        paymentData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setShowPaymentModal(false);
      fetchInvoiceDetails(); // Rafraîchir les données
    } catch (err) {
      console.error("Erreur lors du paiement de la facture:", err);
      alert("Impossible de marquer la facture comme payée. " + (err.response?.data?.message || "Veuillez réessayer plus tard."));
    }
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
      pending: "En attente",
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
        return "status-badge-success";
      case "pending":
        return "status-badge-warning";
      case "cancelled":
        return "status-badge-danger";
      case "overdue":
        return "status-badge-danger";
      default:
        return "status-badge-secondary";
    }
  };

  // Traduction des méthodes de paiement
  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: "Espèces",
      card: "Carte bancaire",
      transfer: "Virement bancaire",
      check: "Chèque",
      insurance: "Assurance",
    };
    return methods[method] || method;
  };

  if (loading) return <div className="loading-spinner">Chargement...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!invoice) return <div className="error-message">Facture non trouvée</div>;

  return (
    <div className="invoice-details-container">
      <div className="details-header">
        <button className="btn-secondary" onClick={() => navigate("/invoices")}>
          <i className="fas fa-arrow-left"></i> Retour
        </button>
        <h2>Facture {invoice.number}</h2>
        <div className="header-actions">
          {invoice.status !== "paid" && (
            <>
              <button className="btn-success" onClick={() => setShowPaymentModal(true)}>
                <i className="fas fa-check-circle"></i> Marquer comme payée
              </button>
              <button className="btn-primary" onClick={handleEditInvoice}>
                <i className="fas fa-edit"></i> Modifier
              </button>
              <button className="btn-danger" onClick={handleDeleteInvoice}>
                <i className="fas fa-trash-alt"></i> Supprimer
              </button>
            </>
          )}
          <button className="btn-outline" onClick={() => window.print()}>
            <i className="fas fa-print"></i> Imprimer
          </button>
        </div>
      </div>

      <div className="invoice-status">
        <span className={`status-badge ${getStatusClass(invoice.status)}`}>
          {getStatusLabel(invoice.status)}
        </span>
        {invoice.status === "paid" && invoice.payment_date && (
          <div className="payment-info">
            Payée le {new Date(invoice.payment_date).toLocaleDateString()} par {getPaymentMethodLabel(invoice.payment_method)}
          </div>
        )}
      </div>

      <div className="invoice-info-grid">
        <div className="invoice-info-card">
          <h3>Informations</h3>
          <div className="info-group">
            <div className="info-row">
              <span className="info-label">Numéro de facture:</span>
              <span className="info-value">{invoice.number}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Date:</span>
              <span className="info-value">{new Date(invoice.date).toLocaleDateString()}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Échéance:</span>
              <span className="info-value">{new Date(invoice.due_date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="invoice-info-card">
          <h3>Patient</h3>
          {invoice.patient ? (
            <div className="info-group">
              <div className="info-row">
                <span className="info-label">Nom:</span>
                <span className="info-value">{invoice.patient.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{invoice.patient.email}</span>
              </div>
            </div>
          ) : (
            <p>Information patient non disponible</p>
          )}
        </div>
      </div>

      <div className="invoice-items-container">
        <h3>Détail des prestations</h3>
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
              invoice.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unit_price)}</td>
                  <td>{formatCurrency(item.total_price)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-items">Aucun élément</td>
              </tr>
            )}
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

      {invoice.notes && (
        <div className="invoice-notes">
          <h3>Notes</h3>
          <p>{invoice.notes}</p>
        </div>
      )}

      {/* Modal de paiement */}
      {showPaymentModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Marquer comme payée</h3>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handlePayInvoice}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="payment_method">Méthode de paiement</label>
                  <select
                    id="payment_method"
                    name="payment_method"
                    value={paymentData.payment_method}
                    onChange={handlePaymentChange}
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
                    name="payment_date"
                    value={paymentData.payment_date}
                    onChange={handlePaymentChange}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn-success">
                  <i className="fas fa-check"></i> Confirmer le paiement
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetails;