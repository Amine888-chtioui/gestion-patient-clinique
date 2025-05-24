// src/hooks/useDashboardActions.js
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

export const useDashboardActions = (dashboardState, user) => {
  const navigate = useNavigate();
  const {
    data,
    updateData,
    setActionLoading,
    setActionError,
    setActionSuccess,
    clearMessages,
  } = dashboardState;

  const handleApiError = useCallback((err, defaultMessage = "Une erreur est survenue. Veuillez réessayer.") => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
    } else {
      setActionError(err.response?.data?.message || defaultMessage);
      setTimeout(() => setActionError(null), 5000);
    }
  }, [navigate, setActionError]);

  const handleBookAppointment = useCallback(async (appointmentData) => {
    setActionLoading(true);
    clearMessages();

    try {
      const response = await apiClient.createAppointment(appointmentData);
      
      const newAppointment = {
        id: response.appointment.id,
        date: appointmentData.date,
        time: appointmentData.time,
        doctor: response.appointment.doctor || "Dr.",
        status: "en attente",
        reason: appointmentData.reason,
      };

      updateData('appointments', [newAppointment, ...data.appointments]);
      setActionSuccess("Rendez-vous créé avec succès!");

      setTimeout(() => {
        navigate('/patient/dashboard/appointments', { replace: true });
      }, 1500);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [data.appointments, updateData, setActionLoading, clearMessages, setActionSuccess, navigate, handleApiError]);

  const handleCancelAppointment = useCallback(async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")) return;

    setActionLoading(true);
    clearMessages();

    try {
      await apiClient.cancelAppointment(id);
      
      updateData('appointments', 
        data.appointments.map((apt) =>
          apt.id === id ? { ...apt, status: "annulé" } : apt
        )
      );

      setActionSuccess("Rendez-vous annulé avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [data.appointments, updateData, setActionLoading, clearMessages, setActionSuccess, handleApiError]);

  const handleUpdateAppointment = useCallback(async (id, appointmentData) => {
    setActionLoading(true);
    clearMessages();

    try {
      const response = await apiClient.updateAppointment(id, appointmentData);
      
      updateData('appointments',
        data.appointments.map((appointment) =>
          appointment.id === id ? response.appointment : appointment
        )
      );

      setActionSuccess("Rendez-vous mis à jour avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [data.appointments, updateData, setActionLoading, clearMessages, setActionSuccess, handleApiError]);

  const handleUpdateProfile = useCallback(async (updatedProfile) => {
    setActionLoading(true);
    clearMessages();

    try {
      const response = await apiClient.updateProfile(updatedProfile);
      
      updateData('profile', response.profile || updatedProfile);
      setActionSuccess("Profil mis à jour avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [updateData, setActionLoading, clearMessages, setActionSuccess, handleApiError]);

  const handleUpdatePhoto = useCallback(async (photoFile) => {
    setActionLoading(true);
    clearMessages();

    try {
      const response = await apiClient.updateProfilePhoto(photoFile);
      
      updateData('profile', {
        ...data.profile,
        photoUrl: response.photo_url,
      });

      setActionSuccess("Photo de profil mise à jour avec succès!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  }, [data.profile, updateData, setActionLoading, clearMessages, setActionSuccess, handleApiError]);

  const handleDownloadDocument = useCallback(async (id) => {
    try {
      setActionLoading(true);
      const response = await apiClient.downloadDocument(id);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = "document.pdf";
      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      handleApiError(err, "Impossible de télécharger le document. Veuillez réessayer plus tard.");
    } finally {
      setActionLoading(false);
    }
  }, [setActionLoading, handleApiError]);

  const handleLogout = useCallback(async () => {
    try {
      setActionLoading(true);
      await apiClient.logout?.() || Promise.resolve();
    } catch (err) {
      console.error("Erreur de déconnexion:", err);
    } finally {
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [setActionLoading, navigate]);

  return {
    handleBookAppointment,
    handleCancelAppointment,
    handleUpdateAppointment,
    handleUpdateProfile,
    handleUpdatePhoto,
    handleDownloadDocument,
    handleLogout,
  };
};