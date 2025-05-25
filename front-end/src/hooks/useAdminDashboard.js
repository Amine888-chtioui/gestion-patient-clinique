// src/hooks/useAdminDashboard.js
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import adminApiClient from '../services/adminApiClient';

export const useAdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Core states
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navigation states
  const [activeTab, setActiveTab] = useState("overview");
  const [invoiceMode, setInvoiceMode] = useState("list");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // Data states
  const [data, setData] = useState({
    patients: [],
    doctors: [],
    appointments: [],
    medicalRecords: [],
    prescriptions: [],
    users: [],
    stats: {},
    services: []
  });

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    overview: false,
    patients: false,
    doctors: false,
    appointments: false,
    medicalRecords: false,
    prescriptions: false,
    statistics: false,
    users: false,
    services: false,
    invoices: false,
    payments: false,
    contacts: false,
    profile: false
  });

  // Data loaded flags - OPTIMISATION: Plus intelligent sur quelles sections sont vraiment chargées
  const [dataLoaded, setDataLoaded] = useState({
    overview: false,
    patients: false,
    doctors: false,
    appointments: false,
    medicalRecords: false,
    prescriptions: false,
    statistics: false,
    users: false,
    services: false,
    invoices: true, // Handled by components
    payments: true, // Handled by components
    contacts: true, // Handled by components
    profile: true   // Loaded once at init
  });

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Utility functions
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

  // OPTIMISATION: Fonction de chargement intelligente - charge seulement une fois
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
          // Charger les stats seulement si pas déjà chargées
          if (Object.keys(data.stats).length === 0 || forceReload) {
            const stats = await adminApiClient.getStatistics();
            updateData('stats', stats);
          }
          break;

        case "patients":
          // Charger les patients seulement si pas déjà chargés
          if (data.patients.length === 0 || forceReload) {
            const patients = await adminApiClient.getPatients();
            updateData('patients', patients);
          }
          break;

        case "doctors":
          // Charger les médecins seulement si pas déjà chargés
          if (data.doctors.length === 0 || forceReload) {
            const doctors = await adminApiClient.getDoctors();
            updateData('doctors', doctors);
          }
          break;

        case "appointments":
          // Charger seulement ce qui n'est pas déjà en cache
          const appointmentsNeeded = data.appointments.length === 0 || forceReload;
          const patientsNeeded = data.patients.length === 0 && !dataLoaded.patients;
          const doctorsNeeded = data.doctors.length === 0 && !dataLoaded.doctors;

          const promises = [];
          if (appointmentsNeeded) {
            promises.push(
              adminApiClient.getAppointments().then(appointments => 
                updateData('appointments', appointments)
              )
            );
          }
          if (patientsNeeded) {
            promises.push(
              adminApiClient.getPatients().then(patients => {
                updateData('patients', patients);
                markSectionAsLoaded('patients');
              })
            );
          }
          if (doctorsNeeded) {
            promises.push(
              adminApiClient.getDoctors().then(doctors => {
                updateData('doctors', doctors);
                markSectionAsLoaded('doctors');
              })
            );
          }

          if (promises.length > 0) {
            await Promise.all(promises);
          }
          break;

        case "medicalRecords":
          const recordsPromises = [];
          
          // Charger les dossiers seulement si pas déjà chargés
          if (data.medicalRecords.length === 0 || forceReload) {
            recordsPromises.push(
              adminApiClient.getMedicalRecords().then(records => 
                updateData('medicalRecords', records)
              )
            );
          }
          
          // Charger patients et doctors seulement si nécessaire
          if (data.patients.length === 0 && !dataLoaded.patients) {
            recordsPromises.push(
              adminApiClient.getPatients().then(patients => {
                updateData('patients', patients);
                markSectionAsLoaded('patients');
              })
            );
          }
          
          if (data.doctors.length === 0 && !dataLoaded.doctors) {
            recordsPromises.push(
              adminApiClient.getDoctors().then(doctors => {
                updateData('doctors', doctors);
                markSectionAsLoaded('doctors');
              })
            );
          }

          if (recordsPromises.length > 0) {
            await Promise.all(recordsPromises);
          }
          break;

        case "prescriptions":
          const prescriptionsPromises = [];
          
          // Charger les prescriptions seulement si pas déjà chargées
          if (data.prescriptions.length === 0 || forceReload) {
            prescriptionsPromises.push(
              adminApiClient.getPrescriptions().then(prescriptions => 
                updateData('prescriptions', prescriptions)
              )
            );
          }
          
          // Charger patients et doctors seulement si nécessaire
          if (data.patients.length === 0 && !dataLoaded.patients) {
            prescriptionsPromises.push(
              adminApiClient.getPatients().then(patients => {
                updateData('patients', patients);
                markSectionAsLoaded('patients');
              })
            );
          }
          
          if (data.doctors.length === 0 && !dataLoaded.doctors) {
            prescriptionsPromises.push(
              adminApiClient.getDoctors().then(doctors => {
                updateData('doctors', doctors);
                markSectionAsLoaded('doctors');
              })
            );
          }

          if (prescriptionsPromises.length > 0) {
            await Promise.all(prescriptionsPromises);
          }
          break;

        case "statistics":
          // Les statistiques peuvent être rechargées à chaque fois pour avoir les dernières données
          if (Object.keys(data.stats).length === 0 || forceReload) {
            const stats = await adminApiClient.getStatistics();
            updateData('stats', stats);
          }
          break;

        case "users":
          // Charger les utilisateurs seulement si pas déjà chargés
          if (data.users.length === 0 || forceReload) {
            const users = await adminApiClient.getUsers();
            updateData('users', users);
          }
          break;

        case "services":
          // Charger les services seulement si pas déjà chargés
          if (data.services.length === 0 || forceReload) {
            const services = await adminApiClient.getServices();
            updateData('services', services);
          }
          break;
      }

      markSectionAsLoaded(section);
      console.log(`Section ${section} chargée et marquée comme chargée`);
    } catch (error) {
      console.error(`Erreur lors du chargement de la section ${section}:`, error);
      setActionError(`Impossible de charger les données pour ${section}.`);
    } finally {
      setLoadingState(section, false);
    }
  }, [data, dataLoaded, updateData, markSectionAsLoaded, setLoadingState, setActionError]);

  // Initialize dashboard
  useEffect(() => {
    const initDashboard = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        setInitialLoading(true);

        const userResponse = await adminApiClient.getUser();
        setUser(userResponse);

        if (userResponse.role !== "admin") {
          setError("Accès non autorisé. Ce tableau de bord est réservé aux administrateurs.");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        try {
          const profileResponse = await adminApiClient.getProfile();
          setProfile(profileResponse);
        } catch (profileErr) {
          console.warn("Impossible de charger le profil administrateur:", profileErr);
        }

        // Determine initial tab from URL
        const pathSegments = location.pathname.split("/").filter(Boolean);
        let initialTab = "overview";

        if (pathSegments.length >= 3 && pathSegments[0] === "admin" && pathSegments[1] === "dashboard") {
          initialTab = pathSegments[2];

          if (initialTab === "invoices" && pathSegments.length >= 4) {
            if (pathSegments[3] === "create") {
              setInvoiceMode("create");
            } else if (pathSegments.length >= 5 && pathSegments[3] === "edit") {
              setInvoiceMode("edit");
              setSelectedInvoiceId(pathSegments[4]);
            } else {
              setInvoiceMode("details");
              setSelectedInvoiceId(pathSegments[3]);
            }
          }
        }

        setActiveTab(initialTab);
        await loadSectionData(initialTab);
      } catch (err) {
        console.error("Erreur d'initialisation:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("Impossible de charger le tableau de bord. Veuillez réessayer plus tard.");
        }
      } finally {
        setInitialLoading(false);
      }
    };

    initDashboard();

    const handleLogoutEvent = () => {
      handleLogout();
    };

    window.addEventListener("admin-logout", handleLogoutEvent);
    return () => {
      window.removeEventListener("admin-logout", handleLogoutEvent);
    };
  }, [navigate, location.pathname, loadSectionData]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      if (token) await adminApiClient.logout();
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("Erreur de déconnexion:", err);
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate]);

  return {
    // States
    user,
    profile,
    setProfile,
    initialLoading,
    error,
    activeTab,
    invoiceMode,
    selectedInvoiceId,
    data,
    loadingStates,
    dataLoaded,
    actionLoading,
    actionError,
    actionSuccess,
    
    // Actions
    setActiveTab,
    setInvoiceMode,
    setSelectedInvoiceId,
    updateData,
    setActionLoading,
    setActionError,
    setActionSuccess,
    clearMessages,
    handleApiError,
    loadSectionData,
    handleLogout
  };
};