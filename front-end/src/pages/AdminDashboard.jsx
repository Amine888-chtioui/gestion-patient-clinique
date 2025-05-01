// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../axios";
import "../components/admin-dashboard/admin-dashboard.css";
import "../styles/invoices.css";

// Import des composants communs
import LoadingSpinner from "../components/patient-dashboard/common/LoadingSpinner";
import ErrorDisplay from "../components/patient-dashboard/common/ErrorDisplay";
import ActionMessages from "../components/patient-dashboard/common/ActionMessages";

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
import "../components/admin-dashboard/payment-status-viewer.css";
import "../components/admin-dashboard/admin-payment-methods.css";

// Import des composants de factures
import InvoiceList from "../components/invoices/InvoiceList";
import InvoiceDetails from "../components/invoices/InvoiceDetails";
import InvoiceForm from "../components/invoices/InvoiceForm";
import PaymentStatusViewer from "../components/admin-dashboard/PaymentStatusViewer";
import AdminProfile from "../components/admin-dashboard/AdminProfile";
import "../components/admin-dashboard/admin-profile.css";
import "../components/admin-dashboard/admin-dashboard.css";

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // États pour suivre le chargement des sections
  const [loadingStates, setLoadingStates] = useState({
    patients: false,
    doctors: false,
    appointments: false,
    medicalRecords: false,
    users: false,
    statistics: false,
    payments: false,
    invoices: false,
    profile: false  // Added this line
  });
  // Ajouter un nouvel état pour le profil admin
  const [adminProfile, setAdminProfile] = useState(null);
  // États pour stocker les données
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});

  // États pour les actions
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  
  // États pour les fonctionnalités de factures
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [invoiceMode, setInvoiceMode] = useState("list"); 

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

        if (userResponse.data.role !== "admin") {
          setError(
            "Accès non autorisé. Ce tableau de bord est réservé aux administrateurs."
          );
          setTimeout(() => navigate("/"), 3000);
          return;
        }
           // Récupérer le profil de l'administrateur
      try {
        const profileResponse = await axios.get("/api/admin/profile", getAuthHeaders());
        setAdminProfile(profileResponse.data.profile);
      } catch (profileErr) {
        console.warn("Impossible de charger le profil administrateur:", profileErr);
      }
        // Déterminer l'onglet actif à partir de l'URL
        const pathSegments = location.pathname.split('/').filter(Boolean);
        let initialTab = "overview";
        
        if (pathSegments.length >= 3 && pathSegments[0] === 'admin' && pathSegments[1] === 'dashboard') {
          initialTab = pathSegments[2];
          
          if (initialTab === 'invoices' && pathSegments.length >= 4) {
            if (pathSegments[3] === 'create') {
              setInvoiceMode('create');
            } else if (pathSegments.length >= 5 && pathSegments[3] === 'edit') {
              setInvoiceMode('edit');
              setSelectedInvoiceId(pathSegments[4]);
            } else {
              setInvoiceMode('details');
              setSelectedInvoiceId(pathSegments[3]);
            }
          }
        }
        
        setActiveTab(initialTab);
        
        // Chargement initial des statistiques (données légères)
        await fetchStats();
        
        // Charger les données de l'onglet initial
        await loadSectionData(initialTab);

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
      } finally {
        setInitialLoading(false);
      }
    };

    initDashboard();
  }, []);

  // Charge les données pour une section spécifique
  const loadSectionData = async (section) => {
    try {
      // Marquer la section comme en cours de chargement
      setLoadingState(section, true);
      
      switch (section) {
        case "overview":
          if (Object.keys(stats).length === 0) {
            await fetchStats();
          }
          break;
          
        case "patients":
          if (patients.length === 0) {
            await fetchPatients();
          }
          break;
          
        case "doctors":
          if (doctors.length === 0) {
            await fetchDoctors();
          }
          break;
          
        case "appointments":
          const appointmentsNeeded = appointments.length === 0;
          const patientsNeeded = patients.length === 0;
          const doctorsNeeded = doctors.length === 0;
          
          if (appointmentsNeeded || patientsNeeded || doctorsNeeded) {
            const fetchPromises = [];
            
            if (appointmentsNeeded) fetchPromises.push(fetchAppointments());
            if (patientsNeeded) fetchPromises.push(fetchPatients());
            if (doctorsNeeded) fetchPromises.push(fetchDoctors());
            
            await Promise.all(fetchPromises);
          }
          break;
          
        case "medicalRecords":
          const recordsNeeded = medicalRecords.length === 0;
          const patNeeded = patients.length === 0;
          const docNeeded = doctors.length === 0;
          
          if (recordsNeeded || patNeeded || docNeeded) {
            const fetchPromises = [];
            
            if (recordsNeeded) fetchPromises.push(fetchMedicalRecords());
            if (patNeeded) fetchPromises.push(fetchPatients());
            if (docNeeded) fetchPromises.push(fetchDoctors());
            
            await Promise.all(fetchPromises);
          }
          break;
          
        case "statistics":
          await fetchStats();
          break;
          
        case "users":
          if (users.length === 0) {
            await fetchUsers();
          }
          break;
          
        // Les autres sections comme invoices et payments utiliseront
        // leurs propres mécanismes de chargement à l'intérieur de leurs composants
          
        default:
          break;
      }
    } catch (error) {
      console.error(`Erreur lors du chargement de la section ${section}:`, error);
      setActionError(`Impossible de charger les données pour ${section}.`);
    } finally {
      // Marquer la section comme chargée
      setLoadingState(section, false);
    }
  };

  // Fonctions de récupération de données individuelles
  const fetchStats = async () => {
    try {
      const statsRes = await axios.get("/api/admin/statistics", getAuthHeaders());
      setStats(statsRes.data || {});
    } catch (error) {
      console.warn("Impossible de charger les statistiques:", error);
      throw error;
    }
  };

  const fetchPatients = async () => {
    try {
      const patientsRes = await axios.get("/api/admin/patients", getAuthHeaders());
      setPatients(patientsRes.data.patients || []);
    } catch (error) {
      console.warn("Impossible de charger les patients:", error);
      throw error;
    }
  };

  const fetchDoctors = async () => {
    try {
      const doctorsRes = await axios.get("/api/admin/doctors", getAuthHeaders());
      setDoctors(doctorsRes.data.doctors || []);
    } catch (error) {
      console.warn("Impossible de charger les médecins:", error);
      throw error;
    }
  };

  const fetchAppointments = async () => {
    try {
      const appointmentsRes = await axios.get("/api/admin/appointments", getAuthHeaders());
      setAppointments(appointmentsRes.data.appointments || []);
    } catch (error) {
      console.warn("Impossible de charger les rendez-vous:", error);
      throw error;
    }
  };

  const fetchUsers = async () => {
    try {
      const usersRes = await axios.get("/api/admin/users", getAuthHeaders());
      setUsers(usersRes.data.users || []);
    } catch (error) {
      console.warn("Impossible de charger les utilisateurs:", error);
      throw error;
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      try {
        const medicalRecordsRes = await axios.get("/api/admin/medical-records", getAuthHeaders());
        setMedicalRecords(medicalRecordsRes.data.medicalRecords || []);
      } catch (err) {
        // Si l'endpoint n'existe pas encore, utilisez une liste vide
        console.warn("Endpoint des dossiers médicaux non disponible");
        setMedicalRecords([]);
      }
    } catch (error) {
      console.warn("Impossible de charger les dossiers médicaux:", error);
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
    }
  };

  // Gestion du changement d'onglet - c'est ici que le chargement à la demande se produit
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActionError(null);
    setActionSuccess(null);
    
    // Si on change d'onglet, réinitialiser l'état des factures
    if (tab !== 'invoices') {
      setInvoiceMode('list');
      setSelectedInvoiceId(null);
    }
    
    // Charger les données nécessaires pour cet onglet
    loadSectionData(tab);
    
    // Mise à jour de l'URL
    navigate(`/admin/dashboard/${tab}`);
  };
  
  // Gestion de la navigation dans les factures
  const handleInvoiceAction = (action, id = null) => {
    setInvoiceMode(action);
    setSelectedInvoiceId(id);
    
    // Mise à jour de l'URL en fonction de l'action
    if (action === 'list') {
      navigate('/admin/dashboard/invoices');
    } else if (action === 'details' && id) {
      navigate(`/admin/dashboard/invoices/${id}`);
    } else if (action === 'create') {
      navigate('/admin/dashboard/invoices/create');
    } else if (action === 'edit' && id) {
      navigate(`/admin/dashboard/invoices/edit/${id}`);
    }
  };

  // Gestion des patients
  const handleAddPatient = async (patientData) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await axios.post(
        "/api/admin/patients",
        patientData,
        getAuthHeaders()
      );

      // Ajouter le nouveau patient à la liste
      setPatients([response.data.patient, ...patients]);
      setActionSuccess("Patient ajouté avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePatient = async (id, patientData) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await axios.put(
        `/api/admin/patients/${id}`,
        patientData,
        getAuthHeaders()
      );

      // Mettre à jour le patient dans la liste
      setPatients(
        patients.map((patient) =>
          patient.id === id ? response.data.patient : patient
        )
      );
      setActionSuccess("Patient mis à jour avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePatient = async (id) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await axios.delete(`/api/admin/patients/${id}`, getAuthHeaders());
      
      // Retirer le patient de la liste
      setPatients(patients.filter(patient => patient.id !== id));
      setActionSuccess("Patient supprimé avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Gestion des médecins
  const handleAddDoctor = async (doctorData) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await axios.post(
        "/api/admin/doctors",
        doctorData,
        getAuthHeaders()
      );

      // Ajouter le nouveau médecin à la liste
      setDoctors([response.data.doctor, ...doctors]);
      setActionSuccess("Médecin ajouté avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDoctor = async (id, doctorData) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await axios.put(
        `/api/admin/doctors/${id}`,
        doctorData,
        getAuthHeaders()
      );

      // Mettre à jour le médecin dans la liste
      setDoctors(
        doctors.map((doctor) =>
          doctor.id === id ? response.data.doctor : doctor
        )
      );
      setActionSuccess("Médecin mis à jour avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDoctor = async (id) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await axios.delete(`/api/admin/doctors/${id}`, getAuthHeaders());
      
      // Retirer le médecin de la liste
      setDoctors(doctors.filter(doctor => doctor.id !== id));
      setActionSuccess("Médecin supprimé avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Gestion des rendez-vous
  const handleAddAppointment = async (appointmentData) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await axios.post(
        "/api/admin/appointments",
        appointmentData,
        getAuthHeaders()
      );

      // Ajouter le nouveau rendez-vous à la liste
      setAppointments([response.data.appointment, ...appointments]);
      setActionSuccess("Rendez-vous ajouté avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAppointment = async (id, appointmentData) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await axios.put(
        `/api/admin/appointments/${id}`,
        appointmentData,
        getAuthHeaders()
      );

      // Mettre à jour le rendez-vous dans la liste
      setAppointments(
        appointments.map((appointment) =>
          appointment.id === id ? response.data.appointment : appointment
        )
      );
      setActionSuccess("Rendez-vous mis à jour avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAppointment = async (id) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await axios.delete(`/api/admin/appointments/${id}`, getAuthHeaders());
      
      // Retirer le rendez-vous de la liste
      setAppointments(appointments.filter(appointment => appointment.id !== id));
      setActionSuccess("Rendez-vous supprimé avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Gestion des utilisateurs
  const handleAddUser = async (userData) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await axios.post(
        "/api/admin/users",
        userData,
        getAuthHeaders()
      );

      // Ajouter le nouvel utilisateur à la liste
      setUsers([response.data.user, ...users]);
      setActionSuccess("Utilisateur ajouté avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (id, userData) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await axios.put(
        `/api/admin/users/${id}`,
        userData,
        getAuthHeaders()
      );

      // Mettre à jour l'utilisateur dans la liste
      setUsers(
        users.map((user) =>
          user.id === id ? response.data.user : user
        )
      );
      setActionSuccess("Utilisateur mis à jour avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await axios.delete(`/api/admin/users/${id}`, getAuthHeaders());
      
      // Retirer l'utilisateur de la liste
      setUsers(users.filter(user => user.id !== id));
      setActionSuccess("Utilisateur supprimé avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Gestion générique des erreurs d'API
  const handleApiError = (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
    } else {
      setActionError(
        err.response?.data?.message ||
          "Une erreur est survenue. Veuillez réessayer."
      );
    }
  };

  // Affichage durant le chargement initial du composant
  if (initialLoading) {
    return <LoadingSpinner />;
  }

  // Affichage en cas d'erreur globale
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // Rendu du contenu pour les factures
  const renderInvoiceContent = () => {
    switch (invoiceMode) {
      case 'details':
        return <InvoiceDetails />;
      case 'create':
        return <InvoiceForm />;
      case 'edit':
        return <InvoiceForm />;
      case 'list':
      default:
        return <InvoiceList onInvoiceAction={handleInvoiceAction} />;
    }
  };

  // Affichage du tableau de bord
  return (
    <div className="admin-dashboard">
    <AdminSidebar
      user={user}
      profile={adminProfile}  // Ajout de cette prop
      activeTab={activeTab}
      handleTabChange={handleTabChange}
      handleLogout={handleLogout}
      actionLoading={actionLoading}
    />

      <main className="main-content">
        <ContentHeader activeTab={activeTab} />

        <div className="content-body">
          <ActionMessages success={actionSuccess} error={actionError} />

          {/* Rendu conditionnel des sections avec indicateurs de chargement locaux */}
          {activeTab === "overview" && (
            <>
              {loadingStates.overview ? (
                <div className="section-loader">
                  <div className="loader-indicator"></div>
                </div>
              ) : (
                <AdminOverview
                  stats={stats}
                  handleTabChange={handleTabChange}
                  actionLoading={actionLoading}
                />
              )}
            </>
          )}

          {activeTab === "patients" && (
            <>
              {loadingStates.patients ? (
                <div className="section-loader">
                  <div className="loader-indicator"></div>
                </div>
              ) : (
                <PatientsManagement
                  patients={patients}
                  doctors={doctors}
                  handleAddPatient={handleAddPatient}
                  handleUpdatePatient={handleUpdatePatient}
                  handleDeletePatient={handleDeletePatient}
                  actionLoading={actionLoading}
                />
              )}
            </>
          )}

          {activeTab === "doctors" && (
            <>
              {loadingStates.doctors ? (
                <div className="section-loader">
                  <div className="loader-indicator"></div>
                </div>
              ) : (
                <DoctorsManagement
                  doctors={doctors}
                  handleAddDoctor={handleAddDoctor}
                  handleUpdateDoctor={handleUpdateDoctor}
                  handleDeleteDoctor={handleDeleteDoctor}
                  actionLoading={actionLoading}
                />
              )}
            </>
          )}

          {activeTab === "appointments" && (
            <>
              {loadingStates.appointments ? (
                <div className="section-loader">
                  <div className="loader-indicator"></div>
                </div>
              ) : (
                <AppointmentsManagement
                  appointments={appointments}
                  patients={patients}
                  doctors={doctors}
                  handleAddAppointment={handleAddAppointment}
                  handleUpdateAppointment={handleUpdateAppointment}
                  handleDeleteAppointment={handleDeleteAppointment}
                  actionLoading={actionLoading}
                />
              )}
            </>
          )}

          {activeTab === "medicalRecords" && (
            <>
              {loadingStates.medicalRecords ? (
                <div className="section-loader">
                  <div className="loader-indicator"></div>
                </div>
              ) : (
                <MedicalRecordsManagement
                  medicalRecords={medicalRecords}
                  patients={patients}
                  doctors={doctors}
                  actionLoading={actionLoading}
                />
              )}
            </>
          )}

          {activeTab === "statistics" && (
            <>
              {loadingStates.statistics ? (
                <div className="section-loader">
                  <div className="loader-indicator"></div>
                </div>
              ) : (
                <StatisticsView
                  stats={stats}
                  actionLoading={actionLoading}
                />
              )}
            </>
          )}

          {activeTab === "users" && (
            <>
              {loadingStates.users ? (
                <div className="section-loader">
                  <div className="loader-indicator"></div>
                </div>
              ) : (
                <UsersManagement
                  users={users}
                  handleAddUser={handleAddUser}
                  handleUpdateUser={handleUpdateUser}
                  handleDeleteUser={handleDeleteUser}
                  actionLoading={actionLoading}
                />
              )}
            </>
          )}
          {activeTab === "profile" && (
              <>
                {loadingStates.profile ? (
                  <div className="section-loader">
                    <div className="loader-indicator"></div>
                  </div>
                ) : (
                  <AdminProfile
                    user={user}
                    actionLoading={actionLoading}
                    setActionLoading={setActionLoading}
                    setActionError={setActionError}
                    setActionSuccess={setActionSuccess}
                  />
                )}
              </>
            )}
          
          {activeTab === "invoices" && renderInvoiceContent()}
          
          {activeTab === "payments" && (
            <div>
              <PaymentStatusViewer />
              <PaymentMethodsManagement 
                actionLoading={actionLoading}
                setActionLoading={setActionLoading}
                setActionError={setActionError}
                setActionSuccess={setActionSuccess}
              />
            </div>
          )}
        </div>
      </main>

      <MobileNav activeTab={activeTab} handleTabChange={handleTabChange} />
    </div>
  );
};

export default AdminDashboard;