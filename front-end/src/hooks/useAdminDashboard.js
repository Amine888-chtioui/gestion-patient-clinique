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

  // Data loaded flags
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

  // Data loading function
  const loadSectionData = useCallback(async (section, forceReload = false) => {
    if (dataLoaded[section] && !forceReload) {
      return;
    }

    setLoadingState(section, true);
    try {
      switch (section) {
        case "overview":
          if (Object.keys(data.stats).length === 0 || forceReload) {
            const stats = await adminApiClient.getStatistics();
            updateData('stats', stats);
          }
          break;

        case "patients":
          if (data.patients.length === 0 || forceReload) {
            const patients = await adminApiClient.getPatients();
            updateData('patients', patients);
          }
          break;

        case "doctors":
          if (data.doctors.length === 0 || forceReload) {
            const doctors = await adminApiClient.getDoctors();
            updateData('doctors', doctors);
          }
          break;

        case "appointments":
          const appointmentsNeeded = data.appointments.length === 0 || forceReload;
          const patientsNeeded = data.patients.length === 0 || forceReload;
          const doctorsNeeded = data.doctors.length === 0 || forceReload;

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

          await Promise.all(promises);
          break;

        case "medicalRecords":
          const recordsPromises = [];
          
          if (data.medicalRecords.length === 0 || forceReload) {
            recordsPromises.push(
              adminApiClient.getMedicalRecords().then(records => 
                updateData('medicalRecords', records)
              )
            );
          }
          
          if (data.patients.length === 0) {
            recordsPromises.push(
              adminApiClient.getPatients().then(patients => {
                updateData('patients', patients);
                markSectionAsLoaded('patients');
              })
            );
          }
          
          if (data.doctors.length === 0) {
            recordsPromises.push(
              adminApiClient.getDoctors().then(doctors => {
                updateData('doctors', doctors);
                markSectionAsLoaded('doctors');
              })
            );
          }

          await Promise.all(recordsPromises);
          break;

        case "prescriptions":
          const prescriptionsPromises = [];
          
          if (data.prescriptions.length === 0 || forceReload) {
            prescriptionsPromises.push(
              adminApiClient.getPrescriptions().then(prescriptions => 
                updateData('prescriptions', prescriptions)
              )
            );
          }
          
          if (data.patients.length === 0) {
            prescriptionsPromises.push(
              adminApiClient.getPatients().then(patients => {
                updateData('patients', patients);
                markSectionAsLoaded('patients');
              })
            );
          }
          
          if (data.doctors.length === 0) {
            prescriptionsPromises.push(
              adminApiClient.getDoctors().then(doctors => {
                updateData('doctors', doctors);
                markSectionAsLoaded('doctors');
              })
            );
          }

          await Promise.all(prescriptionsPromises);
          break;

        case "statistics":
          const stats = await adminApiClient.getStatistics();
          updateData('stats', stats);
          break;

        case "users":
          if (data.users.length === 0 || forceReload) {
            const users = await adminApiClient.getUsers();
            updateData('users', users);
          }
          break;

        case "services":
          if (data.services.length === 0 || forceReload) {
            const services = await adminApiClient.getServices();
            updateData('services', services);
          }
          break;
      }

      markSectionAsLoaded(section);
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
  }, []);

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

// src/hooks/useAdminActions.js
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApiClient from '../services/adminApiClient';

export const useAdminActions = (dashboardState) => {
  const navigate = useNavigate();
  const {
    data,
    updateData,
    setActionLoading,
    setActionError,
    setActionSuccess,
    clearMessages,
    handleApiError
  } = dashboardState;

  // Navigation
  const handleTabChange = useCallback((tab) => {
    dashboardState.setActiveTab(tab);
    clearMessages();

    if (tab !== "invoices") {
      dashboardState.setInvoiceMode("list");
      dashboardState.setSelectedInvoiceId(null);
    }

    dashboardState.loadSectionData(tab);
    navigate(`/admin/dashboard/${tab}`);
  }, [dashboardState, clearMessages, navigate]);

  const handleInvoiceAction = useCallback((action, id = null) => {
    dashboardState.setInvoiceMode(action);
    dashboardState.setSelectedInvoiceId(id);

    if (action === "list") {
      navigate("/admin/dashboard/invoices");
    } else if (action === "details" && id) {
      navigate(`/admin/dashboard/invoices/${id}`);
    } else if (action === "create") {
      navigate("/admin/dashboard/invoices/create");
    } else if (action === "edit" && id) {
      navigate(`/admin/dashboard/invoices/edit/${id}`);
    }
  }, [dashboardState, navigate]);

  // Generic CRUD operations
  const createEntity = useCallback(async (entityType, entityData) => {
    setActionLoading(true);
    clearMessages();

    try {
      const response = await adminApiClient[`create${entityType}`](entityData);
      const entities = data[entityType.toLowerCase() + 's'] || data[entityType.toLowerCase()];
      updateData(entityType.toLowerCase() + 's', [response[entityType.toLowerCase()], ...entities]);
      setActionSuccess(`${entityType} ajouté avec succès!`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [data, updateData, setActionLoading, clearMessages, setActionSuccess, handleApiError]);

  const updateEntity = useCallback(async (entityType, id, entityData) => {
    setActionLoading(true);
    clearMessages();

    try {
      const response = await adminApiClient[`update${entityType}`](id, entityData);
      const entities = data[entityType.toLowerCase() + 's'] || data[entityType.toLowerCase()];
      updateData(
        entityType.toLowerCase() + 's',
        entities.map((entity) =>
          entity.id === id ? response[entityType.toLowerCase()] : entity
        )
      );
      setActionSuccess(`${entityType} mis à jour avec succès!`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [data, updateData, setActionLoading, clearMessages, setActionSuccess, handleApiError]);

  const deleteEntity = useCallback(async (entityType, id) => {
    setActionLoading(true);
    clearMessages();

    try {
      await adminApiClient[`delete${entityType}`](id);
      const entities = data[entityType.toLowerCase() + 's'] || data[entityType.toLowerCase()];
      updateData(
        entityType.toLowerCase() + 's',
        entities.filter((entity) => entity.id !== id)
      );
      setActionSuccess(`${entityType} supprimé avec succès!`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [data, updateData, setActionLoading, clearMessages, setActionSuccess, handleApiError]);

  // Specific entity handlers
  const handleAddPatient = useCallback(async (patientData) => {
    await createEntity('Patient', patientData);
  }, [createEntity]);

  const handleUpdatePatient = useCallback(async (id, patientData) => {
    await updateEntity('Patient', id, patientData);
  }, [updateEntity]);

  const handleDeletePatient = useCallback(async (id) => {
    await deleteEntity('Patient', id);
  }, [deleteEntity]);

  const handleAddDoctor = useCallback(async (doctorData) => {
    await createEntity('Doctor', doctorData);
  }, [createEntity]);

  const handleUpdateDoctor = useCallback(async (id, doctorData) => {
    await updateEntity('Doctor', id, doctorData);
  }, [updateEntity]);

  const handleDeleteDoctor = useCallback(async (id) => {
    await deleteEntity('Doctor', id);
  }, [deleteEntity]);

  const handleAddAppointment = useCallback(async (appointmentData) => {
    await createEntity('Appointment', appointmentData);
  }, [createEntity]);

  const handleUpdateAppointment = useCallback(async (id, appointmentData) => {
    await updateEntity('Appointment', id, appointmentData);
  }, [updateEntity]);

  const handleDeleteAppointment = useCallback(async (id) => {
    await deleteEntity('Appointment', id);
  }, [deleteEntity]);

  const handleAddUser = useCallback(async (userData) => {
    await createEntity('User', userData);
  }, [createEntity]);

  const handleUpdateUser = useCallback(async (id, userData) => {
    await updateEntity('User', id, userData);
  }, [updateEntity]);

  const handleDeleteUser = useCallback(async (id) => {
    await deleteEntity('User', id);
  }, [deleteEntity]);

  const handleAddPrescription = useCallback(async (prescriptionData) => {
    await createEntity('Prescription', prescriptionData);
  }, [createEntity]);

  const handleUpdatePrescription = useCallback(async (id, prescriptionData) => {
    await updateEntity('Prescription', id, prescriptionData);
  }, [updateEntity]);

  const handleDeletePrescription = useCallback(async (id) => {
    await deleteEntity('Prescription', id);
  }, [deleteEntity]);

  return {
    handleTabChange,
    handleInvoiceAction,
    handleAddPatient,
    handleUpdatePatient,
    handleDeletePatient,
    handleAddDoctor,
    handleUpdateDoctor,
    handleDeleteDoctor,
    handleAddAppointment,
    handleUpdateAppointment,
    handleDeleteAppointment,
    handleAddUser,
    handleUpdateUser,
    handleDeleteUser,
    handleAddPrescription,
    handleUpdatePrescription,
    handleDeletePrescription
  };
};