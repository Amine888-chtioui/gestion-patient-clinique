// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axios";
import "../components/admin-dashboard/admin-dashboard.css";

// Import des composants
import AdminSidebar from "../components/admin-dashboard/AdminSidebar";
import ContentHeader from "../components/admin-dashboard/ContentHeader";
import AdminOverview from "../components/admin-dashboard/AdminOverview";
import PatientsManagement from "../components/admin-dashboard/PatientsManagement";
import DoctorsManagement from "../components/admin-dashboard/DoctorsManagement";
import AppointmentsManagement from "../components/admin-dashboard/AppointmentsManagement";
import MedicalRecordsManagement from "../components/admin-dashboard/MedicalRecordsManagement";
import StatisticsView from "../components/admin-dashboard/StatisticsView";
import UsersManagement from "../components/admin-dashboard/UsersManagement";
import MobileNav from "../components/admin-dashboard/MobileNav";

// Import des composants communs
import LoadingSpinner from "../components/patient-dashboard/common/LoadingSpinner";
import ErrorDisplay from "../components/patient-dashboard/common/ErrorDisplay";
import ActionMessages from "../components/patient-dashboard/common/ActionMessages";

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

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

        if (userResponse.data.role !== "admin") {
          setError(
            "Accès non autorisé. Ce tableau de bord est réservé aux administrateurs."
          );
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        // Récupérer toutes les données en parallèle
        const [patientsRes, doctorsRes, appointmentsRes, statsRes, usersRes] = await Promise.all([
          axios.get("/api/admin/patients", getAuthHeaders()),
          axios.get("/api/admin/doctors", getAuthHeaders()),
          axios.get("/api/admin/appointments", getAuthHeaders()),
          axios.get("/api/admin/statistics", getAuthHeaders()),
          axios.get("/api/admin/users", getAuthHeaders()),
        ]);

        setPatients(patientsRes.data.patients || []);
        setDoctors(doctorsRes.data.doctors || []);
        setAppointments(appointmentsRes.data.appointments || []);
        setStats(statsRes.data || {});
        setUsers(usersRes.data.users || []);

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
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce patient?"))
      return;

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
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce médecin?"))
      return;

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
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous?"))
      return;

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
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur?"))
      return;

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
    <div className="admin-dashboard">
      <AdminSidebar
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
            <AdminOverview
              stats={stats}
              handleTabChange={handleTabChange}
              actionLoading={actionLoading}
            />
          )}

          {activeTab === "patients" && (
            <PatientsManagement
              patients={patients}
              doctors={doctors}
              handleAddPatient={handleAddPatient}
              handleUpdatePatient={handleUpdatePatient}
              handleDeletePatient={handleDeletePatient}
              actionLoading={actionLoading}
            />
          )}

          {activeTab === "doctors" && (
            <DoctorsManagement
              doctors={doctors}
              handleAddDoctor={handleAddDoctor}
              handleUpdateDoctor={handleUpdateDoctor}
              handleDeleteDoctor={handleDeleteDoctor}
              actionLoading={actionLoading}
            />
          )}

          {activeTab === "appointments" && (
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

          {activeTab === "medicalRecords" && (
            <MedicalRecordsManagement
              medicalRecords={medicalRecords}
              patients={patients}
              doctors={doctors}
              actionLoading={actionLoading}
            />
          )}

          {activeTab === "statistics" && (
            <StatisticsView
              stats={stats}
              actionLoading={actionLoading}
            />
          )}

          {activeTab === "users" && (
            <UsersManagement
              users={users}
              handleAddUser={handleAddUser}
              handleUpdateUser={handleUpdateUser}
              handleDeleteUser={handleDeleteUser}
              actionLoading={actionLoading}
            />
          )}
        </div>
      </main>

      <MobileNav activeTab={activeTab} handleTabChange={handleTabChange} />
    </div>
  );
};

export default AdminDashboard;