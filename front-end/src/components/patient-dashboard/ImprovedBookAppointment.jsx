// src/components/patient-dashboard/ImprovedBookAppointment.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import AvailabilityCalendar from "./AvailabilityCalendar";
import TimeSlots from "./TimeSlots";
import DoctorScheduleInfo from "./DoctorScheduleInfo";
import UnifiedLoadingSpinner from "../common/UnifiedLoadingSpinner";

const ImprovedBookAppointment = ({ 
  handleTabChange, 
  actionLoading,
  onBookAppointment
}) => {
  // State management
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [step, setStep] = useState(1); // Étape actuelle du flux de réservation

  // Load services on component mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Fetch services from API
  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/patient/services', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setServices(response.data.services || []);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Impossible de charger les services. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctors when a service is selected
  useEffect(() => {
    if (!selectedService) return;
    
    const fetchDoctorsByService = async () => {
      setLoading(true);
      setDoctors([]);
      setSelectedDoctor("");
      
      try {
        const response = await axios.get(`/api/patient/services/${selectedService}/doctors`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setDoctors(response.data.doctors || []);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError("Impossible de charger les médecins pour ce service. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorsByService();
  }, [selectedService]);

  // Event handlers
  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
    setSelectedDoctor("");
    setSelectedDate("");
    setSelectedTime("");
    setShowSummary(false);
    setStep(1);
  };

  const handleDoctorChange = (e) => {
    setSelectedDoctor(e.target.value);
    setSelectedDate("");
    setSelectedTime("");
    setShowSummary(false);
    setStep(2);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime("");
    setStep(3);
    updateSummaryVisibility();
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setStep(4);
    updateSummaryVisibility();
  };

  const handleReasonChange = (e) => {
    setReason(e.target.value);
    updateSummaryVisibility();
  };

  // Show summary when all fields are completed
  const updateSummaryVisibility = () => {
    if (selectedService && selectedDoctor && selectedDate && selectedTime && reason) {
      setShowSummary(true);
    }
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedDoctor || !selectedDate || !selectedTime || !reason.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    
    const appointmentData = {
      doctor_id: selectedDoctor,
      date: selectedDate,
      time: selectedTime,
      reason: reason
    };
    
    onBookAppointment(appointmentData);
  };

  // Formatting helpers
  const formatReadableDate = (dateString) => {
    if (!dateString) return "Non sélectionné";
    
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Get service name by ID
  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id.toString() === serviceId.toString());
    return service ? service.name : "";
  };

  // Get doctor name by ID
  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id.toString() === doctorId.toString());
    return doctor ? doctor.name : "";
  };

  // Afficher le spinner de chargement
  if (loading) {
    return <UnifiedLoadingSpinner text="Chargement des données..." />;
  }

  return (
    <div className="improved-book-appointment">
      <h2 className="section-title">Prendre un rendez-vous</h2>
      
      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      <div className="appointment-form-container">
        {/* Barre de progression pour guider l'utilisateur */}
        <div className="booking-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Service</div>
          </div>
          <div className="progress-connector"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Médecin</div>
          </div>
          <div className="progress-connector"></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Date</div>
          </div>
          <div className="progress-connector"></div>
          <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">Heure</div>
          </div>
          <div className="progress-connector"></div>
          <div className={`progress-step ${step >= 5 ? 'active' : ''}`}>
            <div className="step-number">5</div>
            <div className="step-label">Motif</div>
          </div>
        </div>

        {/* Step 1: Service Selection */}
        <div className="step-container">
          <h3>1. Choisissez un service médical</h3>
          <div className="form-group">
            <label htmlFor="service">Service</label>
            <select
              id="service"
              value={selectedService}
              onChange={handleServiceChange}
              disabled={loading || actionLoading}
              required
              className="form-control"
            >
              <option value="">Sélectionnez un service</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            {loading && (
              <div className="loading-indicator">
                <i className="fas fa-spinner fa-spin"></i> Chargement...
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Doctor Selection */}
        {selectedService && (
          <div className="step-container">
            <h3>2. Choisissez un médecin</h3>
            <div className="form-group">
              <label htmlFor="doctor">Médecin</label>
              <select
                id="doctor"
                value={selectedDoctor}
                onChange={handleDoctorChange}
                disabled={loading || actionLoading}
                required
                className="form-control"
              >
                <option value="">Sélectionnez un médecin</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} {doctor.specialty ? `- ${doctor.specialty}` : ""}
                  </option>
                ))}
              </select>
              {doctors.length === 0 && !loading && (
                <div className="info-message">
                  <i className="fas fa-info-circle"></i> Aucun médecin disponible pour ce service.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Afficher les horaires du médecin sélectionné */}
        {selectedDoctor && (
          <DoctorScheduleInfo doctorId={selectedDoctor} />
        )}

        {/* Step 3 & 4: Date and Time Selection */}
        {selectedDoctor && (
          <div className="date-time-selection">
            <div className="date-selection">
              <h3>3. Choisissez une date</h3>
              <div className="info-message small">
                <i className="fas fa-info-circle"></i> Les jours en gris sont ceux où le médecin n'est pas disponible.
              </div>
              <AvailabilityCalendar
                doctorId={selectedDoctor}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                disabled={actionLoading}
              />
            </div>

            {selectedDate && (
              <div className="time-selection">
                <h3>4. Choisissez un horaire</h3>
                <TimeSlots
                  doctorId={selectedDoctor}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onTimeSelect={handleTimeSelect}
                  disabled={actionLoading}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 5: Reason for Visit */}
        {selectedDoctor && selectedDate && selectedTime && (
          <div className="reason-section">
            <h3>5. Motif de consultation</h3>
            <div className="form-group">
              <label htmlFor="reason">Motif de la consultation</label>
              <textarea
                id="reason"
                value={reason}
                onChange={handleReasonChange}
                placeholder="Décrivez brièvement le motif de votre consultation..."
                rows="4"
                required
                disabled={actionLoading}
                className="form-control"
                onBlur={() => setStep(5)}
              ></textarea>
            </div>
          </div>
        )}

        {/* Appointment Summary Card */}
        {showSummary && (
          <div className="appointment-summary">
            <div className="summary-card">
              <h3>Récapitulatif du rendez-vous</h3>
              <div className="summary-details">
                <div className="summary-row">
                  <span className="summary-label">Service:</span>
                  <span className="summary-value">{getServiceName(selectedService)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Médecin:</span>
                  <span className="summary-value">{getDoctorName(selectedDoctor)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Date:</span>
                  <span className="summary-value">{formatReadableDate(selectedDate)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Heure:</span>
                  <span className="summary-value">{selectedTime}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Motif:</span>
                  <span className="summary-value reason-summary">{reason}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={!selectedDoctor || !selectedDate || !selectedTime || !reason.trim() || actionLoading}
            onClick={handleSubmit}
          >
            {actionLoading ? (
              <><i className="fas fa-spinner fa-spin"></i> En cours...</>
            ) : (
              <><i className="fas fa-calendar-check"></i> Confirmer le rendez-vous</>
            )}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleTabChange("overview")}
            disabled={actionLoading}
          >
            Annuler
          </button>
        </div>
      </div>

      <div className="info-card">
        <h3>Informations</h3>
        <div className="info-list">
          <div className="info-item">
            <i className="fas fa-info-circle"></i>
            <p>Les rendez-vous sont soumis à validation par nos secrétaires médicaux.</p>
          </div>
          <div className="info-item">
            <i className="fas fa-clock"></i>
            <p>Les consultations durent généralement 30 minutes.</p>
          </div>
          <div className="info-item">
            <i className="fas fa-calendar-day"></i>
            <p>Les disponibilités affichées sont basées sur les horaires définis par le médecin.</p>
          </div>
          <div className="info-item">
            <i className="fas fa-exclamation-triangle"></i>
            <p>En cas d'urgence, veuillez nous contacter directement par téléphone.</p>
          </div>
          <div className="info-item">
            <i className="fas fa-phone"></i>
            <p>Numéro d'urgence : 0536629878</p>
          </div>
          
          <div className="legend">
            <h4>Légende du calendrier</h4>
            <div className="legend-item">
              <div className="legend-color available"></div>
              <span>Médecin disponible</span>
            </div>
            <div className="legend-item">
              <div className="legend-color partially-available"></div>
              <span>Partiellement réservé</span>
            </div>
            <div className="legend-item">
              <div className="legend-color unavailable"></div>
              <span>Aucun créneau disponible</span>
            </div>
            <div className="legend-item">
              <div className="legend-color doctor-unavailable"></div>
              <span>Médecin non disponible</span>
            </div>
            <div className="legend-item">
              <div className="legend-color past"></div>
              <span>Date passée</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedBookAppointment;