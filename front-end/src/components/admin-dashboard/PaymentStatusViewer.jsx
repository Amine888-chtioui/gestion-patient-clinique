// src/components/admin-dashboard/PaymentStatusViewer.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";

const PaymentStatusViewer = () => {
  const [recentPayments, setRecentPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      // Dans une implémentation réelle, vous auriez un endpoint spécifique
      // Pour l'instant, nous utilisons les factures
      const response = await axios.get("/api/invoices", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      const invoices = response.data.data || [];
      
      // Filtrer les paiements récents (payés au cours des 30 derniers jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recent = invoices
        .filter(invoice => 
          invoice.status === 'paid' && 
          new Date(invoice.payment_date) >= thirtyDaysAgo
        )
        .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
        .slice(0, 10);
      
      // Filtrer les paiements en attente
      const pending = invoices
        .filter(invoice => invoice.status === 'unpaid')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 10);
      
      setRecentPayments(recent);
      setPendingPayments(pending);
    } catch (err) {
      console.error("Erreur lors de la récupération des données de paiement:", err);
      setError("Impossible de charger les données de paiement");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR"
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading-indicator">Chargement des données de paiement...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="payment-status-container">
      <div className="status-header">
        <h2>Statut des paiements</h2>
        <button className="btn-refresh" onClick={fetchPaymentData}>
          <i className="fas fa-sync-alt"></i> Actualiser
        </button>
      </div>

      <div className="payment-grid">
        <div className="status-card recent-payments">
          <h3>
            <i className="fas fa-check-circle"></i> Paiements récents
          </h3>
          {recentPayments.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Facture</th>
                    <th>Patient</th>
                    <th>Montant</th>
                    <th>Date de paiement</th>
                    <th>Méthode</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map(payment => (
                    <tr key={payment.id}>
                      <td>{payment.number}</td>
                      <td>{payment.patient?.name || "N/A"}</td>
                      <td>{formatCurrency(payment.total_amount)}</td>
                      <td>{formatDate(payment.payment_date)}</td>
                      <td>{payment.payment_method || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-message">Aucun paiement récent</div>
          )}
        </div>

        <div className="status-card pending-payments">
          <h3>
            <i className="fas fa-clock"></i> Paiements en attente
          </h3>
          {pendingPayments.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Facture</th>
                    <th>Patient</th>
                    <th>Montant</th>
                    <th>Échéance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map(payment => (
                    <tr key={payment.id} className={new Date(payment.due_date) < new Date() ? "overdue" : ""}>
                      <td>{payment.number}</td>
                      <td>{payment.patient?.name || "N/A"}</td>
                      <td>{formatCurrency(payment.total_amount)}</td>
                      <td>{formatDate(payment.due_date)}</td>
                      <td className="actions">
                        <button className="btn-icon" title="Voir les détails">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn-icon" title="Marquer comme payé">
                          <i className="fas fa-check"></i>
                        </button>
                        <button className="btn-icon" title="Envoyer un rappel">
                          <i className="fas fa-envelope"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-message">Aucun paiement en attente</div>
          )}
        </div>
      </div>
      
      <div className="payment-summary-boxes">
        <div className="summary-box total-revenue">
          <div className="summary-icon">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="summary-info">
            <h4>Revenus totaux</h4>
            <div className="summary-value">
              {formatCurrency(recentPayments.reduce((sum, payment) => sum + parseFloat(payment.total_amount), 0))}
            </div>
            <div className="summary-period">30 derniers jours</div>
          </div>
        </div>
        
        <div className="summary-box pending-amount">
          <div className="summary-icon">
            <i className="fas fa-hourglass-half"></i>
          </div>
          <div className="summary-info">
            <h4>Montant en attente</h4>
            <div className="summary-value">
              {formatCurrency(pendingPayments.reduce((sum, payment) => sum + parseFloat(payment.total_amount), 0))}
            </div>
            <div className="summary-period">Total des factures non payées</div>
          </div>
        </div>
        
        <div className="summary-box payment-completion">
          <div className="summary-icon">
            <i className="fas fa-chart-pie"></i>
          </div>
          <div className="summary-info">
            <h4>Taux de paiement</h4>
            <div className="summary-value">
              {recentPayments.length + pendingPayments.length > 0 
                ? Math.round((recentPayments.length / (recentPayments.length + pendingPayments.length)) * 100) 
                : 0}%
            </div>
            <div className="summary-period">Factures payées vs. en attente</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusViewer;