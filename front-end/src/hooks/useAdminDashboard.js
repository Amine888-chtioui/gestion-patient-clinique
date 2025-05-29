// src/hooks/useAdminDashboard.js - Version optimisée sans rechargements inutiles
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
  const [isInitialized, setIsInitialized] = useState(false); // NOUVEAU: Flag d'initialisation

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

  // Data loaded flags - OPTIMISATION: Mémoire persistante des données chargées
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

  // OPTIMISATION PRINCIPALE: Fonction de chargement qui ne charge QUE si nécessaire
  const loadSectionData = useCallback(async (section, forceReload = false) => {
    // CONDITION CLÉE: Si déjà chargé et pas de rechargement forcé, NE RIEN FAIRE
    if (dataLoaded[section] && !forceReload) {
      console.log(`✅ Section ${section} déjà en cache, pas de rechargement`);
      return Promise.resolve(); // Retour immédiat
    }

    // Si déjà en cours de chargement, ne pas relancer
    if (loadingStates[section]) {
      console.log(`⏳ Section ${section} déjà en cours de chargement`);
      return Promise.resolve();
    }

    setLoadingState(section, true);
    console.log(`🔄 Chargement de la section ${section}...`);

    try {
      switch (section) {
        case "overview":
          // Charger les stats seulement si pas déjà chargées
          if (Object.keys(data.stats).length === 0 || forceReload) {
            const stats = await adminApiClient.getStatistics();
            updateData('stats', stats);
            console.log(`📊 Stats chargées pour overview`);
          }
          break;

        case "patients":
          // Charger les patients seulement si le tableau est vide
          if (data.patients.length === 0 || forceReload) {
            const patients = await adminApiClient.getPatients();
            updateData('patients', patients);
            console.log(`👥 ${patients.length} patients chargés`);
          }
          break;

        case "doctors":
          // Charger les médecins seulement si le tableau est vide
          if (data.doctors.length === 0 || forceReload) {
            const doctors = await adminApiClient.getDoctors();
            updateData('doctors', doctors);
            console.log(`👨‍⚕️ ${doctors.length} médecins chargés`);
          }
          break;

        case "appointments":
          // Chargement intelligent: seulement ce qui manque
          const promises = [];
          
          if (data.appointments.length === 0 || forceReload) {
            promises.push(
              adminApiClient.getAppointments().then(appointments => {
                updateData('appointments', appointments);
                console.log(`📅 ${appointments.length} rendez-vous chargés`);
              })
            );
          }

          // Charger patients et doctors SEULEMENT s'ils ne sont pas déjà chargés
          if (data.patients.length === 0 && !dataLoaded.patients) {
            promises.push(
              adminApiClient.getPatients().then(patients => {
                updateData('patients', patients);
                markSectionAsLoaded('patients');
                console.log(`👥 ${patients.length} patients chargés (pour appointments)`);
              })
            );
          }

          if (data.doctors.length === 0 && !dataLoaded.doctors) {
            promises.push(
              adminApiClient.getDoctors().then(doctors => {
                updateData('doctors', doctors);
                markSectionAsLoaded('doctors');
                console.log(`👨‍⚕️ ${doctors.length} médecins chargés (pour appointments)`);
              })
            );
          }

          if (promises.length > 0) {
            await Promise.all(promises);
          }
          break;

        case "medicalRecords":
          const recordsPromises = [];
          
          if (data.medicalRecords.length === 0 || forceReload) {
            recordsPromises.push(
              adminApiClient.getMedicalRecords().then(records => {
                updateData('medicalRecords', records);
                console.log(`📋 ${records.length} dossiers médicaux chargés`);
              })
            );
          }
          
          // Charger patients et doctors seulement si pas déjà en mémoire
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
          
          if (data.prescriptions.length === 0 || forceReload) {
            prescriptionsPromises.push(
              adminApiClient.getPrescriptions().then(prescriptions => {
                updateData('prescriptions', prescriptions);
                console.log(`💊 ${prescriptions.length} prescriptions chargées`);
              })
            );
          }
          
          // Même logique pour patients et doctors
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


        case "users":
          if (data.users.length === 0 || forceReload) {
            const users = await adminApiClient.getUsers();
            updateData('users', users);
            console.log(`👤 ${users.length} utilisateurs chargés`);
          }
          break;

        case "services":
          if (data.services.length === 0 || forceReload) {
            const services = await adminApiClient.getServices();
            updateData('services', services);
            console.log(`🏥 ${services.length} services chargés`);
          }
          break;
      }

      // MARQUER comme chargé SEULEMENT après succès
      markSectionAsLoaded(section);
      console.log(`✅ Section ${section} chargée et mise en cache`);
      
    } catch (error) {
      console.error(`❌ Erreur lors du chargement de la section ${section}:`, error);
      setActionError(`Impossible de charger les données pour ${section}.`);
    } finally {
      setLoadingState(section, false);
    }
  }, [
    data, 
    dataLoaded, 
    loadingStates,
    updateData, 
    markSectionAsLoaded, 
    setLoadingState, 
    setActionError
  ]);

  // OPTIMISATION: Fonction pour forcer le rechargement si vraiment nécessaire
  const refreshSectionData = useCallback(async (section) => {
    console.log(`🔄 Rechargement forcé de la section ${section}`);
    await loadSectionData(section, true);
  }, [loadSectionData]);

  // Initialize dashboard - UNE SEULE FOIS
  useEffect(() => {
    const initDashboard = async () => {
      // Si déjà initialisé, ne pas refaire l'initialisation
      if (isInitialized) {
        console.log(`✅ Dashboard déjà initialisé, pas de re-initialisation`);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        setInitialLoading(true);
        console.log(`🚀 Initialisation du dashboard admin...`);

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
          console.log(`👤 Profil admin chargé`);
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
        console.log(`📌 Onglet initial: ${initialTab}`);

        // Charger SEULEMENT l'onglet initial
        await loadSectionData(initialTab);
        
        // MARQUER comme initialisé
        setIsInitialized(true);
        console.log(`✅ Dashboard admin initialisé avec succès`);
        
      } catch (err) {
        console.error("❌ Erreur d'initialisation:", err);
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
  }, [navigate, location.pathname, loadSectionData, isInitialized]); // Ajout d'isInitialized

  // OPTIMISATION: Surveiller les changements d'URL SEULEMENT si initialisé
  useEffect(() => {
    if (!isInitialized) return; // Ne pas réagir aux changements d'URL avant l'initialisation

    const pathSegments = location.pathname.split("/").filter(Boolean);
    if (pathSegments.length >= 3 && pathSegments[0] === "admin" && pathSegments[1] === "dashboard") {
      const newTab = pathSegments[2];
      
      // Changer d'onglet SEULEMENT si différent
      if (newTab !== activeTab) {
        console.log(`🔄 Changement d'onglet: ${activeTab} → ${newTab}`);
        setActiveTab(newTab);
        
        // Charger les données SEULEMENT si pas déjà chargées
        if (!dataLoaded[newTab]) {
          console.log(`📊 Données pas encore chargées pour ${newTab}, chargement...`);
          loadSectionData(newTab);
        } else {
          console.log(`✅ Données déjà en cache pour ${newTab}, affichage immédiat`);
        }
      }
    }
  }, [location.pathname, activeTab, isInitialized, dataLoaded, loadSectionData]);

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
    refreshSectionData, // NOUVEAU: Pour forcer le rechargement si nécessaire
    handleLogout
  };
};