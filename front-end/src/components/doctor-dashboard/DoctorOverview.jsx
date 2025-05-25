// src/components/doctor-dashboard/DoctorOverview.jsx - Version optimisée
import React, { useState, useEffect } from "react";
import doctorApiClient from "../../services/doctorApiClient";

const DoctorOverview = ({ 
  user, 
  appointments, 
  patients, 
  handleTabChange, 
  actionLoading 
}) => {
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  // Calculer les statistiques
  const today = new Date().toISOString().split('T')[0];
  const appointmentsToday = appointments.filter(apt => apt.date === today);
  const pendingAppointments = appointments.filter(apt => apt.status === "en attente");
  const confirmedAppointments = appointments.filter(apt => apt.status === "confirmé");

  // Récupérer les factures
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setInvoicesLoading(true);
        const response = await doctorApiClient.getInvoices();
        setInvoices(response.slice(0, 5)); // Seulement les 5 plus récentes
      } catch (err) {
        console.error("Erreur lors du chargement des factures:", err);
      } finally {
        setInvoicesLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getUpcomingAppointments = () => {
    return appointments
      .filter(apt => new Date(`${apt.date}T${apt.time}`) >= new Date())
      .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
      .slice(0, 5);
  };

  const StatCard = ({ icon, title, value, color = "primary" }) => (
    <div className="stat-card">
      <div className={`stat-icon stat-icon-${color}`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="stat-info">
        <h3>{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );

  const ActionButton = ({ icon, label, onClick, disabled }) => (
    <button 
      className="action-btn" 
      onClick={onClick} 
      disabled={disabled}
    >
      <i className={`fas ${icon}`}></i>
      {label}
    </button>
  );

  return (
    <div className="overview-container">
      <div className="welcome-message">
        <h2>Bienvenue, Dr. {user?.name}!</h2>
        <p>Consultez vos rendez-vous et gérez vos patients</p>
      </div>

      <div className="stats-container">
        <StatCard 
          icon="fa-calendar-day" 
          title="Rendez-vous aujourd'hui" 
          value={appointmentsToday.length}
          color="primary"
        />
        <StatCard 
          icon="fa-calendar-check" 
          title="Rendez-vous en attente" 
          value={pendingAppointments.length}
          color="warning"
        />
        <StatCard 
          icon="fa-users" 
          title="Nombre de patients" 
          value={patients.length}
          color="success"
        />
        <StatCard 
          icon="fa-clipboard-list" 
          title="Total consultations" 
          value={confirmedAppointments.length}
          color="info"
        />
      </div>

      <div className="quick-actions">
        <h3>Actions rapides</h3>
        <div className="action-buttons">
          <ActionButton 
            icon="fa-calendar-alt" 
            label="Voir les rendez-vous"
            onClick={() => handleTabChange("appointments")}
            disabled={actionLoading}
          />
          <ActionButton 
            icon="fa-user-injured" 
            label="Gérer les patients"
            onClick={() => handleTabChange("patients")}
            disabled={actionLoading}
          />
          <ActionButton 
            icon="fa-prescription" 
            label="Créer une ordonnance"
            onClick={() => handleTabChange("prescriptions")}
            disabled={actionLoading}
          />
          <ActionButton 
            icon="fa-file-invoice-dollar" 
            label="Voir les factures"
            onClick={() => handleTabChange("invoices")}
            disabled={actionLoading}
          />
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h3>Rendez-vous à venir</h3>
          {appointments.length > 0 ? (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Patient</th>
                    <th>Motif</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {getUpcomingAppointments().map(appointment => (
                    <tr key={appointment.id}>
                      <td>{appointment.date}</td>
                      <td>{appointment.time}</td>
                      <td>{appointment.patient_name}</td>
                      <td>
                        {appointment.reason && appointment.reason.length > 30
                          ? `${appointment.reason.substring(0, 30)}...`
                          : appointment.reason || "Non spécifié"}
                      </td>
                      <td>
                        <span className={`status-badge ${appointment.status.replace(" ", "")}`}>
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right">
                <button 
                  className="btn-outline"
                  onClick={() => handleTabChange("appointments")}
                  disabled={actionLoading}
                >
                  Voir tous les rendez-vous
                </button>
              </div>
            </>
          ) : (
            <p className="no-data">Aucun rendez-vous à venir</p>
          )}
        </div>

        <div className="dashboard-section">
          <h3>Factures récentes</h3>
          {invoicesLoading ? (
            <div className="loading-mini">
              <i className="fas fa-spinner fa-spin"></i> Chargement des factures...
            </div>
          ) : invoices.length > 0 ? (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(invoice => (
                    <tr key={invoice.id}>
                      <td>{invoice.number}</td>
                      <td>{invoice.patient_name}</td>
                      <td>{invoice.date}</td>
                      <td>{formatCurrency(invoice.total_amount)}</td>
                      <td>
                        <span className={`status-badge ${invoice.status}`}>
                          {invoice.status === 'paid' ? 'Payée' : 
                           invoice.status === 'overdue' ? 'En retard' : 'Non payée'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right">
                <button 
                  className="btn-outline"
                  onClick={() => handleTabChange("invoices")}
                  disabled={actionLoading}
                >
                  Voir toutes les factures
                </button>
              </div>
            </>
          ) : (
            <p className="no-data">Aucune facture récente</p>
          )}
        </div>

        <div className="dashboard-section">
          <h3>Patients récents</h3>
          {patients.length > 0 ? (
            <>
              <ul className="patient-list">
                {patients.slice(0, 5).map(patient => (
                  <li key={patient.id} className="patient-list-item">
                    <div className="patient-list-avatar">
                      <i className="fas fa-user-circle"></i>
                    </div>
                    <div className="patient-list-info">
                      <h4>{patient.name}</h4>
                      <p>Dernier RDV: {patient.last_appointment || "N/A"}</p>
                    </div>
                    <button 
                      className="btn-icon"
                      onClick={() => handleTabChange("patients")}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="text-right">
                <button 
                  className="btn-outline"
                  onClick={() => handleTabChange("patients")}
                  disabled={actionLoading}
                >
                  Voir tous les patients
                </button>
              </div>
            </>
          ) : (
            <p className="no-data">Aucun patient récent</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorOverview;