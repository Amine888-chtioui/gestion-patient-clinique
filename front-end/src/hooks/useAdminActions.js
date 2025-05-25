// src/hooks/useAdminActions.js
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

  // Specific entity handlers
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

  const handleAddAppointment = useCallback(async (appointmentData) => {
    await createEntity('Appointment', appointmentData);
  }, [createEntity]);

  const handleUpdateAppointment = useCallback(async (id, appointmentData) => {
    await updateEntity('Appointment', id, appointmentData);
  }, [updateEntity]);

  const handleDeleteAppointment = useCallback(async (id) => {
    await deleteEntity('Appointment', id);
  }, [deleteEntity]);

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
    handleAddUser,
    handleUpdateUser,
    handleDeleteUser,
    handleAddPrescription,
    handleUpdatePrescription,
    handleDeletePrescription
  };
};