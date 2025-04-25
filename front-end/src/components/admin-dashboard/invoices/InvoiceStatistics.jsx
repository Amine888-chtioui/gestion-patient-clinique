// src/components/admin-dashboard/invoices/InvoiceStatistics.jsx
import React, { useState, useEffect } from "react";
import axios from "../../../axios";

const InvoiceStatistics = ({ actionLoading, setActionLoading, setActionError }) => {
  const [statistics, setStatistics] = useState({
    total_invoices: 0,
    paid_invoices: 0,
    unpaid_invoices: 0,
    overdue_invoices: 0,
    total_revenue: 0,
    current_month_revenue: 0,
    pending_amount: 0,
    monthly_revenue: [],
    revenue_by_type: []
  });
  
  // Récupérer les statistiques au chargement
  useEffect(() => {
    fetchStatistics();
  }, []);
  
  // Fonction pour récupérer les statistiques
  const fetchStatistics = async () => {
    try {
      setActionLoading(true);
      const response = await axios.get("/api/admin/invoice-statistics", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setStatistics(response.data.statistics || {});
      
    } catch (err) {
      console.error("Erreur lors de la récupération des statistiques:", err);
      setActionError("Impossible de charger les statistiques. Veuillez réessayer plus tard.");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Formater un montant en devise
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  
  // Fonction pour obtenir le pourcentage
  const getPercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };
  
  // Fonction pour obtenir la couleur en fonction du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#28a745'; // vert
      case 'unpaid':
        return '#ffc107'; // jaune
      case 'overdue':
        return '#dc3545'; // rouge
      default:
        return '#6c757d'; // gris
    }
  };
  
  // Fonction pour obtenir la couleur en fonction du type de service
  const getServiceColor = (type) => {
    switch (type) {
      case 'consultation':
        return '#007bff'; // bleu
      case 'medication':
        return '#17a2b8'; // cyan
      case 'test':
        return '#6f42c1'; // violet
      case 'procedure':
        return '#fd7e14'; // orange
      default:
        return '#6c757d'; // gris
    }
  };
  
  // Fonctions pour simuler les graphiques (dans une application réelle, utilisez une bibliothèque comme Chart.js ou Recharts)
  const renderMonthlyRevenueChart = () => {
    const maxRevenue = Math.max(...statistics.monthly_revenue.map(item => item.amount));
    
    return (
      <div className="chart-canvas">
        <div className="chart-bars">
          {statistics.monthly_revenue.map((item, index) => (
            <div key={index} className="chart-bar-container">
              <div 
                className="chart-bar"
                style={{ 
                  height: `${(item.amount / maxRevenue) * 100}%`,
                  backgroundColor: '#6a1b9a' // Couleur principale admin
                }}
                title={`${item.month}: ${formatCurrency(item.amount)}`}
              ></div>
              <div className="chart-label">{item.month.substring(0, 3)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderRevenueByTypeChart = () => {
    const total = statistics.revenue_by_type.reduce((acc, item) => acc + item.total, 0);
    
    return (
      <div className="chart-pie-container">
        <div className="chart-pie">
          <div 
            className="chart-pie-visualization"
            style={{
              background: statistics.revenue_by_type.length > 0 
                ? `conic-gradient(${statistics.revenue_by_type.map((item, index, arr) => {
                    const prevTotal = arr.slice(0, index).reduce((acc, curr) => acc + curr.total, 0);
                    const startPercentage = getPercentage(prevTotal, total);
                    const endPercentage = getPercentage(prevTotal + item.total, total);
                    return `${getServiceColor(item.type)} ${startPercentage}% ${endPercentage}%`;
                  }).join(', ')})`
                : '#f8f9fa'
            }}
          >
            <div className="chart-pie-center">
              <div className="chart-pie-value">{formatCurrency(total)}</div>
              <div className="chart-pie-label">Total</div>
            </div>
          </div>
        </div>
        <div className="chart-pie-legend">
          {statistics.revenue_by_type.map((item, index) => (
            <div key={index} className="chart-legend-item">
              <div 
                className="chart-legend-color" 
                style={{ backgroundColor: getServiceColor(item.type) }}
              ></div>
              <div className="chart-legend-label">{item.type}</div>
              <div className="chart-legend-value">{formatCurrency(item.total)}</div>
              <div className="chart-legend-percentage">
                {getPercentage(item.total, total)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderInvoiceStatusChart = () => {
    const total = statistics.total_invoices;
    const paid = statistics.paid_invoices;
    const unpaid = statistics.unpaid_invoices - statistics.overdue_invoices;
    const overdue = statistics.overdue_invoices;
    
    const paidPercentage = getPercentage(paid, total);
    const unpaidPercentage = getPercentage(unpaid, total);
    const overduePercentage = getPercentage(overdue, total);
    
    return (
      <div className="chart-pie-container">
        <div className="chart-pie">
          <div 
            className="chart-pie-visualization"
            style={{
              background: `conic-gradient(
                ${getStatusColor('paid')} 0% ${paidPercentage}%, 
                ${getStatusColor('unpaid')} ${paidPercentage}% ${paidPercentage + unpaidPercentage}%, 
                ${getStatusColor('overdue')} ${paidPercentage + unpaidPercentage}% 100%
              )`
            }}
          >
            <div className="chart-pie-center">
              <div className="chart-pie-value">{total}</div>
              <div className="chart-pie-label">Total</div>
            </div>
          </div>
        </div>
        <div className="chart-pie-legend">
          <div className="chart-legend-item">
            <div 
              className="chart-legend-color" 
              style={{ backgroundColor: getStatusColor('paid') }}
            ></div>
            <div className="chart-legend-label">Payées</div>
            <div className="chart-legend-value">{paid}</div>
            <div className="chart-legend-percentage">{paidPercentage}%</div>
          </div>
          <div className="chart-legend-item">
            <div 
              className="chart-legend-color" 
              style={{ backgroundColor: getStatusColor('unpaid') }}
            ></div>
            <div className="chart-legend-label">Non payées</div>
            <div className="chart-legend-value">{unpaid}</div>
            <div className="chart-legend-percentage">{unpaidPercentage}%</div>
          </div>
          <div className="chart-legend-item">
            <div 
              className="chart-legend-color" 
              style={{ backgroundColor: getStatusColor('overdue') }}
            ></div>
            <div className="chart-legend-label">En retard</div>
            <div className="chart-legend-value">{overdue}</div>
            <div className="chart-legend-percentage">{overduePercentage}%</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="invoice-statistics-container">
      <div className="statistics-header">
        <h2>Statistiques financières</h2>
        <button 
          className="btn-outline"
          onClick={fetchStatistics}
          disabled={actionLoading}
        >
          <i className="fas fa-sync-alt"></i> Actualiser
        </button>
      </div>
      
      <div className="statistics-summary">
        <div className="stat-card total-revenue">
          <div className="stat-icon">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(statistics.total_revenue)}</h3>
            <p>Revenu total</p>
          </div>
        </div>
        
        <div className="stat-card monthly-revenue">
          <div className="stat-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(statistics.current_month_revenue)}</h3>
            <p>Revenu du mois</p>
          </div>
        </div>
        
        <div className="stat-card pending-amount">
          <div className="stat-icon">
            <i className="fas fa-hourglass-half"></i>
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(statistics.pending_amount)}</h3>
            <p>Montant en attente</p>
          </div>
        </div>
        
        <div className="stat-card invoices-count">
          <div className="stat-icon">
            <i className="fas fa-file-invoice"></i>
          </div>
          <div className="stat-content">
            <h3>{statistics.total_invoices}</h3>
            <p>Factures totales</p>
          </div>
        </div>
      </div>
      
      <div className="statistics-charts">
        <div className="chart-container">
          <h3>Revenus mensuels</h3>
          {renderMonthlyRevenueChart()}
        </div>
        
        <div className="chart-container">
          <h3>Répartition des factures</h3>
          {renderInvoiceStatusChart()}
        </div>
      </div>
      
      <div className="statistics-charts">
        <div className="chart-container full-width">
          <h3>Revenus par type de service</h3>
          {renderRevenueByTypeChart()}
        </div>
      </div>
      
      <div className="analytics-insights">
        <h3>Analyse et recommandations</h3>
        
        <div className="insight-cards">
          <div className="insight-card">
            <div className="insight-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="insight-content">
              <h4>Tendance des revenus</h4>
              <p>{statistics.monthly_revenue && statistics.monthly_revenue.length >= 2 && statistics.monthly_revenue[statistics.monthly_revenue.length - 1].amount > statistics.monthly_revenue[statistics.monthly_revenue.length - 2].amount 
                ? "Les revenus sont en hausse par rapport au mois précédent." 
                : "Les revenus sont en baisse par rapport au mois précédent."}</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="insight-content">
              <h4>Factures en retard</h4>
              <p>{statistics.overdue_invoices > 0 
                ? `Il y a ${statistics.overdue_invoices} factures en retard de paiement pour un montant total d'environ ${formatCurrency(statistics.pending_amount * (statistics.overdue_invoices / statistics.unpaid_invoices))}.` 
                : "Aucune facture en retard de paiement. Excellent travail !"}</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">
              <i className="fas fa-lightbulb"></i>
            </div>
            <div className="insight-content">
              <h4>Recommandation</h4>
              <p>{statistics.overdue_invoices > 5 
                ? "Envisagez de mettre en place un système de relance automatique pour les factures en retard." 
                : statistics.revenue_by_type.length > 0 && statistics.revenue_by_type[0].type === 'consultation'
                  ? "Les consultations représentent la majeure partie de vos revenus. Pensez à diversifier vos services." 
                  : "Votre répartition des revenus semble bien équilibrée."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceStatistics;