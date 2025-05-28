// src/hooks/useAdminActions.js - Version complète avec notifications
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApiClient from '../services/adminApiClient';

export const useAdminActions = (dashboardState) => {
  const navigate = useNavigate();
  const {
    data,
    updateData,
    setActionLoading,
    setActionError,
    setActionSuccess,
    clearMessages,
    handleApiError
  } = dashboardState;

  // Navigation
  const handleTabChange = useCallback((tab) => {
    dashboardState.setActiveTab(tab);
    clearMessages();

    if (tab !== "invoices") {
      dashboardState.setInvoiceMode("list");
      dashboardState.setSelectedInvoiceId(null);
    }

    dashboardState.loadSectionData(tab);
    navigate(`/admin/dashboard/${tab}`);
  }, [dashboardState, clearMessages, navigate]);

  const handleInvoiceAction = useCallback((action, id = null) => {
    dashboardState.setInvoiceMode(action);
    dashboardState.setSelectedInvoiceId(id);

    if (action === "list") {
      navigate("/admin/dashboard/invoices");
    } else if (action === "details" && id) {
      navigate(`/admin/dashboard/invoices/${id}`);
    } else if (action === "create") {
      navigate("/admin/dashboard/invoices/create");
    } else if (action === "edit" && id) {
      navigate(`/admin/dashboard/invoices/edit/${id}`);
    }
  }, [dashboardState, navigate]);

  // Generic CRUD operations
  const createEntity = useCallback(async (entityType, entityData) => {
    setActionLoading(true);
    clearMessages();

    try {
      const response = await adminApiClient[`create${entityType}`](entityData);
      const entities = data[entityType.toLowerCase() + 's'] || data[entityType.toLowerCase()];
      updateData(entityType.toLowerCase() + 's', [response[entityType.toLowerCase()], ...entities]);
      setActionSuccess(`${entityType} ajouté avec succès!`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [data, updateData, setActionLoading, clearMessages, setActionSuccess, handleApiError]);

  const updateEntity = useCallback(async (entityType, id, entityData) => {
    setActionLoading(true);
    clearMessages();

    try {
      const response = await adminApiClient[`update${entityType}`](id, entityData);
      const entities = data[entityType.toLowerCase() + 's'] || data[entityType.toLowerCase()];
      updateData(
        entityType.toLowerCase() + 's',
        entities.map((entity) =>
          entity.id === id ? response[entityType.toLowerCase()] : entity
        )
      );
      setActionSuccess(`${entityType} mis à jour avec succès!`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [data, updateData, setActionLoading, clearMessages, setActionSuccess, handleApiError]);

  const deleteEntity = useCallback(async (entityType, id) => {
    setActionLoading(true);
    clearMessages();

    try {
      await adminApiClient[`delete${entityType}`](id);
      const entities = data[entityType.toLowerCase() + 's'] || data[entityType.toLowerCase()];
      updateData(
        entityType.toLowerCase() + 's',
        entities.filter((entity) => entity.id !== id)
      );
      setActionSuccess(`${entityType} supprimé avec succès!`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [data, updateData, setActionLoading, clearMessages, setActionSuccess, handleApiError]);

  // Specific entity handlers with NOTIFICATION INFO
  const handleAddPatient = useCallback(async (patientData) => {
    await createEntity('Patient', patientData);
  }, [createEntity]);

  const handleUpdatePatient = useCallback(async (id, patientData) => {
    await updateEntity('Patient', id, patientData);
  }, [updateEntity]);

  const handleDeletePatient = useCallback(async (id) => {
    await deleteEntity('Patient', id);
  }, [deleteEntity]);

  const handleAddDoctor = useCallback(async (doctorData) => {
    await createEntity('Doctor', doctorData);
  }, [createEntity]);

  const handleUpdateDoctor = useCallback(async (id, doctorData) => {
    await updateEntity('Doctor', id, doctorData);
  }, [updateEntity]);

  const handleDeleteDoctor = useCallback(async (id) => {
    await deleteEntity('Doctor', id);
  }, [deleteEntity]);

  // APPOINTMENTS - AVEC MESSAGES DE NOTIFICATION
  const handleAddAppointment = useCallback(async (appointmentData) => {
    setActionLoading(true);
    clearMessages();

    try {
      console.log("🔄 Création d'un rendez-vous par l'admin...");
      
      const response = await adminApiClient.createAppointment(appointmentData);
      const newAppointment = response.appointment;
      
      updateData('appointments', [newAppointment, ...data.appointments]);
      
      // Message de succès avec info sur les notifications
      setActionSuccess(
        `Rendez-vous créé avec succès! 📩 Le patient ${newAppointment.patient_name} et le Dr ${newAppointment.doctor_name} ont été notifiés.`
      );
      
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      handleApiError(err, "Erreur lors de la création du rendez-vous");
    } finally {
      setActionLoading(false);
    }
  }, [data.appointments, updateData, setActionLoading, clearMessages, setActionSuccess, handleApiError]);

  const handleUpdateAppointment = useCallback(async (id, appointmentData) => {
    setActionLoading(true);
    clearMessages();

    try {
      console.log("🔄 Modification d'un rendez-vous par l'admin...");
      
      const response = await adminApiClient.updateAppointment(id, appointmentData);
      
      updateData('appointments',
        data.appointments.map((appointment) =>
          appointment.id === id ? response.appointment : appointment
        )
      );

      // Message de succès avec info sur les notifications
      setActionSuccess(
        `Rendez-vous mis à jour avec succès! 📩 Les personnes concernées ont été notifiées des changements.`
      );
      
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      handleApiError(err, "Erreur lors de la modification du rendez-vous");
    } finally {
      setActionLoading(false);
    }
  }, [data.appointments, updateData, setActionLoading, clearMessages, setActionSuccess, handleApiError]);

  const handleDeleteAppointment = useCallback(async (id) => {
    setActionLoading(true);
    clearMessages();

    try {
      console.log("🔄 Suppression d'un rendez-vous par l'admin...");
      
      // Trouver le rendez-vous pour le message
      const appointment = data.appointments.find(apt => apt.id === id);
      
      await adminApiClient.deleteAppointment(id);
      
      updateData('appointments', 
        data.appointments.filter((appointment) => appointment.id !== id)
      );

      // Message de succès avec info sur les notifications
      setActionSuccess(
        `Rendez-vous supprimé avec succès! 📩 ${appointment?.patient_name || 'Le patient'} et ${appointment?.doctor_name || 'le médecin'} ont été notifiés de l'annulation.`
      );
      
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      handleApiError(err, "Erreur lors de la suppression du rendez-vous");
    } finally {
      setActionLoading(false);
    }
  }, [data.appointments, updateData, setActionLoading, clearMessages, setActionSuccess, handleApiError]);

  // MEDICAL RECORDS - NOUVELLE MÉTHODE AVEC NOTIFICATIONS
  const handleUpdateMedicalRecord = useCallback(async (id, recordData) => {
    setActionLoading(true);
    clearMessages();

    try {
      console.log("🔄 Modification d'un dossier médical par l'admin...");
      
      const response = await adminApiClient.updateMedicalRecord(id, recordData);
      
      updateData('medicalRecords',
        data.medicalRecords.map((record) =>
          record.id === id ? response.medicalRecord : record
        )
      );

      // Message de succès avec info sur les notifications
      setActionSuccess(
        `Dossier médical mis à jour avec succès! 📩 Le patient et le médecin concernés ont été notifiés.`
      );
      
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      handleApiError(err, "Erreur lors de la modification du dossier médical");
    } finally {
      setActionLoading(false);
    }
  }, [data.medicalRecords, updateData, setActionLoading, clearMessages, setActionSuccess, handleApiError]);

  const handleAddUser = useCallback(async (userData) => {
    await createEntity('User', userData);
  }, [createEntity]);

  const handleUpdateUser = useCallback(async (id, userData) => {
    await updateEntity('User', id, userData);
  }, [updateEntity]);

  const handleDeleteUser = useCallback(async (id) => {
    await deleteEntity('User', id);
  }, [deleteEntity]);

  const handleAddPrescription = useCallback(async (prescriptionData) => {
    await createEntity('Prescription', prescriptionData);
  }, [createEntity]);

  const handleUpdatePrescription = useCallback(async (id, prescriptionData) => {
    await updateEntity('Prescription', id, prescriptionData);
  }, [updateEntity]);

  const handleDeletePrescription = useCallback(async (id) => {
    await deleteEntity('Prescription', id);
  }, [deleteEntity]);

  return {
    handleTabChange,
    handleInvoiceAction,
    handleAddPatient,
    handleUpdatePatient,
    handleDeletePatient,
    handleAddDoctor,
    handleUpdateDoctor,
    handleDeleteDoctor,
    handleAddAppointment,
    handleUpdateAppointment,
    handleDeleteAppointment,
    handleUpdateMedicalRecord, // NOUVEAU
    handleAddUser,
    handleUpdateUser,
    handleDeleteUser,
    handleAddPrescription,
    handleUpdatePrescription,
    handleDeletePrescription
  };
};