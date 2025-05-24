// src/pages/PatientDashboard.jsx - Version optimisée
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../axios";

// Import CSS
import "../components/patient-dashboard/notification.css";
import "../components/patient-dashboard/PatientDashboard.css";
import "../components/patient-dashboard/appointment-booking.css";

// Import des hooks personnalisés
import { useDashboardState } from "../hooks/useDashboardState";
import { useDataLoader } from "../hooks/useDataLoader";
import { useDashboardActions } from "../hooks/useDashboardActions";

// Import des composants communs
import Sidebar from "../components/patient-dashboard/Sidebar";
import ContentHeader from "../components/patient-dashboard/ContentHeader";
import MobileNav from "../components/patient-dashboard/MobileNav";
import ErrorDisplay from "../components/common/ErrorDisplay";
import ActionMessages from "../components/common/ActionMessages";
import UnifiedLoadingSpinner from "../components/common/UnifiedLoadingSpinner";

// Import des composants de contenu
import Overview from "../components/patient-dashboard/Overview";
import Appointments from "../components/patient-dashboard/Appointments";
import MedicalRecords from "../components/patient-dashboard/MedicalRecords";
import Prescriptions from "../components/patient-dashboard/Prescriptions";
import Profile from "../components/patient-dashboard/Profile";
import ImprovedBookAppointment from "../components/patient-dashboard/ImprovedBookAppointment";
import Invoices from "../components/patient-dashboard/Invoices";

// Import du service API
import apiClient from "../services/apiClient";

const PatientDashboard = () => {
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const navigate = useNavigate();
  const location = useLocation();

  // Utilisation des hooks personnalisés
  const dashboardState = useDashboardState();
  const { loadSectionData } = useDataLoader(dashboardState);
  const dashboardActions = useDashboardActions(dashboardState, user);

  // Fonction utilitaire pour les en-têtes d'autorisation
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  // Effet initial pour l'authentification et le chargement des données de base
  useEffect(() => {
    const initDashboard = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        setInitialLoading(true);

        // Récupérer les informations de l'utilisateur
        const userResponse = await axios.get("/api/user", getAuthHeaders());
        setUser(userResponse.data);

        if (userResponse.data.role !== "patient") {
          setError("Accès non autorisé. Ce tableau de bord est réservé aux patients.");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        // Charger le profil
        try {
          const profile = await apiClient.getProfile();
          dashboardState.updateData('profile', profile);
        } catch (profileErr) {
          console.warn("Impossible de charger le profil:", profileErr);
        }

        // Déterminer l'onglet actif à partir de l'URL
        const pathSegments = location.pathname.split("/").filter(Boolean);
        let initialTab = "overview";

        if (
          pathSegments.length >= 3 &&
          pathSegments[0] === "patient" &&
          pathSegments[1] === "dashboard"
        ) {
          initialTab = pathSegments[2];
        }

        setActiveTab(initialTab);

        // Charger les données de la section initiale
        await loadSectionData(initialTab);

        setInitialLoading(false);
      } catch (err) {
        console.error("Erreur d'initialisation:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("Impossible de charger les données. Veuillez réessayer plus tard.");
        }
        setInitialLoading(false);
      }
    };

    initDashboard();
  }, []);

  // Changer d'onglet et charger les données si nécessaire
  const handleTabChange = (tab) => {
    if (tab === activeTab) return;

    setActiveTab(tab);
    dashboardState.clearMessages();

    // Mettre à jour l'URL sans recharger la page
    navigate(`/patient/dashboard/${tab}`, { replace: true });

    // Charger les données pour cet onglet s'il n'a pas déjà été chargé
    if (!dashboardState.dataLoaded[tab]) {
      loadSectionData(tab);
    }
  };

  // Rendu des composants de contenu
  const renderContent = () => {
    const { loadingStates, data, actionLoading } = dashboardState;

    if (loadingStates[activeTab]) {
      return <UnifiedLoadingSpinner text={`Chargement ${getTabLabel(activeTab)}...`} />;
    }

    switch (activeTab) {
      case "overview":
        return (
          <Overview
            user={user}
            appointments={data.appointments}
            medicalRecords={data.medicalRecords}
            prescriptions={data.prescriptions}
            handleTabChange={handleTabChange}
            actionLoading={actionLoading}
          />
        );

      case "appointments":
        return (
          <Appointments
            appointments={data.appointments}
            doctors={data.doctors}
            handleCancelAppointment={dashboardActions.handleCancelAppointment}
            handleUpdateAppointment={dashboardActions.handleUpdateAppointment}
            handleTabChange={handleTabChange}
            actionLoading={actionLoading}
          />
        );

      case "book":
        return (
          <ImprovedBookAppointment
            handleTabChange={handleTabChange}
            actionLoading={actionLoading}
            onBookAppointment={dashboardActions.handleBookAppointment}
          />
        );

      case "medicalRecords":
        return (
          <MedicalRecords
            medicalRecords={data.medicalRecords}
            handleDownloadDocument={dashboardActions.handleDownloadDocument}
            actionLoading={actionLoading}
          />
        );

      case "prescriptions":
        return (
          <Prescriptions
            prescriptions={data.prescriptions}
            actionLoading={actionLoading}
          />
        );

      case "invoices":
        return <Invoices actionLoading={actionLoading} />;

      case "profile":
        return (
          <Profile
            user={user}
            profile={data.profile}
            updateProfile={dashboardActions.handleUpdateProfile}
            updatePhoto={dashboardActions.handleUpdatePhoto}
            actionLoading={actionLoading}
          />
        );

      default:
        return <div>Section non trouvée</div>;
    }
  };

  const getTabLabel = (tab) => {
    const labels = {
      overview: "du tableau de bord",
      appointments: "des rendez-vous",
      book: "du formulaire de réservation",
      medicalRecords: "de votre dossier médical",
      prescriptions: "des ordonnances",
      invoices: "des factures",
      profile: "du profil",
    };
    return labels[tab] || "";
  };

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
        size="large"
      />
    );
  }

  // Affichage du tableau de bord
  return (
    <div className="patient-dashboard">
      <Sidebar
        user={user || { name: "Chargement...", email: "" }}
        profile={dashboardState.data.profile}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        actionLoading={dashboardState.actionLoading}
      />

      <main className="main-content">
        <ContentHeader
          activeTab={activeTab}
          handleTabChange={handleTabChange}
          handleLogout={dashboardActions.handleLogout}
          actionLoading={dashboardState.actionLoading}
        />
        <div className="content-body">
          <ActionMessages
            success={dashboardState.actionSuccess}
            error={dashboardState.actionError}
          />

          {renderContent()}
        </div>
      </main>

      <MobileNav activeTab={activeTab} handleTabChange={handleTabChange} />
    </div>
  );
};

export default PatientDashboard;