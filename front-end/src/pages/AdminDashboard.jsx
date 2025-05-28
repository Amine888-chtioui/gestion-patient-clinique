// src/pages/AdminDashboard.jsx - Version complète avec support des notifications
import React from "react";
import "../components/admin-dashboard/admin-dashboard.css";
import "../styles/invoices.css";
import "../components/admin-dashboard/services-management.css";
import "../components/admin-dashboard/payment-status-viewer.css";
import "../components/admin-dashboard/admin-payment-methods.css";
import "../components/admin-dashboard/admin-profile.css";

// Import des hooks optimisés
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import { useAdminActions } from "../hooks/useAdminActions";

// Import des composants communs
import UnifiedLoadingSpinner from "../components/common/UnifiedLoadingSpinner";
import ErrorDisplay from "../components/common/ErrorDisplay";
import ActionMessages from "../components/common/ActionMessages";

// Import des composants de navigation
import AdminSidebar from "../components/admin-dashboard/AdminSidebar";
import ContentHeader from "../components/admin-dashboard/ContentHeader";
import MobileNav from "../components/admin-dashboard/MobileNav";

// Import des composants de contenu
import AdminOverview from "../components/admin-dashboard/AdminOverview";
import PatientsManagement from "../components/admin-dashboard/PatientsManagement";
import DoctorsManagement from "../components/admin-dashboard/DoctorsManagement";
import AppointmentsManagement from "../components/admin-dashboard/AppointmentsManagement";
import MedicalRecordsManagement from "../components/admin-dashboard/MedicalRecordsManagement";
import StatisticsView from "../components/admin-dashboard/StatisticsView";
import UsersManagement from "../components/admin-dashboard/UsersManagement";
import PaymentMethodsManagement from "../components/admin-dashboard/PaymentMethodsManagement";
import ServicesManagement from "../components/admin-dashboard/ServicesManagement";
import PaymentStatusViewer from "../components/admin-dashboard/PaymentStatusViewer";
import AdminProfile from "../components/admin-dashboard/AdminProfile";
import ContactsManagement from "../components/admin-dashboard/ContactsManagement";
import PrescriptionsManagement from "../components/admin-dashboard/PrescriptionsManagement";

// Import des composants de factures
import InvoiceList from "../components/invoices/InvoiceList";
import InvoiceDetails from "../components/invoices/InvoiceDetails";
import InvoiceForm from "../components/invoices/InvoiceForm";

