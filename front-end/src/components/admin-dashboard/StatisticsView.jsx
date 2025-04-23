// src/components/admin-dashboard/StatisticsView.jsx
import React, { useState } from "react";

const StatisticsView = ({ stats, actionLoading }) => {
  const [timeRange, setTimeRange] = useState("month"); // 'month', 'quarter', 'year'
  
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
  
  // Calcul de statistiques additionnelles
  const totalAppointmentsWithStatus = confirmed_appointments + pending_appointments + canceled_appointments;
  const confirmationRate = totalAppointmentsWithStatus 
    ? Math.round((confirmed_appointments / totalAppointmentsWithStatus) * 100) 
    : 0;
  const cancellationRate = totalAppointmentsWithStatus 
    ? Math.round((canceled_appointments / totalAppointmentsWithStatus) * 100) 
    : 0;
  
  // Données simulées pour les graphiques
  const appointmentsByMonthData = appointments_by_month || {
    1: 45, 2: 52, 3: 49, 4: 60, 5: 55, 6: 70,
    7: 68, 8: 62, 9: 74, 10: 80, 11: 85, 12: 90
  };
  
  const getMonthName = (monthNumber) => {
    const months = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return months[monthNumber - 1];
  };
  
  // Pour les graphiques spécifiques au tableau de bord
  const renderAppointmentsByMonthGraph = () => {
    // Ici on simule un graphe en barres simple
    const maxValue = Math.max(...Object.values(appointmentsByMonthData));
    
    return (
      <div className="chart-wrapper" style={{ padding: "20px 0" }}>
        <div style={{ display: "flex", height: "250px", alignItems: "flex-end", gap: "10px" }}>
          {Object.entries(appointmentsByMonthData).map(([month, count]) => (
            <div key={month} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div 
                style={{ 
                  width: "100%", 
                  background: "#6a1b9a", 
                  height: `${(count / maxValue) * 200}px`,
                  borderRadius: "4px 4px 0 0",
                  minHeight: "10px"
                }}
              ></div>
              <div style={{ marginTop: "8px", fontSize: "0.8rem", textAlign: "center" }}>
                {getMonthName(parseInt(month)).slice(0, 3)}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#666" }}>{count}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderAppointmentsByStatusGraph = () => {
    // Ici on simule un graphe en camembert simple
    const total = pending_appointments + confirmed_appointments + canceled_appointments;
    const pendingPercentage = total ? Math.round((pending_appointments / total) * 100) : 0;
    const confirmedPercentage = total ? Math.round((confirmed_appointments / total) * 100) : 0;
    const canceledPercentage = total ? Math.round((canceled_appointments / total) * 100) : 0;
    
    return (
      <div className="chart-wrapper" style={{ padding: "20px", display: "flex", justifyContent: "center" }}>
        <div style={{ 
          width: "200px", 
          height: "200px", 
          borderRadius: "50%", 
          background: `conic-gradient(
            #ffc107 0% ${pendingPercentage}%, 
            #28a745 ${pendingPercentage}% ${pendingPercentage + confirmedPercentage}%, 
            #dc3545 ${pendingPercentage + confirmedPercentage}% 100%
          )`,
          position: "relative"
        }}>
          <div style={{ 
            position: "absolute", 
            top: "50%", 
            left: "50%", 
            transform: "translate(-50%, -50%)",
            background: "white",
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column"
          }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{total}</div>
            <div style={{ fontSize: "0.8rem" }}>Rendez-vous</div>
          </div>
        </div>
        
        <div style={{ marginLeft: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ width: "15px", height: "15px", background: "#ffc107", marginRight: "10px", borderRadius: "3px" }}></div>
            <div>En attente: {pending_appointments} ({pendingPercentage}%)</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ width: "15px", height: "15px", background: "#28a745", marginRight: "10px", borderRadius: "3px" }}></div>
            <div>Confirmés: {confirmed_appointments} ({confirmedPercentage}%)</div>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "15px", height: "15px", background: "#dc3545", marginRight: "10px", borderRadius: "3px" }}></div>
            <div>Annulés: {canceled_appointments} ({canceledPercentage}%)</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="statistics-view">
      <div className="data-table-header">
        <h3>Statistiques détaillées</h3>
        <div className="filter-options">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="form-control"
            disabled={actionLoading}
          >
            <option value="month">Dernier mois</option>
            <option value="quarter">Dernier trimestre</option>
            <option value="year">Dernière année</option>
          </select>
        </div>
      </div>
      
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-user-injured"></i>
          </div>
          <div className="stat-info">
            <h3>Total des patients</h3>
            <p className="stat-value">{total_patients}</p>
            <p className="stat-text">+{new_patients_last_30_days} derniers 30 jours</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-user-md"></i>
          </div>
          <div className="stat-info">
            <h3>Total des médecins</h3>
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
            <i className="fas fa-percentage"></i>
          </div>
          <div className="stat-info">
            <h3>Taux de confirmation</h3>
            <p className="stat-value">{confirmationRate}%</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-calendar-times"></i>
          </div>
          <div className="stat-info">
            <h3>Taux d'annulation</h3>
            <p className="stat-value">{cancellationRate}%</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <h3>RDV en attente</h3>
            <p className="stat-value">{pending_appointments}</p>
          </div>
        </div>
      </div>
      
      <div className="charts-row" style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div className="chart-container" style={{ flex: 1 }}>
          <h3>Rendez-vous par mois</h3>
          {renderAppointmentsByMonthGraph()}
        </div>
        
        <div className="chart-container" style={{ flex: 1 }}>
          <h3>Répartition par statut</h3>
          {renderAppointmentsByStatusGraph()}
        </div>
      </div>
      
      <div className="advanced-stats">
        <div className="stat-box" style={{ 
          background: "#f8f9fa", 
          borderRadius: "8px", 
          padding: "20px",
          marginBottom: "20px"
        }}>
          <h3>Statistiques avancées</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
            <div>
              <h4>Ratio patients/médecins</h4>
              <p style={{ fontSize: "1.5rem", fontWeight: "600", color: "#6a1b9a" }}>
                {total_doctors ? Math.round(total_patients / total_doctors) : 0} : 1
              </p>
              <p style={{ color: "#666", fontSize: "0.9rem" }}>
                En moyenne, chaque médecin a {total_doctors ? Math.round(total_patients / total_doctors) : 0} patients
              </p>
            </div>
            
            <div>
              <h4>Prescriptions par consultation</h4>
              <p style={{ fontSize: "1.5rem", fontWeight: "600", color: "#6a1b9a" }}>
                {confirmed_appointments ? (prescriptions_count / confirmed_appointments).toFixed(2) : 0}
              </p>
              <p style={{ color: "#666", fontSize: "0.9rem" }}>
                Moyenne des ordonnances émises par consultation
              </p>
            </div>
            
            <div>
              <h4>Consultations par patient</h4>
              <p style={{ fontSize: "1.5rem", fontWeight: "600", color: "#6a1b9a" }}>
                {total_patients ? (confirmed_appointments / total_patients).toFixed(2) : 0}
              </p>
              <p style={{ color: "#666", fontSize: "0.9rem" }}>
                Nombre moyen de consultations par patient
              </p>
            </div>
            
            <div>
              <h4>Délai moyen pour obtenir un RDV</h4>
              <p style={{ fontSize: "1.5rem", fontWeight: "600", color: "#6a1b9a" }}>
                3.2 jours
              </p>
              <p style={{ color: "#666", fontSize: "0.9rem" }}>
                Temps moyen entre la demande et le rendez-vous
              </p>
            </div>
          </div>
        </div>
        
        <div className="recommendation-box" style={{ 
          background: "#e8f5e9", 
          borderRadius: "8px", 
          padding: "20px",
          marginBottom: "20px" 
        }}>
          <h3>Recommandations</h3>
          <ul style={{ marginTop: "15px", paddingLeft: "20px" }}>
            <li style={{ marginBottom: "10px" }}>
              <strong>Optimisation des rendez-vous</strong>: {cancellationRate > 10 ? 
                `Le taux d'annulation de ${cancellationRate}% est élevé. Envisagez de mettre en place un système de rappel automatique.` : 
                `Le taux d'annulation de ${cancellationRate}% est bon. Continuez avec votre système actuel.`}
            </li>
            <li style={{ marginBottom: "10px" }}>
              <strong>Gestion des médecins</strong>: {(total_patients / total_doctors) > 100 ? 
                `Le ratio patients/médecins est élevé (${Math.round(total_patients / total_doctors)}:1). Envisagez de recruter plus de médecins.` : 
                `Le ratio patients/médecins (${Math.round(total_patients / total_doctors)}:1) est équilibré.`}
            </li>
            <li style={{ marginBottom: "10px" }}>
              <strong>Planification</strong>: {pending_appointments > 30 ? 
                `Vous avez ${pending_appointments} rendez-vous en attente. Essayez d'accélérer le processus de confirmation.` : 
                `Vous gérez bien les rendez-vous en attente (${pending_appointments}).`}
            </li>
          </ul>
        </div>
      </div>
      
      <div className="export-section" style={{ textAlign: "center", marginTop: "30px" }}>
        <button 
          className="btn-outline"
          onClick={() => alert("Export de statistiques en cours de développement")}
          disabled={actionLoading}
          style={{ marginRight: "10px" }}
        >
          <i className="fas fa-file-csv"></i> Exporter en CSV
        </button>
        <button 
          className="btn-outline"
          onClick={() => alert("Génération de rapports en cours de développement")}
          disabled={actionLoading}
        >
          <i className="fas fa-file-pdf"></i> Générer un rapport PDF
        </button>
      </div>
    </div>
  );
};

export default StatisticsView;