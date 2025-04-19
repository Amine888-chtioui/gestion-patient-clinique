import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../axios";
import "./PatientDashboard.css";
// Import FontAwesome if not already included at the project level
// import "@fortawesome/fontawesome-free/css/all.min.css";

const PatientDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for UI development - replace with real API calls later
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      date: "2025-04-20",
      time: "10:00",
      doctor: "Dr. House",
      specialty: "Médecine Générale",
      status: "Confirmé",
    },
    {
      id: 2,
      date: "2025-04-25",
      time: "14:30",
      doctor: "Dr. Smith",
      specialty: "Cardiologie",
      status: "En attente",
    },
  ]);

  const [medicalRecords, setMedicalRecords] = useState([
    {
      id: 1,
      date: "2025-03-15",
      type: "Consultation",
      doctor: "Dr. House",
      diagnosis: "Grippe saisonnière",
      documents: ["Ordonnance"],
    },
    {
      id: 2,
      date: "2025-02-10",
      type: "Analyse",
      doctor: "Dr. Johnson",
      diagnosis: "Bilan sanguin",
      documents: ["Résultats", "Recommandations"],
    },
  ]);

  const [prescriptions, setPrescriptions] = useState([
    {
      id: 1,
      date: "2025-03-15",
      doctor: "Dr. House",
      medications: [
        {
          name: "Paracétamol",
          dosage: "500mg",
          frequency: "3x par jour",
          duration: "5 jours",
        },
        {
          name: "Vitamine C",
          dosage: "1000mg",
          frequency: "1x par jour",
          duration: "10 jours",
        },
      ],
    },
    {
      id: 2,
      date: "2025-02-10",
      doctor: "Dr. Johnson",
      medications: [
        {
          name: "Amoxicilline",
          dosage: "250mg",
          frequency: "2x par jour",
          duration: "7 jours",
        },
      ],
    },
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get("/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(response.data);

        // Check if user is actually a patient
        if (response.data.role !== "patient") {
          setError(
            "Accès non autorisé. Ce tableau de bord est réservé aux patients."
          );
          setTimeout(() => navigate("/"), 3000);
        }

        // Fetch appointments, medical records, and prescriptions if needed
        // These are commented out for now since we're using mock data

        // const appointmentsRes = await axios.get("/api/patient/appointments", {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        // setAppointments(appointmentsRes.data.appointments);

        // const recordsRes = await axios.get("/api/patient/medical-records", {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        // setMedicalRecords(recordsRes.data.medicalRecords);

        // const prescriptionsRes = await axios.get("/api/patient/prescriptions", {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        // setPrescriptions(prescriptionsRes.data.prescriptions);
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);

        if (err.response && err.response.status === 401) {
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

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        await axios.post(
          "/api/logout",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Formulaire de prise de rendez-vous
  const [newAppointment, setNewAppointment] = useState({
    date: "",
    time: "",
    doctor: "",
    reason: "",
  });

  const handleAppointmentChange = (e) => {
    setNewAppointment({
      ...newAppointment,
      [e.target.name]: e.target.value,
    });
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();

    // Show loading state
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      // Call the API to create a new appointment
      // In a production environment, you would use the real API
      // const response = await axios.post("/api/patient/appointments", newAppointment, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      // For now, just simulate the API call with a success response
      // and use the mock data
      console.log("Nouveau rendez-vous:", newAppointment);

      // Simulate a delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Add the new appointment to the local state
      const newId = appointments.length + 1;
      setAppointments([
        ...appointments,
        {
          id: newId,
          date: newAppointment.date,
          time: newAppointment.time,
          doctor: newAppointment.doctor,
          specialty: "Non spécifié",
          status: "En attente",
        },
      ]);

      // Reset the form
      setNewAppointment({
        date: "",
        time: "",
        doctor: "",
        reason: "",
      });

      // Show the appointments tab
      setActiveTab("appointments");
    } catch (err) {
      console.error("Erreur lors de la création du rendez-vous:", err);

      // Handle errors
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        setError(err.response.data.message);
      } else {
        setError(
          "Impossible de créer le rendez-vous. Veuillez réessayer plus tard."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="patient-dashboard loading-container">
        <div className="spinner"></div>
        <p>Chargement en cours...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patient-dashboard error-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Une erreur est survenue</h2>
          <p>{error}</p>
          <Link to="/" className="btn-primary">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/images/logo.png" alt="Logo Clinique" className="logo" />
          <h2>Espace Patient</h2>
        </div>

        <div className="user-info">
          <div className="avatar">
            <i className="fas fa-user-circle"></i>
          </div>
          <h3>{user?.name}</h3>
          <p>{user?.email}</p>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className={activeTab === "overview" ? "active" : ""}>
              <button onClick={() => handleTabChange("overview")}>
                <i className="fas fa-home"></i> Tableau de bord
              </button>
            </li>
            <li className={activeTab === "appointments" ? "active" : ""}>
              <button onClick={() => handleTabChange("appointments")}>
                <i className="fas fa-calendar-alt"></i> Rendez-vous
              </button>
            </li>
            <li className={activeTab === "book" ? "active" : ""}>
              <button onClick={() => handleTabChange("book")}>
                <i className="fas fa-plus-circle"></i> Prendre RDV
              </button>
            </li>
            <li className={activeTab === "medicalRecords" ? "active" : ""}>
              <button onClick={() => handleTabChange("medicalRecords")}>
                <i className="fas fa-file-medical"></i> Dossier médical
              </button>
            </li>
            <li className={activeTab === "prescriptions" ? "active" : ""}>
              <button onClick={() => handleTabChange("prescriptions")}>
                <i className="fas fa-prescription"></i> Ordonnances
              </button>
            </li>
            <li className={activeTab === "profile" ? "active" : ""}>
              <button onClick={() => handleTabChange("profile")}>
                <i className="fas fa-user"></i> Mon profil
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i> Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>
            {activeTab === "overview" && "Tableau de bord"}
            {activeTab === "appointments" && "Mes rendez-vous"}
            {activeTab === "book" && "Prendre un rendez-vous"}
            {activeTab === "medicalRecords" && "Mon dossier médical"}
            {activeTab === "prescriptions" && "Mes ordonnances"}
            {activeTab === "profile" && "Mon profil"}
          </h1>
          <div className="header-actions">
            <button className="btn-secondary">
              <i className="fas fa-bell"></i>
              <span className="notification-badge">2</span>
            </button>
            <button className="btn-secondary">
              <i className="fas fa-cog"></i>
            </button>
          </div>
        </header>

        <div className="content-body">
          {/* Vue d'ensemble */}
          {activeTab === "overview" && (
            <div className="overview-container">
              <div className="welcome-message">
                <h2>Bienvenue, {user?.name}!</h2>
                <p>
                  Consultez vos rendez-vous, votre dossier médical et vos
                  ordonnances
                </p>
              </div>

              <div className="stats-container">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Prochain RDV</h3>
                    <p>
                      {appointments.length > 0
                        ? `${appointments[0].date} à ${appointments[0].time}`
                        : "Aucun rendez-vous prévu"}
                    </p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-notes-medical"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Dernière consultation</h3>
                    <p>
                      {medicalRecords.length > 0
                        ? medicalRecords[0].date
                        : "Aucune consultation"}
                    </p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-pills"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Ordonnances actives</h3>
                    <p>{prescriptions.length} ordonnance(s)</p>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Actions rapides</h3>
                <div className="action-buttons">
                  <button
                    className="action-btn"
                    onClick={() => handleTabChange("book")}
                  >
                    <i className="fas fa-calendar-plus"></i>
                    Prendre un rendez-vous
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleTabChange("medicalRecords")}
                  >
                    <i className="fas fa-file-medical-alt"></i>
                    Consulter mon dossier
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleTabChange("prescriptions")}
                  >
                    <i className="fas fa-prescription-bottle-alt"></i>
                    Voir mes ordonnances
                  </button>
                </div>
              </div>

              <div className="recent-activity">
                <h3>Activité récente</h3>
                <div className="activity-list">
                  {appointments.length > 0 || medicalRecords.length > 0 ? (
                    <ul>
                      {appointments.slice(0, 2).map((apt) => (
                        <li key={`apt-${apt.id}`} className="activity-item">
                          <div className="activity-icon">
                            <i className="fas fa-calendar"></i>
                          </div>
                          <div className="activity-details">
                            <h4>Rendez-vous {apt.status}</h4>
                            <p>
                              Le {apt.date} à {apt.time} avec {apt.doctor}
                            </p>
                          </div>
                        </li>
                      ))}
                      {medicalRecords.slice(0, 2).map((record) => (
                        <li
                          key={`record-${record.id}`}
                          className="activity-item"
                        >
                          <div className="activity-icon">
                            <i className="fas fa-stethoscope"></i>
                          </div>
                          <div className="activity-details">
                            <h4>{record.type}</h4>
                            <p>
                              Le {record.date} avec {record.doctor}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Aucune activité récente</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rendez-vous */}
          {activeTab === "appointments" && (
            <div className="appointments-container">
              <div className="filter-bar">
                <div className="search-box">
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="Rechercher un rendez-vous..."
                  />
                </div>
                <div className="filter-options">
                  <select defaultValue="all">
                    <option value="all">Tous les statuts</option>
                    <option value="confirmed">Confirmés</option>
                    <option value="pending">En attente</option>
                    <option value="cancelled">Annulés</option>
                  </select>
                  <button className="btn-outline">
                    <i className="fas fa-filter"></i> Filtrer
                  </button>
                </div>
              </div>

              <div className="appointments-list">
                {appointments.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Heure</th>
                        <th>Médecin</th>
                        <th>Spécialité</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appointment) => (
                        <tr key={appointment.id}>
                          <td>{appointment.date}</td>
                          <td>{appointment.time}</td>
                          <td>{appointment.doctor}</td>
                          <td>{appointment.specialty}</td>
                          <td>
                            <span
                              className={`status-badge ${appointment.status.toLowerCase()}`}
                            >
                              {appointment.status}
                            </span>
                          </td>
                          <td className="actions">
                            <button
                              className="btn-icon"
                              title="Voir les détails"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button className="btn-icon" title="Modifier">
                              <i className="fas fa-edit"></i>
                            </button>
                            <button className="btn-icon" title="Annuler">
                              <i className="fas fa-times-circle"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-calendar-times"></i>
                    <h3>Aucun rendez-vous</h3>
                    <p>Vous n'avez pas encore de rendez-vous programmés</p>
                    <button
                      className="btn-primary"
                      onClick={() => handleTabChange("book")}
                    >
                      Prendre un rendez-vous
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prendre un rendez-vous */}
          {activeTab === "book" && (
            <div className="book-appointment-container">
              <div className="form-card">
                <h3>Demande de rendez-vous</h3>
                <form
                  onSubmit={handleBookAppointment}
                  className="appointment-form"
                >
                  <div className="form-group">
                    <label htmlFor="doctor">Médecin</label>
                    <select
                      id="doctor"
                      name="doctor"
                      value={newAppointment.doctor}
                      onChange={handleAppointmentChange}
                      required
                    >
                      <option value="">Sélectionnez un médecin</option>
                      <option value="Dr. House">
                        Dr. House - Médecine Générale
                      </option>
                      <option value="Dr. Smith">Dr. Smith - Cardiologie</option>
                      <option value="Dr. Johnson">
                        Dr. Johnson - Neurologie
                      </option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="date">Date souhaitée</label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={newAppointment.date}
                        onChange={handleAppointmentChange}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="time">Heure souhaitée</label>
                      <select
                        id="time"
                        name="time"
                        value={newAppointment.time}
                        onChange={handleAppointmentChange}
                        required
                      >
                        <option value="">Sélectionner une heure</option>
                        <option value="09:00">09:00</option>
                        <option value="09:30">09:30</option>
                        <option value="10:00">10:00</option>
                        <option value="10:30">10:30</option>
                        <option value="11:00">11:00</option>
                        <option value="11:30">11:30</option>
                        <option value="14:00">14:00</option>
                        <option value="14:30">14:30</option>
                        <option value="15:00">15:00</option>
                        <option value="15:30">15:30</option>
                        <option value="16:00">16:00</option>
                        <option value="16:30">16:30</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reason">Motif de la consultation</label>
                    <textarea
                      id="reason"
                      name="reason"
                      value={newAppointment.reason}
                      onChange={handleAppointmentChange}
                      placeholder="Décrivez brièvement le motif de votre consultation..."
                      rows="4"
                      required
                    ></textarea>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      <i className="fas fa-calendar-check"></i> Demander le
                      rendez-vous
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleTabChange("overview")}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>

              <div className="info-card">
                <h3>Informations</h3>
                <div className="info-list">
                  <div className="info-item">
                    <i className="fas fa-info-circle"></i>
                    <p>
                      Les rendez-vous sont soumis à validation par nos
                      secrétaires médicaux.
                    </p>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-clock"></i>
                    <p>Les consultations durent généralement 30 minutes.</p>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>
                      En cas d'urgence, veuillez nous contacter directement par
                      téléphone.
                    </p>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-phone"></i>
                    <p>Numéro d'urgence : 0536629878</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dossier médical */}
          {activeTab === "medicalRecords" && (
            <div className="medical-records-container">
              <div className="records-list">
                <h3>Historique médical</h3>
                {medicalRecords.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Médecin</th>
                        <th>Diagnostic</th>
                        <th>Documents</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicalRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{record.date}</td>
                          <td>{record.type}</td>
                          <td>{record.doctor}</td>
                          <td>{record.diagnosis}</td>
                          <td>
                            {record.documents.map((doc, index) => (
                              <span key={index} className="document-badge">
                                {doc}
                              </span>
                            ))}
                          </td>
                          <td className="actions">
                            <button
                              className="btn-icon"
                              title="Voir les détails"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button className="btn-icon" title="Télécharger">
                              <i className="fas fa-download"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-folder-open"></i>
                    <h3>Aucun dossier médical</h3>
                    <p>
                      Votre historique médical apparaîtra ici après votre
                      première consultation
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ordonnances */}
          {activeTab === "prescriptions" && (
            <div className="prescriptions-container">
              <h3>Mes ordonnances</h3>
              {prescriptions.length > 0 ? (
                <div className="prescriptions-list">
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} className="prescription-card">
                      <div className="prescription-header">
                        <h4>Ordonnance du {prescription.date}</h4>
                        <span className="prescription-doctor">
                          Dr. {prescription.doctor}
                        </span>
                      </div>
                      <div className="prescription-body">
                        <h5>Médicaments prescrits:</h5>
                        <ul className="medications-list">
                          {prescription.medications.map((med, index) => (
                            <li key={index} className="medication-item">
                              <div className="medication-name">
                                <i className="fas fa-pills"></i>
                                <span>{med.name}</span>
                              </div>
                              <div className="medication-details">
                                <span className="detail">
                                  <strong>Dosage:</strong> {med.dosage}
                                </span>
                                <span className="detail">
                                  <strong>Fréquence:</strong> {med.frequency}
                                </span>
                                <span className="detail">
                                  <strong>Durée:</strong> {med.duration}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="prescription-footer">
                        <button className="btn-outline">
                          <i className="fas fa-download"></i> Télécharger
                        </button>
                        <button className="btn-outline">
                          <i className="fas fa-print"></i> Imprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-prescription-bottle"></i>
                  <h3>Aucune ordonnance</h3>
                  <p>
                    Vos ordonnances apparaîtront ici après votre consultation
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Profil */}
          {activeTab === "profile" && (
            <div className="profile-container">
              <div className="profile-info-card">
                <div className="profile-header">
                  <div className="profile-avatar">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="profile-title">
                    <h3>{user?.name}</h3>
                    <p>Patient depuis {new Date().getFullYear()}</p>
                  </div>
                  <button className="btn-outline">
                    <i className="fas fa-camera"></i> Changer la photo
                  </button>
                </div>

                <div className="profile-details">
                  <div className="detail-group">
                    <h4>Informations personnelles</h4>
                    <div className="detail-row">
                      <div className="detail-label">Nom complet</div>
                      <div className="detail-value">{user?.name}</div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Email</div>
                      <div className="detail-value">{user?.email}</div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Téléphone</div>
                      <div className="detail-value">Non renseigné</div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Date de naissance</div>
                      <div className="detail-value">Non renseignée</div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Adresse</div>
                      <div className="detail-value">Non renseignée</div>
                    </div>
                  </div>

                  <div className="detail-group">
                    <h4>Informations médicales</h4>
                    <div className="detail-row">
                      <div className="detail-label">Groupe sanguin</div>
                      <div className="detail-value">Non renseigné</div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Allergies</div>
                      <div className="detail-value">Non renseignées</div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Maladies chroniques</div>
                      <div className="detail-value">Non renseignées</div>
                    </div>
                  </div>
                </div>

                <div className="profile-actions">
                  <button className="btn-primary">
                    <i className="fas fa-edit"></i> Modifier le profil
                  </button>
                  <button className="btn-secondary">
                    <i className="fas fa-key"></i> Changer le mot de passe
                  </button>
                </div>
              </div>

              <div className="privacy-notice">
                <h4>Confidentialité des données</h4>
                <p>
                  Vos données personnelles et médicales sont strictement
                  confidentielles et protégées. Elles ne sont accessibles qu'aux
                  professionnels de santé qui vous suivent. Vous pouvez demander
                  à tout moment l'accès, la modification ou la suppression de
                  vos données.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
