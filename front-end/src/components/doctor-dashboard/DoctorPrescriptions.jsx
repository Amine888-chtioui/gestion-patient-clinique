// src/components/doctor-dashboard/DoctorPrescriptions.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import UnifiedLoadingSpinner from "../common/UnifiedLoadingSpinner";

const DoctorPrescriptions = ({ 
  patients, 
  handlePatientSelect, 
  handleSubTabChange, 
  actionLoading 
}) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Fetch prescriptions when component mounts
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/doctor/prescriptions", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setPrescriptions(response.data.prescriptions || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching prescriptions:", err);
        setError("Impossible de charger les ordonnances. Veuillez réessayer plus tard.");
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  // Filter prescriptions based on criteria
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesDate = !dateFilter || prescription.date === dateFilter;
    const matchesSearch = !searchTerm || 
      prescription.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prescription.medications && prescription.medications.some(med => 
        med.name.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    return matchesDate && matchesSearch;
  });

  // Function to handle creating a new prescription
  const handleCreateNewPrescription = () => {
    // This will prompt the user to select a patient first
    handleSubTabChange("select-patient-for-prescription");
  };

  // Fonction CORRIGÉE pour voir les détails d'un patient
  const handleViewPatient = async (patientId) => {
    try {
      console.log("handleViewPatient appelé avec patientId:", patientId);
      
      // Vérifier d'abord si on a déjà les informations du patient dans la liste
      let patient = patients.find(p => p.id === patientId);
      
      if (patient) {
        console.log("Patient trouvé dans la liste:", patient);
        // Si on a le patient dans la liste, l'utiliser directement
        await handlePatientSelect(patient);
      } else {
        console.log("Patient non trouvé dans la liste, création d'un objet temporaire");
        // Sinon, créer un objet patient temporaire avec l'ID
        // Le handlePatientSelect se chargera de récupérer les détails complets
        const tempPatient = { id: patientId };
        await handlePatientSelect(tempPatient);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection du patient:", error);
      // Note: La gestion d'erreur sera faite par le handlePatientSelect du parent
    }
  };

  // Fonction CORRIGÉE pour créer une nouvelle ordonnance pour un patient spécifique
  const handleCreatePrescriptionForPatient = async (patientId) => {
    try {
      console.log("handleCreatePrescriptionForPatient appelé avec patientId:", patientId);
      
      // Vérifier d'abord si on a déjà les informations du patient dans la liste
      let patient = patients.find(p => p.id === patientId);
      
      if (patient) {
        console.log("Patient trouvé pour nouvelle ordonnance:", patient);
        // Sélectionner le patient et aller à l'onglet de création d'ordonnance
        await handlePatientSelect(patient);
        // Note: La navigation vers l'onglet prescription sera gérée par le parent
      } else {
        console.log("Patient non trouvé, création d'un objet temporaire pour ordonnance");
        const tempPatient = { id: patientId };
        await handlePatientSelect(tempPatient);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection du patient pour ordonnance:", error);
    }
  };

  // Group prescriptions by date (most recent first)
  const groupedPrescriptions = filteredPrescriptions.reduce((groups, prescription) => {
    if (!groups[prescription.date]) {
      groups[prescription.date] = [];
    }
    groups[prescription.date].push(prescription);
    return groups;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedPrescriptions).sort((a, b) => new Date(b) - new Date(a));

  // Display loading spinner while data is being fetched
  if (loading) {
    return <UnifiedLoadingSpinner text="Chargement des ordonnances..." color="primary" />;
  }

  // Display error message if loading fails
  if (error) {
    return (
      <div className="error-state">
        <i className="fas fa-exclamation-circle"></i>
        <h3>Erreur</h3>
        <p>{error}</p>
        <button 
          className="btn-primary" 
          onClick={() => window.location.reload()}
          disabled={actionLoading}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="prescriptions-container">
      <div className="section-header">
        <h2>Ordonnances</h2>
        <button 
          className="btn-primary"
          onClick={handleCreateNewPrescription}
          disabled={actionLoading}
        >
          <i className="fas fa-plus"></i> Nouvelle ordonnance
        </button>
      </div>

      {/* Filter and search section */}
      <div className="filter-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Rechercher un patient ou un médicament..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-options">
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="date-filter"
          />
          <button 
            className="btn-outline"
            onClick={() => {
              setDateFilter("");
              setSearchTerm("");
            }}
            disabled={actionLoading}
          >
            <i className="fas fa-sync-alt"></i> Réinitialiser
          </button>
        </div>
      </div>

      {/* Prescriptions list */}
      <div className="prescriptions-content">
        {filteredPrescriptions.length > 0 ? (
          <div className="prescriptions-list">
            {sortedDates.map(date => (
              <div key={date} className="date-group">
                <div className="date-header">
                  <h3>{new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                </div>
                {groupedPrescriptions[date].map(prescription => (
                  <div key={prescription.id} className="prescription-card">
                    <div className="prescription-header">
                      <h4>Ordonnance pour {prescription.patient_name}</h4>
                      <span className="prescription-date">{prescription.date}</span>
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
                              <span className="detail"><strong>Dosage:</strong> {med.dosage}</span>
                              <span className="detail"><strong>Fréquence:</strong> {med.frequency}</span>
                              <span className="detail"><strong>Durée:</strong> {med.duration}</span>
                              {med.instructions && (
                                <span className="detail full-width">
                                  <strong>Instructions:</strong> {med.instructions}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                      {prescription.notes && (
                        <div className="prescription-notes">
                          <p><strong>Notes:</strong> {prescription.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="prescription-footer">
                      <button 
                        className="btn-outline"
                        onClick={() => handleViewPatient(prescription.patient_id)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-user"></i> Voir patient
                      </button>
                      <button 
                        className="btn-outline"
                        onClick={() => window.print()}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-print"></i> Imprimer
                      </button>
                      <button 
                        className="btn-outline"
                        onClick={() => handleCreatePrescriptionForPatient(prescription.patient_id)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-prescription"></i> Nouvelle ordonnance
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-prescription-bottle"></i>
            <h3>Aucune ordonnance trouvée</h3>
            <p>Aucune ordonnance ne correspond à vos critères de recherche</p>
            <button 
              className="btn-primary"
              onClick={handleCreateNewPrescription}
              disabled={actionLoading}
            >
              Créer une nouvelle ordonnance
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPrescriptions;