// src/components/doctor-dashboard/DoctorMedicalRecords.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import UnifiedLoadingSpinner from "../common/UnifiedLoadingSpinner";

const DoctorMedicalRecords = ({ 
  patients, 
  handlePatientSelect, 
  handleSubTabChange, 
  actionLoading 
}) => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Fetch medical records when component mounts
  useEffect(() => {
    const fetchMedicalRecords = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/doctor/medical-records", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setMedicalRecords(response.data.medicalRecords || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching medical records:", err);
        setError("Impossible de charger les dossiers médicaux. Veuillez réessayer plus tard.");
        setLoading(false);
      }
    };

    fetchMedicalRecords();
  }, []);

  // Filter medical records based on criteria
  const filteredRecords = medicalRecords.filter(record => {
    const matchesType = filterType === "all" || record.type === filterType;
    const matchesDate = !dateFilter || record.date === dateFilter;
    const matchesSearch = !searchTerm || 
      record.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesDate && matchesSearch;
  });

  // Function to handle creating a new medical record
  const handleCreateNewRecord = () => {
    // This will prompt the user to select a patient first
    handleSubTabChange("select-patient-for-record");
  };

  // Group records by date (most recent first)
  const groupedRecords = filteredRecords.reduce((groups, record) => {
    if (!groups[record.date]) {
      groups[record.date] = [];
    }
    groups[record.date].push(record);
    return groups;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedRecords).sort((a, b) => new Date(b) - new Date(a));

  // Display loading spinner while data is being fetched
  if (loading) {
    return <UnifiedLoadingSpinner text="Chargement des dossiers médicaux..." color="primary" />;
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
    <div className="medical-records-container">
      <div className="section-header">
        <h2>Dossiers Médicaux</h2>
        <button 
          className="btn-primary"
          onClick={handleCreateNewRecord}
          disabled={actionLoading}
        >
          <i className="fas fa-plus"></i> Nouveau dossier médical
        </button>
      </div>

      {/* Filter and search section */}
      <div className="filter-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Rechercher un patient ou un diagnostic..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-options">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les types</option>
            <option value="consultation">Consultation</option>
            <option value="analyse">Analyse</option>
            <option value="chirurgie">Chirurgie</option>
            <option value="suivi">Suivi</option>
            <option value="autre">Autre</option>
          </select>
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="date-filter"
          />
          <button 
            className="btn-outline"
            onClick={() => {
              setFilterType("all");
              setDateFilter("");
              setSearchTerm("");
            }}
            disabled={actionLoading}
          >
            <i className="fas fa-sync-alt"></i> Réinitialiser
          </button>
        </div>
      </div>

      {/* Records list */}
      <div className="records-content">
        {filteredRecords.length > 0 ? (
          <div className="records-timeline">
            {sortedDates.map(date => (
              <div key={date} className="date-group">
                <div className="date-header">
                  <h3>{new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                </div>
                {groupedRecords[date].map(record => (
                  <div key={record.id} className="record-item">
                    <div className="record-date">
                      <span className="date">{record.date}</span>
                      <span className="type">{record.type}</span>
                    </div>
                    <div className="record-content">
                      <h4>Patient: {record.patient_name}</h4>
                      <div className="record-details">
                        <p><strong>Diagnostic:</strong> {record.diagnosis}</p>
                        <p><strong>Notes:</strong> {record.notes || "Aucune note"}</p>
                        {record.documents && record.documents.length > 0 && (
                          <div className="record-documents">
                            <p><strong>Documents:</strong></p>
                            <ul>
                              {record.documents.map((doc, index) => (
                                <li key={index}>
                                  <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    // Handle document download (implementation not shown)
                                  }}>
                                    <i className="fas fa-file-download"></i> {doc.name}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="record-actions">
                        <button 
                          className="btn-sm btn-outline"
                          onClick={() => {
                            // Find the patient by ID and select them
                            const patient = patients.find(p => p.id === record.patient_id);
                            if (patient) {
                              handlePatientSelect(patient);
                            }
                          }}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-user"></i> Voir patient
                        </button>
                        <button 
                          className="btn-sm btn-outline"
                          onClick={() => {
                            // Implementation to view full record details
                          }}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-eye"></i> Détails
                        </button>
                        <button 
                          className="btn-sm btn-outline"
                          onClick={() => {
                            // Find the patient and create a new prescription
                            const patient = patients.find(p => p.id === record.patient_id);
                            if (patient) {
                              handlePatientSelect(patient);
                              handleSubTabChange("prescription");
                            }
                          }}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-prescription"></i> Nouvelle ordonnance
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-file-medical-alt"></i>
            <h3>Aucun dossier médical trouvé</h3>
            <p>Aucun dossier ne correspond à vos critères de recherche</p>
            <button 
              className="btn-primary"
              onClick={handleCreateNewRecord}
              disabled={actionLoading}
            >
              Créer un nouveau dossier
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorMedicalRecords;