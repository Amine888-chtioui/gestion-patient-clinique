// src/pages/DoctorDashboard.jsx - Version optimisée
import React from "react";
import "../components/doctor-dashboard/doctor-dashboard.css";
import "../components/doctor-dashboard/doctor-notification.css";
import "../components/doctor-dashboard/doctor-invoices.css";

// Hooks personnalisés
import { useDoctorDashboard } from "../hooks/useDoctorDashboard";
import { useDoctorActions } from "../hooks/useDoctorActions";

// Import des composants communs
import ErrorDisplay from "../components/common/ErrorDisplay";
import ActionMessages from "../components/common/ActionMessages";
import UnifiedLoadingSpinner from "../components/common/UnifiedLoadingSpinner";

// Import des composants spécifiques au médecin
import DoctorSidebar from "../components/doctor-dashboard/DoctorSidebar";
import ContentHeader from "../components/doctor-dashboard/ContentHeader";
import DoctorOverview from "../components/doctor-dashboard/DoctorOverview";
import DoctorAppointments from "../components/doctor-dashboard/DoctorAppointments";
import DoctorPatients from "../components/doctor-dashboard/DoctorPatients";
import MedicalRecordForm from "../components/doctor-dashboard/MedicalRecordForm";
import PrescriptionForm from "../components/doctor-dashboard/PrescriptionForm";
import PatientDetails from "../components/doctor-dashboard/PatientDetails";
import DoctorProfile from "../components/doctor-dashboard/DoctorProfile";
import MobileNav from "../components/doctor-dashboard/MobileNav";
import DoctorMedicalRecords from "../components/doctor-dashboard/DoctorMedicalRecords";
import DoctorPrescriptions from "../components/doctor-dashboard/DoctorPrescriptions";
import PatientSelector from "../components/doctor-dashboard/PatientSelector";
import DoctorSchedules from "../components/doctor-dashboard/DoctorSchedules";
import DoctorInvoices from "../components/doctor-dashboard/DoctorInvoices";

