// src/hooks/useDoctorDashboard.js
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

  // Data loaded flags
  const [dataLoaded, setDataLoaded] = useState({
    overview: false,
    appointments: false,
    patients: false,
    medicalRecords: false,
    prescriptions: false,
    invoices: false,
    schedules: true,
    profile: true
  });

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

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

  // Data loading functions
  const loadSectionData = useCallback(async (section) => {
    if (dataLoaded[section]) return;

    setLoadingState(section, true);
    try {
      switch (section) {
        case "overview":
          const overviewPromises = [];
          if (data.appointments.length === 0) {
            overviewPromises.push(
              doctorApiClient.getAppointments().then(appointments => 
                updateData('appointments', appointments)
              )
            );
          }
          if (data.patients.length === 0) {
            overviewPromises.push(
              doctorApiClient.getPatients().then(patients => 
                updateData('patients', patients)
              )
            );
          }
          await Promise.all(overviewPromises);
          break;

        case "appointments":
          if (data.appointments.length === 0) {
            const appointments = await doctorApiClient.getAppointments();
            updateData('appointments', appointments);
          }
          break;

        case "patients":
          if (data.patients.length === 0) {
            const patients = await doctorApiClient.getPatients();
            updateData('patients', patients);
          }
          break;

        case "medicalRecords":
          if (data.medicalRecords.length === 0) {
            const medicalRecords = await doctorApiClient.getMedicalRecords();
            updateData('medicalRecords', medicalRecords);
          }
          if (data.patients.length === 0) {
            const patients = await doctorApiClient.getPatients();
            updateData('patients', patients);
          }
          break;

        case "prescriptions":
          if (data.prescriptions.length === 0) {
            const prescriptions = await doctorApiClient.getPrescriptions();
            updateData('prescriptions', prescriptions);
          }
          if (data.patients.length === 0) {
            const patients = await doctorApiClient.getPatients();
            updateData('patients', patients);
          }
          break;

        case "invoices":
          if (data.invoices.length === 0) {
            const invoices = await doctorApiClient.getInvoices();
            updateData('invoices', invoices);
          }
          if (data.patients.length === 0) {
            const patients = await doctorApiClient.getPatients();
            updateData('patients', patients);
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

        const userResponse = await doctorApiClient.getUser();
        setUser(userResponse);

        if (userResponse.role !== "doctor") {
          setError("Accès non autorisé. Ce tableau de bord est réservé aux médecins.");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        try {
          const profileResponse = await doctorApiClient.getProfile();
          setProfile(profileResponse);
        } catch (profileErr) {
          console.warn("Impossible de charger le profil du médecin:", profileErr);
        }

        const pathSegments = location.pathname.split("/").filter(Boolean);
        let initialTab = "overview";
        if (pathSegments.length >= 3 && pathSegments[0] === "doctor" && pathSegments[1] === "dashboard") {
          initialTab = pathSegments[2];
        }

        setActiveTab(initialTab);
        await loadSectionData(initialTab);
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

    initDashboard();
  }, [navigate, location.pathname, loadSectionData]);

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
    
    // Utils
    getAuthHeaders
  };
};