// src/hooks/useDataLoader.js
import { useCallback } from 'react';
import apiClient from '../services/apiClient';

export const useDataLoader = (dashboardState) => {
  const {
    data,
    setLoadingState,
    markSectionAsLoaded,
    updateData,
    setActionError,
  } = dashboardState;

  const loadSectionData = useCallback(async (section) => {
    if (dashboardState.dataLoaded[section]) return;

    setLoadingState(section, true);

    try {
      switch (section) {
        case "overview":
          await Promise.all([
            loadAppointments(),
            loadMedicalRecords(),
            loadPrescriptions(),
          ]);
          break;

        case "appointments":
          await loadAppointments();
          await loadDoctors();
          break;

        case "book":
          await loadDoctors();
          break;

        case "medicalRecords":
          await loadMedicalRecords();
          break;

        case "prescriptions":
          await loadPrescriptions();
          break;

        case "invoices":
          // Factures chargées directement par le composant
          break;

        case "profile":
          // Profil déjà chargé
          break;
      }

      markSectionAsLoaded(section);
    } catch (error) {
      console.error(`Erreur lors du chargement de la section ${section}:`, error);
      setActionError(`Impossible de charger les données pour ${section}.`);
    } finally {
      setLoadingState(section, false);
    }
  }, [dashboardState]);

  const loadAppointments = useCallback(async () => {
    if (data.appointments.length === 0) {
      const appointments = await apiClient.getAppointments();
      updateData('appointments', appointments);
    }
  }, [data.appointments.length, updateData]);

  const loadMedicalRecords = useCallback(async () => {
    if (data.medicalRecords.length === 0) {
      const medicalRecords = await apiClient.getMedicalRecords();
      updateData('medicalRecords', medicalRecords);
    }
  }, [data.medicalRecords.length, updateData]);

  const loadPrescriptions = useCallback(async () => {
    if (data.prescriptions.length === 0) {
      const prescriptions = await apiClient.getPrescriptions();
      updateData('prescriptions', prescriptions);
    }
  }, [data.prescriptions.length, updateData]);

  const loadDoctors = useCallback(async () => {
    if (data.doctors.length === 0) {
      try {
        const doctors = await apiClient.getDoctors();
        updateData('doctors', doctors);
      } catch (err) {
        console.warn("Endpoint des médecins non disponible, utilisation de données fictives");
        const mockDoctors = [
          { id: 1, name: "Dr. House", specialty: "Médecine Générale" },
          { id: 2, name: "Dr. Smith", specialty: "Cardiologie" },
          { id: 3, name: "Dr. Johnson", specialty: "Neurologie" },
        ];
        updateData('doctors', mockDoctors);
      }
    }
  }, [data.doctors.length, updateData]);

  return { loadSectionData };
};