const DoctorDashboard = () => {
  // Utilisation des hooks personnalisés
  const dashboardState = useDoctorDashboard();
  const actions = useDoctorActions(dashboardState);

  const {
    user,
    profile,
    initialLoading,
    error,
    activeTab,
    activeSubTab,
    selectedPatient,
    data,
    loadingStates,
    actionLoading,
    actionError,
    actionSuccess
  } = dashboardState;

  const {
    handleTabChange,
    handleSubTabChange,
    handlePatientSelect,
    handleUpdateAppointmentStatus,
    handleCreateMedicalRecord,
    handleCreatePrescription,
    handleLogout
  } = actions;

  // Affichage en cas d'erreur globale
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // Affichage durant le chargement initial
  if (initialLoading) {
    return (
      <UnifiedLoadingSpinner
        fullScreen={true}
        text="Initialisation du tableau de bord..."
      />
    );
  }

  // Fonction pour rendre le contenu selon l'onglet actif
  const renderContent = () => {
    // Gestion des sous-onglets de sélection de patient
    if (activeSubTab === "select-patient-for-record") {
      return (
        <PatientSelector
          patients={data.patients}
          handlePatientSelect={handlePatientSelect}
          handleSubTabChange={handleSubTabChange}
          actionLoading={actionLoading}
          title="Sélectionner un patient"
          subtitle="Choisissez un patient pour créer un dossier médical"
        />
      );
    }

    if (activeSubTab === "select-patient-for-prescription") {
      return (
        <PatientSelector
          patients={data.patients}
          handlePatientSelect={handlePatientSelect}
          handleSubTabChange={handleSubTabChange}
          actionLoading={actionLoading}
          title="Sélectionner un patient"
          subtitle="Choisissez un patient pour créer une ordonnance"
        />
      );
    }

    // Gestion des détails du patient
    if (activeTab === "patients" && activeSubTab === "details" && selectedPatient) {
      return (
        <PatientDetails
          patient={selectedPatient}
          handleSubTabChange={handleSubTabChange}
          actionLoading={actionLoading}
        />
      );
    }

    // Gestion des formulaires
    if (activeSubTab === "record" && selectedPatient) {
      return (
        <MedicalRecordForm
          patient={selectedPatient}
          appointment={dashboardState.selectedAppointment}
          handleCreateMedicalRecord={handleCreateMedicalRecord}
          handleCancel={() => {
            handleSubTabChange(null);
            dashboardState.setSelectedPatient(null);
            dashboardState.setSelectedAppointment(null);
          }}
          actionLoading={actionLoading}
        />
      );
    }

    if (activeSubTab === "prescription" && selectedPatient) {
      return (
        <PrescriptionForm
          patient={selectedPatient}
          handleCreatePrescription={handleCreatePrescription}
          handleCancel={() => {
            handleSubTabChange(null);
            dashboardState.setSelectedPatient(null);
            dashboardState.setSelectedAppointment(null);
          }}
          actionLoading={actionLoading}
        />
      );
    }

    // Gestion des onglets principaux
    switch (activeTab) {
      case "overview":
        return loadingStates.overview ? (
          <UnifiedLoadingSpinner text="Chargement du tableau de bord..." color="primary" />
        ) : (
          <DoctorOverview
            user={user}
            appointments={data.appointments}
            patients={data.patients}
            handleTabChange={handleTabChange}
            actionLoading={actionLoading}
          />
        );

      case "appointments":
        return loadingStates.appointments ? (
          <UnifiedLoadingSpinner text="Chargement des rendez-vous..." color="info" />
        ) : (
          <DoctorAppointments
            appointments={data.appointments}
            handleUpdateStatus={handleUpdateAppointmentStatus}
            handleAppointmentSelect={actions.handleAppointmentSelect}
            actionLoading={actionLoading}
          />
        );

      case "patients":
        return loadingStates.patients ? (
          <UnifiedLoadingSpinner text="Chargement des patients..." color="success" />
        ) : (
          <DoctorPatients
            patients={data.patients}
            handlePatientSelect={handlePatientSelect}
            actionLoading={actionLoading}
          />
        );

      case "medical-records":
        return loadingStates.medicalRecords ? (
          <UnifiedLoadingSpinner text="Chargement des dossiers médicaux..." color="info" />
        ) : (
          <DoctorMedicalRecords
            patients={data.patients}
            handlePatientSelect={handlePatientSelect}
            handleSubTabChange={handleSubTabChange}
            actionLoading={actionLoading}
          />
        );

      case "prescriptions":
        return loadingStates.prescriptions ? (
          <UnifiedLoadingSpinner text="Chargement des ordonnances..." color="info" />
        ) : (
          <DoctorPrescriptions
            patients={data.patients}
            handlePatientSelect={handlePatientSelect}
            handleSubTabChange={handleSubTabChange}
            actionLoading={actionLoading}
          />
        );

      case "invoices":
        return loadingStates.invoices ? (
          <UnifiedLoadingSpinner text="Chargement des factures..." color="info" />
        ) : (
          <DoctorInvoices
            patients={data.patients}
            selectedPatient={selectedPatient}
            handlePatientSelect={handlePatientSelect}
            actionLoading={actionLoading}
          />
        );

      case "schedules":
        return loadingStates.schedules ? (
          <UnifiedLoadingSpinner text="Chargement des horaires..." color="primary" />
        ) : (
          <DoctorSchedules actionLoading={actionLoading} />
        );

      case "profile":
        return loadingStates.profile ? (
          <UnifiedLoadingSpinner text="Chargement du profil..." color="warning" />
        ) : (
          <DoctorProfile user={user} actionLoading={actionLoading} />
        );

      default:
        return (
          <div className="empty-state">
            <i className="fas fa-exclamation-circle"></i>
            <h3>Page non trouvée</h3>
            <p>L'onglet demandé n'existe pas</p>
          </div>
        );
    }
  };

  // Affichage du tableau de bord
  return (
    <div className="doctor-dashboard">
      <DoctorSidebar
        user={user || { name: "Chargement...", email: "" }}
        profile={profile}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        handleLogout={handleLogout}
        actionLoading={actionLoading || initialLoading}
      />

      <main className="main-content">
        <ContentHeader
          activeTab={activeTab}
          activeSubTab={activeSubTab}
          selectedPatient={selectedPatient}
          handleTabChange={handleTabChange}
          handleLogout={handleLogout}
        />

        <div className="content-body">
          <ActionMessages success={actionSuccess} error={actionError} />
          {renderContent()}
        </div>
      </main>

      <MobileNav
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        appointments={data.appointments}
      />
    </div>
  );
};

export default DoctorDashboard;