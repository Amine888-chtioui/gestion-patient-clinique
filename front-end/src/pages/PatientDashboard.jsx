// src/pages/PatientDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axios";
import "./PatientDashboard.css";

// Import des composants
import LoadingSpinner from "../components/patient-dashboard/common/LoadingSpinner";
import ErrorDisplay from "../components/patient-dashboard/common/ErrorDisplay";
import ActionMessages from "../components/patient-dashboard/common/ActionMessages";
import Sidebar from "../components/patient-dashboard/Sidebar";
import ContentHeader from "../components/patient-dashboard/ContentHeader";
import Overview from "../components/patient-dashboard/Overview";
import Appointments from "../components/patient-dashboard/Appointments";
import BookAppointment from "../components/patient-dashboard/BookAppointment";
import MedicalRecords from "../components/patient-dashboard/MedicalRecords";
import Prescriptions from "../components/patient-dashboard/Prescriptions";
import Profile from "../components/patient-dashboard/Profile";
import MobileNav from "../components/patient-dashboard/MobileNav";

const PatientDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // États pour stocker les données
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);

  // État pour le formulaire de rendez-vous
  const [newAppointment, setNewAppointment] = useState({
    date: "",
    time: "",
    doctor_id: "",
    reason: "",
  });

  // États pour les actions
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const navigate = useNavigate();

  // Fonction utilitaire pour les en-têtes d'autorisation
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  // Récupération des données initiales
  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        setLoading(true);
        // Récupérer les informations de l'utilisateur
        const userResponse = await axios.get("/api/user", getAuthHeaders());
        setUser(userResponse.data);

        if (userResponse.data.role !== "patient") {
          setError(
            "Accès non autorisé. Ce tableau de bord est réservé aux patients."
          );
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        // Récupérer toutes les données en parallèle
        const [
          appointmentsRes,
          medicalRecordsRes,
          prescriptionsRes,
          profileRes,
        ] = await Promise.all([
          axios.get("/api/patient/appointments", getAuthHeaders()),
          axios.get("/api/patient/medical-records", getAuthHeaders()),
          axios.get("/api/patient/prescriptions", getAuthHeaders()),
          axios.get("/api/patient/profile", getAuthHeaders()),
        ]);

        setAppointments(appointmentsRes.data.appointments || []);
        setMedicalRecords(medicalRecordsRes.data.medicalRecords || []);
        setPrescriptions(prescriptionsRes.data.prescriptions || []);
        setProfile(profileRes.data.profile || null);

        // Récupérer la liste des médecins ou utiliser des données fictives
        try {
          const doctorsRes = await axios.get("/api/doctors", getAuthHeaders());
          setDoctors(doctorsRes.data || []);
        } catch (err) {
          // Données fictives si l'endpoint n'existe pas encore
          setDoctors([
            { id: 1, name: "Dr. House", specialty: "Médecine Générale" },
            { id: 2, name: "Dr. Smith", specialty: "Cardiologie" },
            { id: 3, name: "Dr. Johnson", specialty: "Neurologie" },
          ]);
        }
      } catch (err) {
        console.error("Erreur:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError(
            "Impossible de charger les données. Veuillez réessayer plus tard."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleAppointmentChange = (e) => {
    setNewAppointment({ ...newAppointment, [e.target.name]: e.target.value });
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await axios.post(
        "/api/patient/appointments",
        newAppointment,
        getAuthHeaders()
      );

      setAppointments([response.data.appointment, ...appointments]);
      setNewAppointment({ date: "", time: "", doctor_id: "", reason: "" });
      setActionSuccess("Rendez-vous créé avec succès!");

      setTimeout(() => {
        setActiveTab("appointments");
        setActionSuccess(null);
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
      console.error(
        "Erreur lors de la mise à jour de la photo de profil:",
        err
      );
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

  // Affichage en cas de chargement
  if (loading) {
    return <LoadingSpinner />;
  }

  // Affichage en cas d'erreur
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // Affichage du tableau de bord
  return (
    <div className="patient-dashboard">
      <Sidebar
        user={user}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        handleLogout={handleLogout}
        actionLoading={actionLoading}
      />

      <main className="main-content">
        <ContentHeader activeTab={activeTab} />

        <div className="content-body">
          <ActionMessages success={actionSuccess} error={actionError} />

          {activeTab === "overview" && (
            <Overview
              user={user}
              appointments={appointments}
              medicalRecords={medicalRecords}
              prescriptions={prescriptions}
              handleTabChange={handleTabChange}
              actionLoading={actionLoading}
            />
          )}

          {activeTab === "appointments" && (
            <Appointments
              appointments={appointments}
              handleCancelAppointment={handleCancelAppointment}
              handleTabChange={handleTabChange}
              actionLoading={actionLoading}
            />
          )}

          {activeTab === "book" && (
            <BookAppointment
              newAppointment={newAppointment}
              doctors={doctors}
              handleAppointmentChange={handleAppointmentChange}
              handleBookAppointment={handleBookAppointment}
              handleTabChange={handleTabChange}
              actionLoading={actionLoading}
            />
          )}

          {activeTab === "medicalRecords" && (
            <MedicalRecords
              medicalRecords={medicalRecords}
              handleDownloadDocument={handleDownloadDocument}
              actionLoading={actionLoading}
            />
          )}

          {activeTab === "prescriptions" && (
            <Prescriptions
              prescriptions={prescriptions}
              actionLoading={actionLoading}
            />
          )}

          {activeTab === "profile" && (
            <Profile
              user={user}
              profile={profile}
              updateProfile={handleUpdateProfile}
              updatePhoto={handleUpdatePhoto}
              actionLoading={actionLoading}
            />
          )}
        </div>
      </main>

      <MobileNav activeTab={activeTab} handleTabChange={handleTabChange} />
    </div>
  );
};

export default PatientDashboard;
