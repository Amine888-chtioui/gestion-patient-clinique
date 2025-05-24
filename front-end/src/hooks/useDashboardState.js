// src/hooks/useDashboardState.js
import { useState, useCallback } from 'react';

export const useDashboardState = () => {
  const [loadingStates, setLoadingStates] = useState({
    overview: false,
    appointments: false,
    medicalRecords: false,
    prescriptions: false,
    profile: false,
    invoices: false,
    book: false,
  });

  const [dataLoaded, setDataLoaded] = useState({
    overview: false,
    appointments: false,
    medicalRecords: false,
    prescriptions: false,
    profile: true,
    invoices: false,
    book: false,
  });

  const [data, setData] = useState({
    appointments: [],
    medicalRecords: [],
    prescriptions: [],
    profile: null,
    doctors: [],
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const setLoadingState = useCallback((section, isLoading) => {
    setLoadingStates(prev => ({ ...prev, [section]: isLoading }));
  }, []);

  const markSectionAsLoaded = useCallback((section) => {
    setDataLoaded(prev => ({ ...prev, [section]: true }));
  }, []);

  const updateData = useCallback((section, newData) => {
    setData(prev => ({ ...prev, [section]: newData }));
  }, []);

  const clearMessages = useCallback(() => {
    setActionError(null);
    setActionSuccess(null);
  }, []);

  return {
    loadingStates,
    dataLoaded,
    data,
    actionLoading,
    actionError,
    actionSuccess,
    setLoadingState,
    markSectionAsLoaded,
    updateData,
    setActionLoading,
    setActionError,
    setActionSuccess,
    clearMessages,
  };
};