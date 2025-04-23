// src/components/admin-dashboard/StatisticsView.jsx
import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const StatisticsView = ({ stats, actionLoading }) => {
  const [timeFrame, setTimeFrame] = useState("month");
  const [chartType, setChartType] = useState("appointments");

  // Couleurs pour les graphiques
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A52A2A', '#8884d8', '#ffc658'];

  // Données pour le graphique des rendez-vous par jour
  const appointmentsData = stats.appointmentsByDate || [];

  // Données pour le graphique des patients par médecin
  const patientsByDoctorData = stats.patientsByDoctor || [];

  // Données pour le graphique des rendez-vous par statut
  const appointmentsByStatusData = stats.appointmentsByStatus || [];

  // Données pour le graphique des visites par spécialité
  const visitsBySpecialtyData = stats.visitsBySpecialty || [];

  return (
    <div className="statistics-view">
      <div className="panel-header">
        <h2>Statistiques</h2>
        <div className="panel-actions">
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className="time-frame-select"
            disabled={actionLoading}
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
        </div>
      </div>

      <div className="stats-summary">
        <div className="stat-box">
          <div className="stat-icon">
            <i className="fas fa-user-injured"></i>
          </div>
          <div className="stat-content">
            <h3>Patients</h3>
            <div className="stat-numbers">
              <div className="stat-main">
                <span className="stat-value">{stats.totalPatients || 0}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-secondary">
                <span className="stat-trend positive">
                  <i className="fas fa-arrow-up"></i> {stats.newPatientsThisMonth || 0}
                </span>
                <span className="stat-trend-label">Nouveaux ce mois</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon">
            <i className="fas fa-user-md"></i>
          </div>
          <div className="stat-content">
            <h3>Médecins</h3>
            <div className="stat-numbers">
              <div className="stat-main">
                <span className="stat-value">{stats.totalDoctors || 0}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-secondary">
                <span className="stat-info">{stats.topSpecialty || "N/A"}</span>
                <span className="stat-info-label">Spécialité principale</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-content">
            <h3>Rendez-vous</h3>
            <div className="stat-numbers">
              <div className="stat-main">
                <span className="stat-value">{stats.appointmentsThisMonth || 0}</span>
                <span className="stat-label">Ce mois</span>
              </div>
              <div className="stat-secondary">
                <span className="stat-trend positive">
                  <i className="fas fa-arrow-up"></i> {stats.appointmentsIncrease || 0}%
                </span>
                <span className="stat-trend-label">vs mois précédent</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon">
            <i className="fas fa-file-medical"></i>
          </div>
          <div className="stat-content">
            <h3>Dossiers médicaux</h3>
            <div className="stat-numbers">
              <div className="stat-main">
                <span className="stat-value">{stats.totalRecords || 0}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-secondary">
                <span className="stat-info">{stats.recordsThisMonth || 0}</span>
                <span className="stat-info-label">Ce mois</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-selector">
        <button
          className={`chart-option ${chartType === 'appointments' ? 'active' : ''}`}
          onClick={() => setChartType('appointments')}
          disabled={actionLoading}
        >
          <i className="fas fa-calendar-alt"></i> Rendez-vous
        </button>
        <button
          className={`chart-option ${chartType === 'patients' ? 'active' : ''}`}
          onClick={() => setChartType('patients')}
          disabled={actionLoading}
        >
          <i className="fas fa-user-injured"></i> Patients
        </button>
        <button
          className={`chart-option ${chartType === 'status' ? 'active' : ''}`}
          onClick={() => setChartType('status')}
          disabled={actionLoading}
        >
          <i className="fas fa-tasks"></i> Statuts
        </button>
        <button
          className={`chart-option ${chartType === 'specialty' ? 'active' : ''}`}
          onClick={() => setChartType('specialty')}
          disabled={actionLoading}
        >
          <i className="fas fa-stethoscope"></i> Spécialités
        </button>
      </div>

      <div className="charts-container">
        {chartType === 'appointments' && (
          <div className="chart-panel">
            <h3>Rendez-vous par jour</h3>
            <div className="chart-container">
              {appointmentsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={appointmentsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#2a8d8e" name="Nombre de rendez-vous" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-chart">
                  <i className="fas fa-chart-line"></i>
                  <p>Aucune donnée disponible pour ce graphique</p>
                </div>
              )}
            </div>
          </div>
        )}

        {chartType === 'patients' && (
          <div className="chart-panel">
            <h3>Patients par médecin</h3>
            <div className="chart-container">
              {patientsByDoctorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={patientsByDoctorData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="doctor_name" angle={-45} textAnchor="end" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="patients_count" fill="#4ca1a2" name="Nombre de patients" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-chart">
                  <i className="fas fa-chart-bar"></i>
                  <p>Aucune donnée disponible pour ce graphique</p>
                </div>
              )}
            </div>
          </div>
        )}

        {chartType === 'status' && (
          <div className="chart-panel">
            <h3>Rendez-vous par statut</h3>
            <div className="chart-container">
              {appointmentsByStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={appointmentsByStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="status"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {appointmentsByStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} rendez-vous`, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-chart">
                  <i className="fas fa-chart-pie"></i>
                  <p>Aucune donnée disponible pour ce graphique</p>
                </div>
              )}
            </div>
          </div>
        )}

        {chartType === 'specialty' && (
          <div className="chart-panel">
            <h3>Consultations par spécialité</h3>
            <div className="chart-container">
              {visitsBySpecialtyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={visitsBySpecialtyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="specialty" angle={-45} textAnchor="end" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="visits" fill="#8884d8" name="Nombre de consultations" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-chart">
                  <i className="fas fa-chart-bar"></i>
                  <p>Aucune donnée disponible pour ce graphique</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="statistics-summary">
        <div className="summary-section">
          <h3>Analyse des performances</h3>
          <div className="summary-content">
            <p>
              Le taux d'occupation moyen est de <strong>{stats.occupancyRate || 0}%</strong>, ce qui représente une 
              {stats.occupancyRate > 75 ? " excellente " : stats.occupancyRate > 50 ? " bonne " : " faible "}
              utilisation des ressources de la clinique.
            </p>
            <p>
              Le taux de conversion des rendez-vous (confirmés/total) est de <strong>{stats.conversionRate || 0}%</strong>, 
              indiquant {stats.conversionRate > 80 ? "une excellente gestion" : stats.conversionRate > 60 ? "une bonne gestion" : "des opportunités d'amélioration"} 
              du processus de confirmation.
            </p>
            <p>
              Le temps d'attente moyen est de <strong>{stats.averageWaitTime || "N/A"}</strong>, ce qui est 
              {stats.averageWaitTime < 7 ? " excellent" : stats.averageWaitTime < 14 ? " dans la moyenne" : " à améliorer"}.
            </p>
          </div>
        </div>

        <div className="summary-section">
          <h3>Recommandations</h3>
          <div className="summary-content">
            <ul className="recommendations-list">
              {stats.topSpecialty && (
                <li>
                  <i className="fas fa-lightbulb"></i>
                  <span>La spécialité <strong>{stats.topSpecialty}</strong> est très demandée. 
                  Envisagez de recruter plus de spécialistes dans ce domaine.</span>
                </li>
              )}
              {stats.leastActiveDay && (
                <li>
                  <i className="fas fa-lightbulb"></i>
                  <span>Le <strong>{stats.leastActiveDay}</strong> est le jour le moins actif. 
                  Considérez des promotions ou des offres spéciales ce jour-là.</span>
                </li>
              )}
              {stats.peakTime && (
                <li>
                  <i className="fas fa-lightbulb"></i>
                  <span>Les heures de pointe sont autour de <strong>{stats.peakTime}</strong>. 
                  Optimisez la disponibilité du personnel pendant ces périodes.</span>
                </li>
              )}
              <li>
                <i className="fas fa-lightbulb"></i>
                <span>Exportez ces statistiques en format PDF ou Excel pour une analyse plus approfondie.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="export-options">
        <button className="btn-outline" disabled={actionLoading}>
          <i className="fas fa-file-pdf"></i> Exporter en PDF
        </button>
        <button className="btn-outline" disabled={actionLoading}>
          <i className="fas fa-file-excel"></i> Exporter en Excel
        </button>
        <button className="btn-outline" disabled={actionLoading}>
          <i className="fas fa-print"></i> Imprimer
        </button>
      </div>
    </div>
  );
};

export default StatisticsView;