const AdminDashboard = () => {
  // Utilisation des hooks optimisés
  const dashboardState = useAdminDashboard();
  const actions = useAdminActions(dashboardState);

  const {
    user,
    profile,
    initialLoading,
    error,
    activeTab,
    invoiceMode,
    data,
    loadingStates,
    actionLoading,
    actionError,
    actionSuccess
  } = dashboardState;

  // Rendu du contenu pour les factures
  const renderInvoiceContent = () => {
  console.log('🔄 Rendu du contenu facture:', {
    mode: invoiceMode,
    selectedId: dashboardState.selectedInvoiceId,
    selectedInvoice: data.selectedInvoice?.id
  });

  switch (invoiceMode) {
    case "details":
      return (
        <InvoiceDetails 
          onInvoiceAction={actions.handleInvoiceAction}
          selectedInvoiceId={dashboardState.selectedInvoiceId}
        />
      );
      
    case "create":
      return (
        <InvoiceForm 
          onSuccess={(invoiceData) => {
            console.log('✅ Facture créée:', invoiceData);
            dashboardState.setActionSuccess("Facture créée avec succès!");
            setTimeout(() => {
              dashboardState.setActionSuccess(null);
              actions.handleInvoiceAction("list");
            }, 2000);
          }}
          onCancel={() => actions.handleInvoiceAction("list")}
        />
      );
      
    case "edit":
      return (
        <InvoiceForm 
          invoice={data.selectedInvoice}
          onSuccess={(invoiceData) => {
            console.log('✅ Facture mise à jour:', invoiceData);
            dashboardState.setActionSuccess("Facture mise à jour avec succès!");
            setTimeout(() => {
              dashboardState.setActionSuccess(null);
              actions.handleInvoiceAction("list");
            }, 2000);
          }}
          onCancel={() => actions.handleInvoiceAction("list")}
        />
      );
      
    case "list":
    default:
      return <InvoiceList onInvoiceAction={actions.handleInvoiceAction} />;
  }
};

  // Composant de rendu conditionnel optimisé
  const renderSectionContent = () => {
    const isLoading = loadingStates[activeTab];
    const loadingMessage = `Chargement ${getSectionLabel(activeTab)}...`;

    if (isLoading) {
      return <UnifiedLoadingSpinner size="medium" text={loadingMessage} />;
    }

    switch (activeTab) {
      case "overview":
        return (
          <AdminOverview
            stats={data.stats}
            handleTabChange={actions.handleTabChange}
            actionLoading={actionLoading}
          />
        );

      case "patients":
        return (
          <PatientsManagement
            patients={data.patients}
            doctors={data.doctors}
            handleAddPatient={actions.handleAddPatient}
            handleUpdatePatient={actions.handleUpdatePatient}
            handleDeletePatient={actions.handleDeletePatient}
            actionLoading={actionLoading}
          />
        );

      case "doctors":
        return (
          <DoctorsManagement
            doctors={data.doctors}
            handleAddDoctor={actions.handleAddDoctor}
            handleUpdateDoctor={actions.handleUpdateDoctor}
            handleDeleteDoctor={actions.handleDeleteDoctor}
            actionLoading={actionLoading}
          />
        );

      case "appointments":
        return (
          <AppointmentsManagement
            appointments={data.appointments}
            patients={data.patients}
            doctors={data.doctors}
            handleAddAppointment={actions.handleAddAppointment}
            handleUpdateAppointment={actions.handleUpdateAppointment}
            handleDeleteAppointment={actions.handleDeleteAppointment}
            actionLoading={actionLoading}
          />
        );

      case "medicalRecords":
        return (
          <MedicalRecordsManagement
            medicalRecords={data.medicalRecords}
            patients={data.patients}
            doctors={data.doctors}
            actionLoading={actionLoading}
            handleUpdateMedicalRecord={actions.handleUpdateMedicalRecord} // NOUVEAU PROP
          />
        );

      case "prescriptions":
        return (
          <PrescriptionsManagement
            prescriptions={data.prescriptions}
            patients={data.patients}
            doctors={data.doctors}
            handleAddPrescription={actions.handleAddPrescription}
            handleUpdatePrescription={actions.handleUpdatePrescription}
            handleDeletePrescription={actions.handleDeletePrescription}
            actionLoading={actionLoading}
          />
        );

      case "statistics":
        return (
          <StatisticsView 
            stats={data.stats} 
            actionLoading={actionLoading} 
          />
        );

      case "users":
        return (
          <UsersManagement
            users={data.users}
            handleAddUser={actions.handleAddUser}
            handleUpdateUser={actions.handleUpdateUser}
            handleDeleteUser={actions.handleDeleteUser}
            actionLoading={actionLoading}
          />
        );

      case "services":
        return (
          <ServicesManagement
            actionLoading={actionLoading}
            setActionLoading={dashboardState.setActionLoading}
            setActionError={dashboardState.setActionError}
            setActionSuccess={dashboardState.setActionSuccess}
          />
        );

      case "profile":
        return (
          <AdminProfile
            user={user}
            actionLoading={actionLoading}
            setActionLoading={dashboardState.setActionLoading}
            setActionError={dashboardState.setActionError}
            setActionSuccess={dashboardState.setActionSuccess}
          />
        );

      case "contacts":
        return (
          <ContactsManagement
            actionLoading={actionLoading}
            setActionLoading={dashboardState.setActionLoading}
            setActionError={dashboardState.setActionError}
            setActionSuccess={dashboardState.setActionSuccess}
          />
        );

      case "invoices":
        return renderInvoiceContent();

      case "payments":
        return (
          <div>
            <PaymentStatusViewer />
            <PaymentMethodsManagement
              actionLoading={actionLoading}
              setActionLoading={dashboardState.setActionLoading}
              setActionError={dashboardState.setActionError}
              setActionSuccess={dashboardState.setActionSuccess}
            />
          </div>
        );

      default:
        return <div>Section non trouvée</div>;
    }
  };

  // Fonction utilitaire pour les labels de section
  const getSectionLabel = (section) => {
    const labels = {
      overview: "du tableau de bord",
      patients: "des patients",
      doctors: "des médecins", 
      appointments: "des rendez-vous",
      medicalRecords: "des dossiers médicaux",
      prescriptions: "des ordonnances",
      statistics: "des statistiques",
      users: "des utilisateurs",
      services: "des services",
      profile: "du profil",
      contacts: "des messages",
      invoices: "des factures",
      payments: "des paiements"
    };
    return labels[section] || "";
  };

  // Affichage durant le chargement initial
  if (initialLoading) {
    return (
      <UnifiedLoadingSpinner
        fullScreen={true}
        text="Initialisation du tableau de bord administrateur..."
      />
    );
  }

  // Affichage en cas d'erreur globale
  if (error) {
    return <ErrorDisplay error={error} fullScreen={true} />;
  }

  // Rendu principal du tableau de bord
  return (
    <div className="admin-dashboard">
      <AdminSidebar
        user={user}
        profile={profile}
        activeTab={activeTab}
        handleTabChange={actions.handleTabChange}
        handleLogout={dashboardState.handleLogout}
        actionLoading={actionLoading}
      />

      <main className="main-content">
        <ContentHeader
          activeTab={activeTab}
          handleTabChange={actions.handleTabChange}
        />

        <div className="content-body">
          {/* Messages d'action avec notifications enrichies */}
          <ActionMessages 
            success={actionSuccess} 
            error={actionError}
            autoHideDuration={actionSuccess && actionSuccess.includes('📩') ? 7000 : 5000} // Plus long pour les messages avec notifications
          />
          {renderSectionContent()}
        </div>
      </main>

      <MobileNav 
        activeTab={activeTab} 
        handleTabChange={actions.handleTabChange} 
      />

      {/* Styles CSS globaux pour les notifications */}
      <style jsx global>{`
        /* Styles pour les infos de notification */
        .notification-info {
          margin: 10px 0;
          padding: 8px 12px;
          background-color: rgba(23, 162, 184, 0.1);
          border-left: 3px solid #17a2b8;
          border-radius: 4px;
          animation: fadeIn 0.3s ease;
        }

        .notification-preview {
          margin: 15px 0;
          padding: 10px;
          background-color: rgba(40, 167, 69, 0.1);
          border-left: 3px solid #28a745;
          border-radius: 4px;
          animation: slideIn 0.3s ease;
        }

        .notification-info small,
        .notification-preview small {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #495057;
        }

        .notification-info i,
        .notification-preview i {
          color: #17a2b8;
        }

        /* Animation pour les messages de notification */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Styles pour les messages de succès avec notifications */
        .action-message.success {
          border-left-width: 4px;
        }

        .action-message.success .message-content p {
          line-height: 1.4;
        }

        /* Amélioration des confirmations de suppression */
        .confirm-dialog {
          white-space: pre-line;
          text-align: left;
        }

        /* Styles pour les badges de notification dans les tableaux */
        .notification-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          background-color: rgba(40, 167, 69, 0.1);
          color: #28a745;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .notification-badge i {
          font-size: 0.7rem;
        }

        /* Responsive design pour les notifications */
        @media (max-width: 768px) {
          .notification-info,
          .notification-preview {
            margin: 8px 0;
            padding: 6px 10px;
          }

          .notification-info small,
          .notification-preview small {
            font-size: 0.8rem;
            gap: 4px;
          }
        }

        /* Animation pour les actions de l'admin */
        .admin-action-loading {
          position: relative;
          overflow: hidden;
        }

        .admin-action-loading::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        /* Console de débogage pour le développement */
        .debug-notifications {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          z-index: 9999;
          max-width: 300px;
          display: none; /* Masqué par défaut */
        }

        /* Afficher la console de débogage en mode développement */
        body[data-debug="true"] .debug-notifications {
          display: block;
        }
      `}</style>

      {/* Console de débogage pour les notifications (uniquement en dev) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-notifications" id="debug-notifications">
          <div>🔔 Notifications Debug</div>
          <div>Actions: {Object.keys(actions).length}</div>
          <div>Loading: {actionLoading ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;