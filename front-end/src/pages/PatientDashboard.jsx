// src/pages/PatientDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../axios";
import "../components/patient-dashboard/notification.css";
import "../components/patient-dashboard/PatientDashboard.css";

// Import des composants communs
import ErrorDisplay from "../components/patient-dashboard/common/ErrorDisplay";
import ActionMessages from "../components/patient-dashboard/common/ActionMessages";

// Import des composants de navigation
import Sidebar from "../components/patient-dashboard/Sidebar";
import ContentHeader from "../components/patient-dashboard/ContentHeader";
import MobileNav from "../components/patient-dashboard/MobileNav";

// Import des composants de contenu
import Overview from "../components/patient-dashboard/Overview";
import Appointments from "../components/patient-dashboard/Appointments";
import MedicalRecords from "../components/patient-dashboard/MedicalRecords";
import Prescriptions from "../components/patient-dashboard/Prescriptions";
import Profile from "../components/patient-dashboard/Profile";
import ImprovedBookAppointment from "../components/patient-dashboard/ImprovedBookAppointment";
import Invoices from "../components/patient-dashboard/Invoices";

// Import des styles pour les rendez-vous
import "../components/patient-dashboard/appointment-booking.css";

const PatientDashboard = () => {
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // États pour suivre le chargement des sections
  const [loadingStates, setLoadingStates] = useState({
    overview: false,
    appointments: false,
    medicalRecords: false,
    prescriptions: false,
    profile: false,
    invoices: false,
    book: false
  });

  // États pour stocker les données
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);

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

  // Récupération des données initiales
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
          const profileRes = await axios.get("/api/patient/profile", getAuthHeaders());
          setProfile(profileRes.data.profile || null);
        } catch(profileErr) {
          console.warn("Impossible de charger le profil:", profileErr);
        }
        
        // Déterminer l'onglet actif à partir de l'URL
        const pathSegments = location.pathname.split('/').filter(Boolean);
        let initialTab = "overview";
        
        if (pathSegments.length >= 3 && pathSegments[0] === 'patient' && pathSegments[1] === 'dashboard') {
          initialTab = pathSegments[2];
        }
        
        setActiveTab(initialTab);
        
        // Marquer la section active comme étant en cours de chargement
        setLoadingState(initialTab, true);
        
        // Charger les données de l'onglet initial
        await loadSectionData(initialTab);
        
        // Désactiver le loading initial une fois les données de base chargées
        setInitialLoading(false);
        
      } catch (err) {
        console.error("Erreur:", err);
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
  }, [navigate, location]);

  // Charge les données pour une section spécifique
  const loadSectionData = async (section) => {
    try {
      // Marquer la section comme en cours de chargement
      setLoadingState(section, true);
      
      switch (section) {
        case "overview":
          // Pour l'overview, nous avons besoin de toutes les données mais en version résumée
          const overviewPromises = [];
          
          if (appointments.length === 0) {
            overviewPromises.push(fetchAppointments());
          }
          
          if (medicalRecords.length === 0) {
            overviewPromises.push(fetchMedicalRecords());
          }
          
          if (prescriptions.length === 0) {
            overviewPromises.push(fetchPrescriptions());
          }
          
          if (overviewPromises.length > 0) {
            await Promise.all(overviewPromises);
          }
          break;
          
        case "appointments":
          if (appointments.length === 0) {
            await fetchAppointments();
          }
          
          // On a besoin des docteurs pour les rendez-vous également
          if (doctors.length === 0) {
            await fetchDoctors();
          }
          break;
          
        case "book":
          // La section de prise de rendez-vous a besoin des médecins
          if (doctors.length === 0) {
            await fetchDoctors();
          }
          break;
          
        case "medicalRecords":
          if (medicalRecords.length === 0) {
            await fetchMedicalRecords();
          }
          break;
          
        case "prescriptions":
          if (prescriptions.length === 0) {
            await fetchPrescriptions();
          }
          break;
          
        case "invoices":
          // Les factures sont chargées directement par le composant Invoices
          break;
          
        case "profile":
          // Le profil est déjà chargé
          break;
          
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
  const fetchAppointments = async () => {
    try {
      const appointmentsRes = await axios.get("/api/patient/appointments", getAuthHeaders());
      setAppointments(appointmentsRes.data.appointments || []);
    } catch (error) {
      console.warn("Impossible de charger les rendez-vous:", error);
      throw error;
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      const medicalRecordsRes = await axios.get("/api/patient/medical-records", getAuthHeaders());
      setMedicalRecords(medicalRecordsRes.data.medicalRecords || []);
    } catch (error) {
      console.warn("Impossible de charger les dossiers médicaux:", error);
      throw error;
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const prescriptionsRes = await axios.get("/api/patient/prescriptions", getAuthHeaders());
      setPrescriptions(prescriptionsRes.data.prescriptions || []);
    } catch (error) {
      console.warn("Impossible de charger les ordonnances:", error);
      throw error;
    }
  };

  const fetchDoctors = async () => {
    try {
      const doctorsRes = await axios.get("/api/doctors", getAuthHeaders());
      setDoctors(doctorsRes.data || []);
    } catch (err) {
      // Données fictives si l'endpoint n'existe pas encore
      console.warn("Endpoint des médecins non disponible, utilisation de données fictives");
      setDoctors([
        { id: 1, name: "Dr. House", specialty: "Médecine Générale" },
        { id: 2, name: "Dr. Smith", specialty: "Cardiologie" },
        { id: 3, name: "Dr. Johnson", specialty: "Neurologie" },
      ]);
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

  // Gestion du changement d'onglet
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActionError(null);
    setActionSuccess(null);
    
    // Charger les données de l'onglet à la demande
    loadSectionData(tab);
    
    // Mise à jour de l'URL
    navigate(`/patient/dashboard/${tab}`);
  };

  const handleBookAppointment = async (appointmentData) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await axios.post(
        "/api/patient/appointments",
        appointmentData,
        getAuthHeaders()
      );

      // Ajouter le nouveau rendez-vous à la liste
      const newAppointment = {
        id: response.data.appointment.id,
        date: appointmentData.date,
        time: appointmentData.time,
        doctor: response.data.appointment.doctor || "Dr.",
        status: "en attente",
        reason: appointmentData.reason,
      };

      setAppointments([newAppointment, ...appointments]);
      setActionSuccess("Rendez-vous créé avec succès!");

      // Redirection vers les rendez-vous après la création
      setTimeout(() => {
        setActiveTab("appointments");
        setActionSuccess(null);
        navigate('/patient/dashboard/appointments');
      }, 1500);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setActionError(
          err.response?.data?.message ||
            "Impossible de créer le rendez-vous. Veuillez réessayer plus tard."
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?"))
      return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await axios.delete(`/api/patient/appointments/${id}`, getAuthHeaders());
      
      // Mettre à jour l'état localement
      setAppointments(
        appointments.map((apt) =>
          apt.id === id ? { ...apt, status: "annulé" } : apt
        )
      );
      
      setActionSuccess("Rendez-vous annulé avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setActionError(
          err.response?.data?.message ||
            "Impossible d'annuler le rendez-vous. Veuillez réessayer plus tard."
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProfile = async (updatedProfile) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await axios.put(
        "/api/patient/profile",
        updatedProfile,
        getAuthHeaders()
      );

      // Mettre à jour les données utilisateur et profil
      setUser({
        ...user,
        name: updatedProfile.name,
        email: updatedProfile.email,
      });

      setProfile(response.data.profile || updatedProfile);

      setActionSuccess("Profil mis à jour avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du profil:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setActionError(
          err.response?.data?.message ||
            "Impossible de mettre à jour le profil. Veuillez réessayer plus tard."
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePhoto = async (photoFile) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      // Créer un objet FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append("profile_photo", photoFile);

      const response = await axios.post(
        "/api/patient/profile/photo",
        formData,
        {
          ...getAuthHeaders(),
          headers: {
            ...getAuthHeaders().headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Mettre à jour les données du profil avec la nouvelle photo
      setProfile({
        ...profile,
        photoUrl: response.data.photo_url,
      });

      setActionSuccess("Photo de profil mise à jour avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la photo de profil:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setActionError(
          err.response?.data?.message ||
            "Impossible de mettre à jour la photo. Veuillez réessayer plus tard."
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadDocument = async (id) => {
    try {
      setActionLoading(true);
      const response = await axios.get(
        `/api/patient/documents/${id}/download`,
        { ...getAuthHeaders(), responseType: "blob" }
      );

      // Création du lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Extraction du nom de fichier
      const contentDisposition = response.headers["content-disposition"];
      let filename = "document.pdf";
      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error("Erreur de téléchargement:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        alert(
          "Impossible de télécharger le document. Veuillez réessayer plus tard."
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Affichage en cas d'erreur globale
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // Affichage du tableau de bord
  return (
    <div className="patient-dashboard">
      <Sidebar
        user={user || { name: "Chargement...", email: "" }}
        profile={profile}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        handleLogout={handleLogout}
        actionLoading={actionLoading || initialLoading}
      />

      <main className="main-content">
        <ContentHeader activeTab={activeTab} handleTabChange={handleTabChange} />

        <div className="content-body">
          <ActionMessages success={actionSuccess} error={actionError} />

          {/* Rendus conditionnels avec indicateurs de chargement */}
          {activeTab === "overview" && (
            initialLoading || loadingStates.overview ? (
              <div className="section-loader">
                <div className="loader-indicator"></div>
              </div>
            ) : (
              <Overview
                user={user}
                appointments={appointments}
                medicalRecords={medicalRecords}
                prescriptions={prescriptions}
                handleTabChange={handleTabChange}
                actionLoading={actionLoading}
              />
            )
          )}

          {activeTab === "appointments" && (
            initialLoading || loadingStates.appointments ? (
              <div className="section-loader">
                <div className="loader-indicator"></div>
              </div>
            ) : (
              <Appointments
                appointments={appointments}
                doctors={doctors}
                handleCancelAppointment={handleCancelAppointment}
                handleTabChange={handleTabChange}
                actionLoading={actionLoading}
              />
            )
          )}

          {activeTab === "book" && (
            initialLoading || loadingStates.book ? (
              <div className="section-loader">
                <div className="loader-indicator"></div>
              </div>
            ) : (
              <ImprovedBookAppointment
                handleTabChange={handleTabChange}
                actionLoading={actionLoading}
                onBookAppointment={handleBookAppointment}
              />
            )
          )}

          {activeTab === "medicalRecords" && (
            initialLoading || loadingStates.medicalRecords ? (
              <div className="section-loader">
                <div className="loader-indicator"></div>
              </div>
            ) : (
              <MedicalRecords
                medicalRecords={medicalRecords}
                handleDownloadDocument={handleDownloadDocument}
                actionLoading={actionLoading}
              />
            )
          )}

          {activeTab === "prescriptions" && (
            initialLoading || loadingStates.prescriptions ? (
              <div className="section-loader">
                <div className="loader-indicator"></div>
              </div>
            ) : (
              <Prescriptions
                prescriptions={prescriptions}
                actionLoading={actionLoading}
              />
            )
          )}

          {activeTab === "invoices" && (
            initialLoading || loadingStates.invoices ? (
              <div className="section-loader">
                <div className="loader-indicator"></div>
              </div>
            ) : (
              <Invoices
                actionLoading={actionLoading}
              />
            )
          )}

          {activeTab === "profile" && (
            initialLoading || loadingStates.profile ? (
              <div className="section-loader">
                <div className="loader-indicator"></div>
              </div>
            ) : (
              <Profile
                user={user}
                profile={profile}
                updateProfile={handleUpdateProfile}
                updatePhoto={handleUpdatePhoto}
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

export default PatientDashboard;