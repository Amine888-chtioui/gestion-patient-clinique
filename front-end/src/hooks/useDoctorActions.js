// src/hooks/useDoctorActions.js
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import doctorApiClient from '../services/doctorApiClient';

export const useDoctorActions = (dashboardState) => {
  const navigate = useNavigate();
  const {
    data,
    updateData,
    setActionLoading,
    setActionError,
    setActionSuccess,
    clearMessages,
    handleApiError,
    dataLoaded,
    setActiveTab,
    setActiveSubTab,
    setSelectedPatient,
    setSelectedAppointment
  } = dashboardState;

  // Navigation Actions
  const handleTabChange = useCallback((tab) => {
    if (tab === dashboardState.activeTab) return;

    setActiveTab(tab);
    setActiveSubTab(null);
    setSelectedPatient(null);
    setSelectedAppointment(null);
    clearMessages();

    navigate(`/doctor/dashboard/${tab}`, { replace: true });

    if (!dashboardState.dataLoaded[tab]) {
      dashboardState.loadSectionData(tab);
    }
  }, [dashboardState, navigate, setActiveTab, setActiveSubTab, setSelectedPatient, setSelectedAppointment, clearMessages]);

  const handleSubTabChange = useCallback((subtab, appointment = null) => {
    setActiveSubTab(subtab);
    if (appointment) {
      setSelectedAppointment(appointment);
    }
    clearMessages();
  }, [setActiveSubTab, setSelectedAppointment, clearMessages]);

  // Patient Actions
  const handlePatientSelect = useCallback(async (patient) => {
    setActionLoading(true);
    clearMessages();

    try {
      const patientDetails = await doctorApiClient.getPatientDetails(patient.id);
      setSelectedPatient(patientDetails);
      setActiveTab("patients");
      setActiveSubTab("details");
      navigate("/doctor/dashboard/patients", { replace: true });
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [setActionLoading, clearMessages, setSelectedPatient, setActiveTab, setActiveSubTab, navigate, handleApiError]);

  // Appointment Actions
  const handleAppointmentSelect = useCallback(async (appointment) => {
    setSelectedAppointment(appointment);
    setActionLoading(true);

    try {
      const patientDetails = await doctorApiClient.getPatientDetails(appointment.patient_id);
      setSelectedPatient(patientDetails);
      setActiveSubTab("record");
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [setSelectedAppointment, setActionLoading, setSelectedPatient, setActiveSubTab, handleApiError]);

  const handleUpdateAppointmentStatus = useCallback(async (id, status) => {
    setActionLoading(true);
    clearMessages();

    try {
      await doctorApiClient.updateAppointmentStatus(id, status);

      updateData('appointments',
        data.appointments.map((apt) =>
          apt.id === id ? { ...apt, status: status } : apt
        )
      );

      setActionSuccess(`Statut du rendez-vous mis à jour : ${status}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [setActionLoading, clearMessages, updateData, data.appointments, setActionSuccess, handleApiError]);

  // Medical Record Actions
  const handleCreateMedicalRecord = useCallback(async (record) => {
    setActionLoading(true);
    clearMessages();

    try {
      const recordData = {
        ...record,
        patient_id: dashboardState.selectedPatient.id,
        appointment_id: record.appointment_id || dashboardState.selectedAppointment?.id || null,
      };

      await doctorApiClient.createMedicalRecord(recordData);

      if (dashboardState.selectedAppointment && recordData.appointment_id) {
        updateData('appointments',
          data.appointments.map((apt) =>
            apt.id === dashboardState.selectedAppointment.id
              ? { ...apt, status: "confirmé" }
              : apt
          )
        );
      }

      setActionSuccess("Dossier médical créé avec succès");

      if (dataLoaded.medicalRecords) {
        const medicalRecords = await doctorApiClient.getMedicalRecords();
        updateData('medicalRecords', medicalRecords);
      }

      setTimeout(() => {
        if (dashboardState.activeTab === "medical-records") {
          setActiveSubTab(null);
          setSelectedPatient(null);
          setSelectedAppointment(null);
        } else {
          handleTabChange("medical-records");
        }
      }, 1500);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [dashboardState, setActionLoading, clearMessages, updateData, data.appointments, setActionSuccess, dataLoaded.medicalRecords, setActiveSubTab, setSelectedPatient, setSelectedAppointment, handleTabChange, handleApiError]);

  // Prescription Actions
  const handleCreatePrescription = useCallback(async (prescription) => {
    setActionLoading(true);
    clearMessages();

    try {
      const prescriptionData = {
        ...prescription,
        patient_id: dashboardState.selectedPatient.id,
        medical_record_id: prescription.medical_record_id || null,
      };

      await doctorApiClient.createPrescription(prescriptionData);

      setActionSuccess("Ordonnance créée avec succès");

      if (dataLoaded.prescriptions) {
        const prescriptions = await doctorApiClient.getPrescriptions();
        updateData('prescriptions', prescriptions);
      }

      setTimeout(() => {
        if (dashboardState.activeTab === "prescriptions") {
          setActiveSubTab(null);
          setSelectedPatient(null);
          setSelectedAppointment(null);
        } else {
          handleTabChange("prescriptions");
        }
      }, 1500);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [dashboardState, setActionLoading, clearMessages, setActionSuccess, dataLoaded.prescriptions, updateData, setActiveSubTab, setSelectedPatient, setSelectedAppointment, handleTabChange, handleApiError]);

  // Document Actions
  const handleDownloadDocument = useCallback(async (docId) => {
    try {
      setActionLoading(true);
      
      const response = await doctorApiClient.downloadDocument(docId);
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'document';
      
      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      setActionSuccess(`Document téléchargé avec succès`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err, "Impossible de télécharger le document. Veuillez réessayer plus tard.");
    } finally {
      setActionLoading(false);
    }
  }, [setActionLoading, setActionSuccess, handleApiError]);

  // Auth Actions
  const handleLogout = useCallback(async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      if (token) await doctorApiClient.logout();
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("Erreur de déconnexion:", err);
      localStorage.removeItem("token");
      navigate("/login");
    } finally {
      setActionLoading(false);
    }
  }, [setActionLoading, navigate]);

  return {
    handleTabChange,
    handleSubTabChange,
    handlePatientSelect,
    handleAppointmentSelect,
    handleUpdateAppointmentStatus,
    handleCreateMedicalRecord,
    handleCreatePrescription,
    handleDownloadDocument,
    handleLogout
  };
};