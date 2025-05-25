// src/hooks/useDoctorDashboard.js - Version optimisée pour éviter les rechargements inutiles
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import doctorApiClient from '../services/doctorApiClient';

export const useDoctorDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Core states
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navigation states
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSubTab, setActiveSubTab] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Data states
  const [data, setData] = useState({
    appointments: [],
    patients: [],
    medicalRecords: [],
    prescriptions: [],
    invoices: [],
    services: []
  });

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    overview: false,
    appointments: false,
    patients: false,
    medicalRecords: false,
    prescriptions: false,
    invoices: false,
    schedules: false,
    profile: false
  });

  // Data loaded flags - OPTIMISATION: Marquer comme chargé dès le premier chargement
  const [dataLoaded, setDataLoaded] = useState({
    overview: false,
    appointments: false,
    patients: false,
    medicalRecords: false,
    prescriptions: false,
    invoices: false,
    schedules: true, // Les horaires sont chargés à la demande
    profile: true    // Le profil est chargé une fois au début
  });

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // OPTIMISATION: Mémoriser les données déjà chargées
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  // Utility functions
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const setLoadingState = useCallback((section, isLoading) => {
    setLoadingStates(prev => ({ ...prev, [section]: isLoading }));
  }, []);

  const markSectionAsLoaded = useCallback((section) => {
    setDataLoaded(prev => ({ ...prev, [section]: true }));
  }, []);

  const updateData = useCallback((section, newData) => {
    setData(prev => ({ ...prev, [section]: newData }));
  }, []);

  const clearMessages = useCallback(() => {
    setActionError(null);
    setActionSuccess(null);
  }, []);

  const handleApiError = useCallback((err, defaultMessage = "Une erreur est survenue. Veuillez réessayer.") => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
    } else {
      setActionError(err.response?.data?.message || defaultMessage);
      setTimeout(() => setActionError(null), 5000);
    }
  }, [navigate]);

  // OPTIMISATION: Fonction de chargement intelligente qui évite les rechargements inutiles
  const loadSectionData = useCallback(async (section, forceReload = false) => {
    // Si déjà chargé et pas de rechargement forcé, ne rien faire
    if (dataLoaded[section] && !forceReload) {
      console.log(`Section ${section} déjà chargée, pas de rechargement`);
      return;
    }

    setLoadingState(section, true);
    try {
      switch (section) {
        case "overview":
          const overviewPromises = [];
          
          // OPTIMISATION: Charger seulement si pas déjà chargé
          if (data.appointments.length === 0 || forceReload) {
            overviewPromises.push(
              doctorApiClient.getAppointments().then(appointments => {
                updateData('appointments', appointments);
                markSectionAsLoaded('appointments');
              })
            );
          }
          
          if (data.patients.length === 0 || forceReload) {
            overviewPromises.push(
              doctorApiClient.getPatients().then(patients => {
                updateData('patients', patients);
                markSectionAsLoaded('patients');
              })
            );
          }
          
          await Promise.all(overviewPromises);
          break;

        case "appointments":
          if (data.appointments.length === 0 || forceReload) {
            const appointments = await doctorApiClient.getAppointments();
            updateData('appointments', appointments);
          }
          break;

        case "patients":
          if (data.patients.length === 0 || forceReload) {
            const patients = await doctorApiClient.getPatients();
            updateData('patients', patients);
          }
          break;

        case "medicalRecords":
          const medicalRecordsPromises = [];
          
          if (data.medicalRecords.length === 0 || forceReload) {
            medicalRecordsPromises.push(
              doctorApiClient.getMedicalRecords().then(medicalRecords => 
                updateData('medicalRecords', medicalRecords)
              )
            );
          }
          
          if (data.patients.length === 0 || forceReload) {
            medicalRecordsPromises.push(
              doctorApiClient.getPatients().then(patients => {
                updateData('patients', patients);
                markSectionAsLoaded('patients');
              })
            );
          }
          
          await Promise.all(medicalRecordsPromises);
          break;

        case "prescriptions":
          const prescriptionsPromises = [];
          
          if (data.prescriptions.length === 0 || forceReload) {
            prescriptionsPromises.push(
              doctorApiClient.getPrescriptions().then(prescriptions => 
                updateData('prescriptions', prescriptions)
              )
            );
          }
          
          if (data.patients.length === 0 || forceReload) {
            prescriptionsPromises.push(
              doctorApiClient.getPatients().then(patients => {
                updateData('patients', patients);
                markSectionAsLoaded('patients');
              })
            );
          }
          
          await Promise.all(prescriptionsPromises);
          break;

        case "invoices":
          const invoicesPromises = [];
          
          if (data.invoices.length === 0 || forceReload) {
            invoicesPromises.push(
              doctorApiClient.getInvoices().then(invoices => 
                updateData('invoices', invoices)
              )
            );
          }
          
          if (data.patients.length === 0 || forceReload) {
            invoicesPromises.push(
              doctorApiClient.getPatients().then(patients => {
                updateData('patients', patients);
                markSectionAsLoaded('patients');
              })
            );
          }
          
          await Promise.all(invoicesPromises);
          break;

        case "schedules":
          // Les horaires sont chargés à la demande dans le composant
          // Pas de chargement ici
          break;

        case "profile":
          // Le profil est déjà chargé à l'initialisation
          // Pas de rechargement nécessaire
          break;
      }

      markSectionAsLoaded(section);
      console.log(`Section ${section} chargée avec succès`);
    } catch (error) {
      console.error(`Erreur lors du chargement de la section ${section}:`, error);
      setActionError(`Impossible de charger les données pour ${section}.`);
    } finally {
      setLoadingState(section, false);
    }
  }, [data, dataLoaded, updateData, markSectionAsLoaded, setLoadingState, setActionError]);

  // OPTIMISATION: Fonction pour recharger une section spécifique si nécessaire
  const refreshSectionData = useCallback(async (section) => {
    await loadSectionData(section, true); // Force le rechargement
  }, [loadSectionData]);

  // Initialize dashboard - OPTIMISATION: Une seule fois au montage
  useEffect(() => {
    const initDashboard = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        setInitialLoading(true);

        // Charger les données utilisateur une seule fois
        const userResponse = await doctorApiClient.getUser();
        setUser(userResponse);

        if (userResponse.role !== "doctor") {
          setError("Accès non autorisé. Ce tableau de bord est réservé aux médecins.");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        // Charger le profil une seule fois
        try {
          const profileResponse = await doctorApiClient.getProfile();
          setProfile(profileResponse);
        } catch (profileErr) {
          console.warn("Impossible de charger le profil du médecin:", profileErr);
        }

        // Déterminer l'onglet initial depuis l'URL
        const pathSegments = location.pathname.split("/").filter(Boolean);
        let initialTab = "overview";
        if (pathSegments.length >= 3 && pathSegments[0] === "doctor" && pathSegments[1] === "dashboard") {
          initialTab = pathSegments[2];
        }

        setActiveTab(initialTab);
        
        // OPTIMISATION: Charger seulement l'onglet initial
        await loadSectionData(initialTab);
        
        setHasLoadedInitialData(true);
        setInitialLoading(false);
      } catch (err) {
        console.error("Erreur d'initialisation:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("Impossible de charger le tableau de bord. Veuillez réessayer plus tard.");
        }
        setInitialLoading(false);
      }
    };

    // OPTIMISATION: Exécuter seulement si pas encore initialisé
    if (!hasLoadedInitialData) {
      initDashboard();
    }
  }, [navigate, location.pathname, loadSectionData, hasLoadedInitialData]);

  // OPTIMISATION: Éviter les re-rendus inutiles en surveillant seulement les changements d'URL pertinents
  useEffect(() => {
    if (!hasLoadedInitialData) return;

    const pathSegments = location.pathname.split("/").filter(Boolean);
    if (pathSegments.length >= 3 && pathSegments[0] === "doctor" && pathSegments[1] === "dashboard") {
      const newTab = pathSegments[2];
      if (newTab !== activeTab) {
        setActiveTab(newTab);
        // Charger les données seulement si pas déjà chargées
        if (!dataLoaded[newTab]) {
          loadSectionData(newTab);
        }
      }
    }
  }, [location.pathname, activeTab, hasLoadedInitialData, dataLoaded, loadSectionData]);

  return {
    // States
    user,
    profile,
    setProfile,
    initialLoading,
    error,
    activeTab,
    activeSubTab,
    selectedPatient,
    selectedAppointment,
    data,
    loadingStates,
    dataLoaded,
    actionLoading,
    actionError,
    actionSuccess,
    
    // Actions
    setActiveTab,
    setActiveSubTab,
    setSelectedPatient,
    setSelectedAppointment,
    updateData,
    setActionLoading,
    setActionError,
    setActionSuccess,
    clearMessages,
    handleApiError,
    loadSectionData,
    refreshSectionData, // NOUVEAU: Pour forcer le rechargement si nécessaire
    
    // Utils
    getAuthHeaders
  };
};