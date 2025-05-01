// src/pages/DoctorDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axios";
import "../components/doctor-dashboard/doctor-dashboard.css";
import "../components/doctor-dashboard/doctor-notification.css"; // Import du CSS des notifications

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

const DoctorDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSubTab, setActiveSubTab] = useState(null);

  // États pour stocker les données
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // États pour les actions
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [profile, setProfile] = useState(null); // État pour stocker le profil de l'utilisateur

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

        if (userResponse.data.role !== "doctor") {
          setError(
            "Accès non autorisé. Ce tableau de bord est réservé aux médecins."
          );
          setTimeout(() => navigate("/"), 3000);
          return;
        }
        // Récupérer le profil de l'utilisateur
        const profileResponse = await axios.get("/api/doctor/profile", getAuthHeaders());
        setProfile(profileResponse.data.profile);
        
        // Récupérer toutes les données en parallèle
        const [appointmentsRes, patientsRes] = await Promise.all([
          axios.get("/api/doctor/appointments", getAuthHeaders()),
          axios.get("/api/doctor/patients", getAuthHeaders()),
        ]);

        setAppointments(appointmentsRes.data.appointments || []);
        setPatients(patientsRes.data.patients || []);

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
    setActiveSubTab(null);
    setSelectedPatient(null);
    setSelectedAppointment(null);
    setActionError(null);
    setActionSuccess(null);
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
      console.error("Erreur lors de la récupération des détails du patient:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setActionError(
          err.response?.data?.message ||
          "Impossible de récupérer les détails du patient. Veuillez réessayer plus tard."
        );
      }
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
      console.error("Erreur:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setActionError(
          "Impossible de récupérer les détails du patient. Veuillez réessayer plus tard."
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAppointmentStatus = async (id, status) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await axios.put(
        `/api/doctor/appointments/${id}`,
        { status },
        getAuthHeaders()
      );

      setAppointments(
        appointments.map((apt) =>
          apt.id === id ? { ...apt, status: status } : apt
        )
      );

      setActionSuccess(`Statut du rendez-vous mis à jour : ${status}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setActionError(
          err.response?.data?.message ||
            "Impossible de mettre à jour le rendez-vous. Veuillez réessayer plus tard."
        );
      }
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

      const response = await axios.post(
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
        setActiveTab("appointments");
        setSelectedPatient(null);
        setSelectedAppointment(null);
        setActiveSubTab(null);
        setActionSuccess(null);
      }, 1500);
      
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setActionError(
          err.response?.data?.message ||
            "Impossible de créer le dossier médical. Veuillez réessayer plus tard."
        );
      }
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

      const response = await axios.post(
        "/api/doctor/prescriptions",
        prescriptionData,
        getAuthHeaders()
      );

      setActionSuccess("Ordonnance créée avec succès");
      
      // Réinitialiser la sélection après la création
      setTimeout(() => {
        if (selectedAppointment) {
          setActiveTab("appointments");
        } else {
          setActiveTab("patients");
        }
        setSelectedPatient(null);
        setSelectedAppointment(null);
        setActiveSubTab(null);
        setActionSuccess(null);
      }, 1500);
      
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setActionError(
          err.response?.data?.message ||
            "Impossible de créer l'ordonnance. Veuillez réessayer plus tard."
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
        "/api/doctor/profile",
        updatedProfile,
        getAuthHeaders()
      );

      // Mettre à jour les données utilisateur
      setUser({
        ...user,
        name: updatedProfile.name,
        email: updatedProfile.email,
      });

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
    <div className="doctor-dashboard">
      <DoctorSidebar
        user={user}
        profile={profile}  // Ajout de cette prop
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        handleLogout={handleLogout}
        actionLoading={actionLoading}
      />

      <main className="main-content">
        <ContentHeader 
          activeTab={activeTab} 
          activeSubTab={activeSubTab} 
          selectedPatient={selectedPatient}
        />

        <div className="content-body">
          <ActionMessages success={actionSuccess} error={actionError} />

          {activeTab === "overview" && (
            <DoctorOverview
              user={user}
              appointments={appointments}
              patients={patients}
              handleTabChange={handleTabChange}
              actionLoading={actionLoading}
            />
          )}

          {activeTab === "appointments" && !activeSubTab && (
            <DoctorAppointments
              appointments={appointments}
              handleUpdateStatus={handleUpdateAppointmentStatus}
              handleAppointmentSelect={handleAppointmentSelect}
              actionLoading={actionLoading}
            />
          )}

          {activeTab === "patients" && !activeSubTab && (
            <DoctorPatients
              patients={patients}
              handlePatientSelect={handlePatientSelect}
              actionLoading={actionLoading}
            />
          )}

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
            <DoctorProfile
              user={user}
              updateProfile={handleUpdateProfile}
              actionLoading={actionLoading}
            />
          )}
        </div>
      </main>

      <MobileNav activeTab={activeTab} handleTabChange={handleTabChange} />
    </div>
  );
};

export default DoctorDashboard;