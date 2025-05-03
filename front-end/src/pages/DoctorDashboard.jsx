// src/pages/DoctorDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../axios";
import "../components/doctor-dashboard/doctor-dashboard.css";
import "../components/doctor-dashboard/doctor-notification.css";

// Import des composants
import LoadingSpinner from "../components/patient-dashboard/common/LoadingSpinner";
import ErrorDisplay from "../components/patient-dashboard/common/ErrorDisplay";
import ActionMessages from "../components/patient-dashboard/common/ActionMessages";
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

// Composant de spinner de chargement pour les sections
const SectionLoadingSpinner = ({ message = "Chargement en cours...", sectionClass = "" }) => (
  <div className={`section-loading ${sectionClass}`}>
    <div className="spinner-container">
      <div className="spinner"></div>
    </div>
    <p className="spinner-message">{message}</p>
  </div>
);

const DoctorDashboard = () => {
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSubTab, setActiveSubTab] = useState(null);

  // États pour les données
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [profile, setProfile] = useState(null);

  // États pour les chargements spécifiques des sections
  const [loadingStates, setLoadingStates] = useState({
    overview: false,
    appointments: false,
    patients: false,
    profile: false
  });

  // Registre des sections déjà chargées
  const [dataLoaded, setDataLoaded] = useState({
    overview: false,
    appointments: false,
    patients: false,
    profile: true // Le profil est chargé lors de l'initialisation
  });

  // États pour les actions
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Fonction utilitaire pour les en-têtes d'autorisation
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  // Helper pour mettre à jour l'état de chargement d'une section
  const setLoadingState = (section, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [section]: isLoading
    }));
  };

  // Helper pour marquer une section comme chargée
  const markSectionAsLoaded = (section) => {
    setDataLoaded(prev => ({
      ...prev,
      [section]: true
    }));
  };

  // Effet pour le chargement initial et l'authentification
  useEffect(() => {
    const initDashboard = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        setInitialLoading(true);
        
        // Récupérer les informations de l'utilisateur
        const userResponse = await axios.get("/api/user", getAuthHeaders());
        setUser(userResponse.data);

        if (userResponse.data.role !== "doctor") {
          setError(
            "Accès non autorisé. Ce tableau de bord est réservé aux médecins."
          );
          setTimeout(() => navigate("/"), 3000);
          return;
        }
        
        // Récupérer le profil du médecin
        try {
          const profileResponse = await axios.get("/api/doctor/profile", getAuthHeaders());
          setProfile(profileResponse.data.profile);
        } catch (profileErr) {
          console.warn("Impossible de charger le profil du médecin:", profileErr);
        }

        // Déterminer l'onglet actif à partir de l'URL
        const pathSegments = location.pathname.split('/').filter(Boolean);
        let initialTab = "overview";
        
        if (pathSegments.length >= 3 && pathSegments[0] === 'doctor' && pathSegments[1] === 'dashboard') {
          initialTab = pathSegments[2];
        }
        
        setActiveTab(initialTab);
        
        // Charger les données de la section initiale
        await loadSectionData(initialTab);
        
        // Désactiver le loading initial
        setInitialLoading(false);

      } catch (err) {
        console.error("Erreur d'initialisation:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError(
            "Impossible de charger le tableau de bord. Veuillez réessayer plus tard."
          );
        }
        setInitialLoading(false);
      }
    };

    initDashboard();
  }, []);

  // Charge les données pour une section spécifique
  const loadSectionData = async (section) => {
    // Si cette section est déjà chargée, ne rien faire
    if (dataLoaded[section]) {
      return;
    }

    // Marquer la section comme en cours de chargement
    setLoadingState(section, true);

    try {
      switch (section) {
        case "overview":
          const overviewPromises = [];
          
          if (appointments.length === 0) {
            overviewPromises.push(fetchAppointments());
          }
          
          if (patients.length === 0) {
            overviewPromises.push(fetchPatients());
          }
          
          await Promise.all(overviewPromises);
          
          // Marquer la section comme chargée
          markSectionAsLoaded("overview");
          
          // Si les données des autres sections ont été chargées, les marquer aussi
          if (appointments.length > 0) markSectionAsLoaded("appointments");
          if (patients.length > 0) markSectionAsLoaded("patients");
          break;
          
        case "appointments":
          if (appointments.length === 0) {
            await fetchAppointments();
          }
          
          // Marquer la section comme chargée
          markSectionAsLoaded("appointments");
          break;
          
        case "patients":
          if (patients.length === 0) {
            await fetchPatients();
          }
          
          // Marquer la section comme chargée
          markSectionAsLoaded("patients");
          break;
          
        case "profile":
          // Le profil est déjà chargé lors de l'initialisation
          markSectionAsLoaded("profile");
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error(`Erreur lors du chargement de la section ${section}:`, error);
      setActionError(`Impossible de charger les données pour ${section}.`);
    } finally {
      // Marquer la section comme terminée de chargement
      setLoadingState(section, false);
    }
  };

  // Fonctions de récupération de données individuelles
  const fetchAppointments = async () => {
    try {
      const appointmentsRes = await axios.get("/api/doctor/appointments", getAuthHeaders());
      setAppointments(appointmentsRes.data.appointments || []);
    } catch (error) {
      console.warn("Impossible de charger les rendez-vous:", error);
      throw error;
    }
  };

  const fetchPatients = async () => {
    try {
      const patientsRes = await axios.get("/api/doctor/patients", getAuthHeaders());
      setPatients(patientsRes.data.patients || []);
    } catch (error) {
      console.warn("Impossible de charger les patients:", error);
      throw error;
    }
  };

  // Gestion des actions
  const handleLogout = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      if (token) await axios.post("/api/logout", {}, getAuthHeaders());
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("Erreur de déconnexion:", err);
      localStorage.removeItem("token");
      navigate("/login");
    } finally {
      setActionLoading(false);
    }
  };

  // Changer d'onglet et charger les données si nécessaire
  const handleTabChange = (tab) => {
    // Si on est déjà sur cet onglet, ne rien faire
    if (tab === activeTab) return;
    
    // Mettre à jour l'onglet actif
    setActiveTab(tab);
    setActiveSubTab(null);
    setSelectedPatient(null);
    setSelectedAppointment(null);
    setActionError(null);
    setActionSuccess(null);
    
    // Mettre à jour l'URL sans recharger la page
    navigate(`/doctor/dashboard/${tab}`, { replace: true });
    
    // Charger les données pour cet onglet s'il n'a pas déjà été chargé
    if (!dataLoaded[tab]) {
      loadSectionData(tab);
    }
  };

  const handleSubTabChange = (subtab) => {
    setActiveSubTab(subtab);
    setActionError(null);
    setActionSuccess(null);
  };

  // Fonction mise à jour pour charger les détails complets d'un patient
  const handlePatientSelect = async (patient) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    
    try {
      // Appeler l'API pour récupérer les détails complets du patient
      const response = await axios.get(`/api/doctor/patients/${patient.id}`, getAuthHeaders());
      
      // Stocker les détails complets du patient
      setSelectedPatient(response.data.patient);
      setActiveSubTab('details');
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAppointmentSelect = async (appointment) => {
    setSelectedAppointment(appointment);
    setActionLoading(true);
    
    try {
      // Récupérer les détails du patient associé au rendez-vous
      const response = await axios.get(`/api/doctor/patients/${appointment.patient_id}`, getAuthHeaders());
      setSelectedPatient(response.data.patient);
      setActiveSubTab('record');
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAppointmentStatus = async (id, status) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
  
    try {
      await axios.put(
        `/api/doctor/appointments/${id}/status`,
        { status },
        getAuthHeaders()
      );
  
      // Mettre à jour l'état local
      setAppointments(
        appointments.map((apt) =>
          apt.id === id ? { ...apt, status: status } : apt
        )
      );
  
      setActionSuccess(`Statut du rendez-vous mis à jour : ${status}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateMedicalRecord = async (record) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      // Ajouter l'ID du patient et du rendez-vous aux données
      const recordData = {
        ...record,
        patient_id: selectedPatient.id,
        appointment_id: selectedAppointment?.id || null
      };

      await axios.post(
        "/api/doctor/medical-records",
        recordData,
        getAuthHeaders()
      );

      // Mettre à jour le statut du rendez-vous si nécessaire
      if (selectedAppointment) {
        setAppointments(
          appointments.map((apt) =>
            apt.id === selectedAppointment.id ? { ...apt, status: 'confirmé' } : apt
          )
        );
      }

      setActionSuccess("Dossier médical créé avec succès");
      
      // Réinitialiser la sélection après la création
      setTimeout(() => {
        handleTabChange("appointments");
      }, 1500);
      
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePrescription = async (prescription) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      // Ajouter l'ID du patient aux données
      const prescriptionData = {
        ...prescription,
        patient_id: selectedPatient.id,
        medical_record_id: prescription.medical_record_id || null
      };

      await axios.post(
        "/api/doctor/prescriptions",
        prescriptionData,
        getAuthHeaders()
      );

      setActionSuccess("Ordonnance créée avec succès");
      
      // Réinitialiser la sélection après la création
      setTimeout(() => {
        if (selectedAppointment) {
          handleTabChange("appointments");
        } else {
          handleTabChange("patients");
        }
      }, 1500);
      
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Gestion générique des erreurs d'API
  const handleApiError = (err, defaultMessage = "Une erreur est survenue. Veuillez réessayer.") => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
    } else {
      setActionError(
        err.response?.data?.message || defaultMessage
      );
      setTimeout(() => setActionError(null), 5000);
    }
  };

  // Affichage en cas d'erreur globale
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // Affichage durant le chargement initial
  if (initialLoading) {
    return <LoadingSpinner />;
  }

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
        />

        <div className="content-body">
          <ActionMessages success={actionSuccess} error={actionError} />

          {/* Affichage conditionnel en fonction de l'onglet actif */}
          {activeTab === "overview" && (
            loadingStates.overview ? (
              <SectionLoadingSpinner 
                message="Chargement du tableau de bord..." 
                sectionClass="overview"
              />
            ) : (
              <DoctorOverview
                user={user}
                appointments={appointments}
                patients={patients}
                handleTabChange={handleTabChange}
                actionLoading={actionLoading}
              />
            )
          )}

          {activeTab === "appointments" && !activeSubTab && (
            loadingStates.appointments ? (
              <SectionLoadingSpinner 
                message="Chargement des rendez-vous..." 
                sectionClass="appointments"
              />
            ) : (
              <DoctorAppointments
                appointments={appointments}
                handleUpdateStatus={handleUpdateAppointmentStatus}
                handleAppointmentSelect={handleAppointmentSelect}
                actionLoading={actionLoading}
              />
            )
          )}

          {activeTab === "patients" && !activeSubTab && (
            loadingStates.patients ? (
              <SectionLoadingSpinner 
                message="Chargement des patients..." 
                sectionClass="patients"
              />
            ) : (
              <DoctorPatients
                patients={patients}
                handlePatientSelect={handlePatientSelect}
                actionLoading={actionLoading}
              />
            )
          )}

          {/* Sous-sections spécifiques qui ne nécessitent pas d'indicateurs de chargement spécifiques */}
          {activeTab === "patients" && activeSubTab === "details" && selectedPatient && (
            <PatientDetails
              patient={selectedPatient}
              handleSubTabChange={handleSubTabChange}
              actionLoading={actionLoading}
            />
          )}

          {activeSubTab === "record" && selectedPatient && (
            <MedicalRecordForm
              patient={selectedPatient}
              appointment={selectedAppointment}
              handleCreateMedicalRecord={handleCreateMedicalRecord}
              handleCancel={() => {
                setActiveSubTab(null);
                setSelectedPatient(null);
                setSelectedAppointment(null);
              }}
              actionLoading={actionLoading}
            />
          )}

          {activeSubTab === "prescription" && selectedPatient && (
            <PrescriptionForm
              patient={selectedPatient}
              handleCreatePrescription={handleCreatePrescription}
              handleCancel={() => {
                setActiveSubTab(null);
                setSelectedPatient(null);
                setSelectedAppointment(null);
              }}
              actionLoading={actionLoading}
            />
          )}

          {activeTab === "profile" && (
            loadingStates.profile ? (
              <SectionLoadingSpinner 
                message="Chargement du profil..." 
                sectionClass="profile"
              />
            ) : (
              <DoctorProfile
                user={user}
                actionLoading={actionLoading}
              />
            )
          )}
        </div>
      </main>

      <MobileNav activeTab={activeTab} handleTabChange={handleTabChange} />
    </div>
  );
};

export default DoctorDashboard;