// src/components/admin-dashboard/AdminOverview.jsx - Version corrigée
import React, { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from "../../axios";

const AdminOverview = ({ stats, handleTabChange, actionLoading }) => {
  const [invoiceStats, setInvoiceStats] = useState({
    total_invoices: 0,
    paid_invoices: 0,
    unpaid_invoices: 0,
    total_revenue: 0,
    average_invoice_amount: 0,
    invoices_by_month: {},
    payment_methods: {}
  });
  const [loadingInvoiceStats, setLoadingInvoiceStats] = useState(true);
  const [invoiceStatsError, setInvoiceStatsError] = useState(null);

  // Extraire les statistiques ou utiliser des valeurs par défaut
  const {
    total_patients = 0,
    total_doctors = 0,
    total_appointments = 0,
    appointments_today = 0,
    pending_appointments = 0,
    confirmed_appointments = 0,
    canceled_appointments = 0,
    new_patients_last_30_days = 0,
    medical_records_count = 0,
    prescriptions_count = 0,
    appointments_by_month = {},
    appointments_by_status = {}
  } = stats || {};

  // Charger les statistiques de facturation au chargement du composant
  useEffect(() => {
    const fetchInvoiceStats = async () => {
      try {
        setLoadingInvoiceStats(true);
        setInvoiceStatsError(null);
        
        console.log("🔄 Chargement des statistiques de facturation...");
        
        const response = await axios.get("/api/admin/invoice-statistics", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        
        console.log("✅ Statistiques de facturation chargées:", response.data);
        setInvoiceStats(response.data);
        
      } catch (error) {
        console.error("❌ Erreur lors du chargement des statistiques de facturation:", error);
        
        // Gestion des différents types d'erreurs
        if (error.response?.status === 404) {
          console.warn("⚠️  Endpoint des statistiques de facturation non trouvé, utilisation de données par défaut");
          setInvoiceStatsError("Les statistiques de facturation ne sont pas encore disponibles");
        } else if (error.response?.status === 403) {
          setInvoiceStatsError("Accès non autorisé aux statistiques de facturation");
        } else {
          setInvoiceStatsError("Erreur lors du chargement des statistiques de facturation");
        }
        
        // Garder les statistiques par défaut en cas d'erreur
        
      } finally {
        setLoadingInvoiceStats(false);
      }
    };

    fetchInvoiceStats();
  }, []);

  // Transformer les données pour les graphiques
  const appointmentsByMonthData = Object.entries(appointments_by_month || {}).map(([month, count]) => ({
    name: getMonthName(parseInt(month)),
    value: count
  }));

  const appointmentsByStatusData = [
    { name: 'Confirmés', value: confirmed_appointments },
    { name: 'En attente', value: pending_appointments },
    { name: 'Annulés', value: canceled_appointments }
  ];

  // Transformer les données des factures pour les graphiques
  const invoicesByMonthData = Object.entries(invoiceStats.invoices_by_month || {}).map(([month, data]) => ({
    name: getMonthName(parseInt(month)),
    montant: data.amount || 0,
    nombre: data.count || 0
  }));

  const invoicesStatusData = [
    { name: 'Payées', value: invoiceStats.paid_invoices },
    { name: 'Non payées', value: invoiceStats.unpaid_invoices }
  ];

  const paymentMethodsData = Object.entries(invoiceStats.payment_methods || {}).map(([method, count]) => ({
    name: getPaymentMethodName(method),
    value: count
  }));

  // Couleurs pour les graphiques
  const COLORS = ['#28a745', '#ffc107', '#dc3545'];
  const INVOICE_COLORS = ['#4CAF50', '#F44336'];
  const PAYMENT_COLORS = ['#2196F3', '#FF9800', '#9C27B0', '#607D8B', '#795548'];

  // Obtenir le nom du mois
  function getMonthName(monthNumber) {
    const months = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return months[monthNumber - 1];
  }

  // Obtenir le nom de la méthode de paiement
  function getPaymentMethodName(code) {
    const methods = {
      'card': 'Carte bancaire',
      'cash': 'Espèces',
      'transfer': 'Virement',
      'check': 'Chèque',
      'insurance': 'Assurance'
    };
    return methods[code] || code;
  }

  // Formater les montants en euros
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="overview-container">
      <div className="welcome-message">
        <h2>Bienvenue sur le tableau de bord administrateur</h2>
        <p>Gérez la clinique, les patients, les médecins et les rendez-vous</p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-user-injured"></i>
          </div>
          <div className="stat-info">
            <h3>Patients</h3>
            <p className="stat-value">{total_patients}</p>
            <p className="stat-text">+{new_patients_last_30_days} ces 30 derniers jours</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-user-md"></i>
          </div>
          <div className="stat-info">
            <h3>Médecins</h3>
            <p className="stat-value">{total_doctors}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-info">
            <h3>Rendez-vous</h3>
            <p className="stat-value">{total_appointments}</p>
            <p className="stat-text">{appointments_today} aujourd'hui</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-file-invoice-dollar"></i>
          </div>
          <div className="stat-info">
            <h3>Factures</h3>
            {loadingInvoiceStats ? (
              <p className="stat-value">...</p>
            ) : invoiceStatsError ? (
              <p className="stat-value">-</p>
            ) : (
              <>
                <p className="stat-value">{invoiceStats.total_invoices}</p>
                <p className="stat-text">{invoiceStats.unpaid_invoices} en attente</p>
              </>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="stat-info">
            <h3>Revenus</h3>
            {loadingInvoiceStats ? (
              <p className="stat-value">...</p>
            ) : invoiceStatsError ? (
              <p className="stat-value">-</p>
            ) : (
              <p className="stat-value">{formatCurrency(invoiceStats.total_revenue)}</p>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-prescription"></i>
          </div>
          <div className="stat-info">
            <h3>Ordonnances</h3>
            <p className="stat-value">{prescriptions_count}</p>
          </div>
        </div>
      </div>

      {/* Section des statistiques détaillées */}
      <div className="detailed-statistics">
        <h3>Statistiques détaillées</h3>
        
        <div className="statistics-grid">
          {/* Graphique des rendez-vous par mois */}
          <div className="chart-container">
            <h4>Rendez-vous par mois</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentsByMonthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#6a1b9a" name="Nombre de rendez-vous" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Graphique de la répartition des rendez-vous par statut */}
          <div className="chart-container">
            <h4>Répartition des rendez-vous par statut</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentsByStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                >
                  {appointmentsByStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Section des statistiques de facturation */}
        <div className="finance-statistics">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3>Statistiques financières</h3>
            {invoiceStatsError && (
              <div style={{ 
                padding: '8px 12px', 
                backgroundColor: '#fff3cd', 
                color: '#856404', 
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}>
                ⚠️ {invoiceStatsError}
              </div>
            )}
          </div>
          
          {loadingInvoiceStats ? (
            <div className="loading-indicator">Chargement des statistiques financières...</div>
          ) : invoiceStatsError ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
              <p>Les statistiques financières ne sont pas disponibles pour le moment.</p>
              <p>Vérifiez que le module de facturation est correctement configuré.</p>
            </div>
          ) : (
            <div className="statistics-grid">
              {/* Graphique des factures par mois (montant) */}
              <div className="chart-container">
                <h4>Montant des factures par mois</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={invoicesByMonthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="montant" fill="#1976d2" name="Montant total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Graphique des factures par mois (nombre) */}
              <div className="chart-container">
                <h4>Nombre de factures par mois</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={invoicesByMonthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="nombre" fill="#ff9800" name="Nombre de factures" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Graphique des factures par statut */}
              {(invoiceStats.paid_invoices > 0 || invoiceStats.unpaid_invoices > 0) && (
                <div className="chart-container">
                  <h4>Statut des factures</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={invoicesStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {invoicesStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={INVOICE_COLORS[index % INVOICE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {/* Graphique des méthodes de paiement */}
              {paymentMethodsData.length > 0 && (
                <div className="chart-container">
                  <h4>Méthodes de paiement</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethodsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {paymentMethodsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Métriques avancées */}
        <div className="advanced-metrics">
          <h4>Métriques avancées</h4>
          
          <div className="metrics-grid">
            <div className="metric-card">
              <h5>Taux de conversion des rendez-vous</h5>
              <p className="metric-value">
                {total_appointments > 0 
                  ? `${Math.round((confirmed_appointments / total_appointments) * 100)}%` 
                  : '0%'}
              </p>
              <p className="metric-description">
                Pourcentage de rendez-vous confirmés sur le total
              </p>
            </div>
            
            <div className="metric-card">
              <h5>Revenu moyen par patient</h5>
              <p className="metric-value">
                {total_patients > 0 && !loadingInvoiceStats && !invoiceStatsError
                  ? formatCurrency(invoiceStats.total_revenue / total_patients) 
                  : formatCurrency(0)}
              </p>
              <p className="metric-description">
                Montant moyen généré par patient
              </p>
            </div>
            
            <div className="metric-card">
              <h5>Montant moyen des factures</h5>
              <p className="metric-value">
                {!loadingInvoiceStats && !invoiceStatsError
                  ? formatCurrency(invoiceStats.average_invoice_amount)
                  : formatCurrency(0)}
              </p>
              <p className="metric-description">
                Montant moyen par facture
              </p>
            </div>
            
            <div className="metric-card">
              <h5>Taux de paiement</h5>
              <p className="metric-value">
                {!loadingInvoiceStats && !invoiceStatsError && invoiceStats.total_invoices > 0 
                  ? `${Math.round((invoiceStats.paid_invoices / invoiceStats.total_invoices) * 100)}%` 
                  : '0%'}
              </p>
              <p className="metric-description">
                Pourcentage de factures payées
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Actions rapides</h3>
        <div className="action-buttons">
          <button className="action-btn" onClick={() => handleTabChange("patients")} disabled={actionLoading}>
            <i className="fas fa-user-plus"></i>
            Ajouter un patient
          </button>
          <button className="action-btn" onClick={() => handleTabChange("doctors")} disabled={actionLoading}>
            <i className="fas fa-user-md"></i>
            Ajouter un médecin
          </button>
          <button className="action-btn" onClick={() => handleTabChange("appointments")} disabled={actionLoading}>
            <i className="fas fa-calendar-plus"></i>
            Créer un rendez-vous
          </button>
          <button className="action-btn" onClick={() => handleTabChange("invoices")} disabled={actionLoading}>
            <i className="fas fa-file-invoice-dollar"></i>
            Gérer les factures
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;