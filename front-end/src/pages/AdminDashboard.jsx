// src/pages/AdminDashboard.jsx - Version réorganisée et optimisée
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
  switch (invoiceMode) {
    case "details":
      return <InvoiceDetails onInvoiceAction={actions.handleInvoiceAction} />;
    case "create":
      return (
        <InvoiceForm 
          onSuccess={(data) => {
            dashboardState.setActionSuccess("Facture créée avec succès!");
            setTimeout(() => dashboardState.setActionSuccess(null), 3000);
            actions.handleInvoiceAction("list");
          }}
          onCancel={() => actions.handleInvoiceAction("list")}
        />
      );
    case "edit":
      return (
        <InvoiceForm 
          invoice={data.selectedInvoice} // Vous devrez récupérer la facture sélectionnée
          onSuccess={(data) => {
            dashboardState.setActionSuccess("Facture mise à jour avec succès!");
            setTimeout(() => dashboardState.setActionSuccess(null), 3000);
            actions.handleInvoiceAction("list");
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
          <ActionMessages success={actionSuccess} error={actionError} />
          {renderSectionContent()}
        </div>
      </main>

      <MobileNav 
        activeTab={activeTab} 
        handleTabChange={actions.handleTabChange} 
      />
    </div>
  );
};
export default AdminDashboard;