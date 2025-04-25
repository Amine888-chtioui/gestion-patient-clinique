// src/components/admin-dashboard/InvoicesManagement.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import InvoiceList from "./invoices/InvoiceList";
import InvoiceForm from "./invoices/InvoiceForm";
import InvoiceDetails from "./invoices/InvoiceDetails";

const InvoicesManagement = ({ actionLoading, setActionLoading, setActionError, setActionSuccess }) => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [statistics, setStatistics] = useState({
    unpaid_total: 0,
    overdue_count: 0
  });
  const [view, setView] = useState("list"); // list, create, edit, details
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [patients, setPatients] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    patient_id: "",
    date_from: "",
    date_to: "",
    search: ""
  });

  // Récupérer les factures et statistiques au chargement
  useEffect(() => {
    fetchInvoices();
    fetchPatients();
  }, []);

  // Appliquer les filtres
  useEffect(() => {
    if (invoices.length > 0) {
      let result = [...invoices];
      
      if (filters.status) {
        result = result.filter(invoice => invoice.status === filters.status);
      }
      
      if (filters.patient_id) {
        result = result.filter(invoice => invoice.patient_id === parseInt(filters.patient_id));
      }
      
      if (filters.date_from) {
        result = result.filter(invoice => new Date(invoice.date) >= new Date(filters.date_from));
      }
      
      if (filters.date_to) {
        result = result.filter(invoice => new Date(invoice.date) <= new Date(filters.date_to));
      }
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(invoice => 
          invoice.number.toLowerCase().includes(search) ||
          (invoice.patient && invoice.patient.name.toLowerCase().includes(search)) ||
          (invoice.patient && invoice.patient.email.toLowerCase().includes(search))
        );
      }
      
      setFilteredInvoices(result);
    }
  }, [filters, invoices]);

  // Fonction pour récupérer les factures
  const fetchInvoices = async () => {
    try {
      setActionLoading(true);
      const response = await axios.get("/api/admin/invoices", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setInvoices(response.data.invoices.data || []);
      setFilteredInvoices(response.data.invoices.data || []);
      setStatistics({
        unpaid_total: response.data.unpaid_total || 0,
        overdue_count: response.data.overdue_count || 0
      });
      
    } catch (err) {
      console.error("Erreur lors de la récupération des factures:", err);
      setActionError("Impossible de charger les factures. Veuillez réessayer plus tard.");
    } finally {
      setActionLoading(false);
    }
  };

  // Fonction pour récupérer les patients
  const fetchPatients = async () => {
    try {
      const response = await axios.get("/api/admin/patients", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setPatients(response.data.patients || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des patients:", err);
    }
  };

  // Fonction pour créer une facture
  const handleCreateInvoice = async (invoiceData) => {
    try {
      setActionLoading(true);
      const response = await axios.post("/api/admin/invoices", invoiceData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Ajouter la nouvelle facture à la liste
      setInvoices([response.data.invoice, ...invoices]);
      setActionSuccess("Facture créée avec succès!");
      setView("list");
      
    } catch (err) {
      console.error("Erreur lors de la création de la facture:", err);
      setActionError(
        err.response?.data?.message ||
        "Impossible de créer la facture. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Fonction pour mettre à jour une facture
  const handleUpdateInvoice = async (id, invoiceData) => {
    try {
      setActionLoading(true);
      const response = await axios.put(`/api/admin/invoices/${id}`, invoiceData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Mettre à jour la facture dans la liste
      setInvoices(
        invoices.map((invoice) =>
          invoice.id === id ? response.data.invoice : invoice
        )
      );
      
      setActionSuccess("Facture mise à jour avec succès!");
      setView("details");
      setSelectedInvoice(response.data.invoice);
      
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la facture:", err);
      setActionError(
        err.response?.data?.message ||
        "Impossible de mettre à jour la facture. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Fonction pour supprimer une facture
  const handleDeleteInvoice = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      return;
    }
    
    try {
      setActionLoading(true);
      await axios.delete(`/api/admin/invoices/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Supprimer la facture de la liste
      setInvoices(invoices.filter(invoice => invoice.id !== id));
      setActionSuccess("Facture supprimée avec succès!");
      setView("list");
      
    } catch (err) {
      console.error("Erreur lors de la suppression de la facture:", err);
      setActionError(
        err.response?.data?.message ||
        "Impossible de supprimer la facture. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Fonction pour marquer une facture comme payée
  const handleMarkAsPaid = async (id, paymentData) => {
    try {
      setActionLoading(true);
      const response = await axios.post(`/api/admin/invoices/${id}/mark-as-paid`, paymentData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Mettre à jour la facture dans la liste
      setInvoices(
        invoices.map((invoice) =>
          invoice.id === id ? response.data.invoice : invoice
        )
      );
      
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice(response.data.invoice);
      }
      
      setActionSuccess("Facture marquée comme payée avec succès!");
      
    } catch (err) {
      console.error("Erreur lors du marquage de la facture:", err);
      setActionError(
        err.response?.data?.message ||
        "Impossible de marquer la facture comme payée. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Fonction pour envoyer une facture par email
  const handleSendByEmail = async (id) => {
    try {
      setActionLoading(true);
      await axios.post(`/api/admin/invoices/${id}/send-email`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Mettre à jour la facture dans la liste si nécessaire
      fetchInvoices();
      
      setActionSuccess("Facture envoyée par email avec succès!");
      
    } catch (err) {
      console.error("Erreur lors de l'envoi de la facture:", err);
      setActionError(
        err.response?.data?.message ||
        "Impossible d'envoyer la facture par email. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Fonction pour générer un PDF
  const handleGeneratePdf = async (id) => {
    try {
      setActionLoading(true);
      await axios.get(`/api/admin/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Dans une application réelle, cela déclencherait un téléchargement
      setActionSuccess("PDF généré avec succès!");
      
    } catch (err) {
      console.error("Erreur lors de la génération du PDF:", err);
      setActionError(
        err.response?.data?.message ||
        "Impossible de générer le PDF. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Gérer le changement de vue
  const handleViewChange = (newView, invoice = null) => {
    setView(newView);
    setSelectedInvoice(invoice);
  };

  // Gérer le changement de filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      status: "",
      patient_id: "",
      date_from: "",
      date_to: "",
      search: ""
    });
  };

  // Rendu conditionnel en fonction de la vue active
  const renderContent = () => {
    switch (view) {
      case "create":
        return (
          <InvoiceForm 
            patients={patients}
            onSubmit={handleCreateInvoice}
            onCancel={() => handleViewChange("list")}
            actionLoading={actionLoading}
          />
        );
      case "edit":
        return (
          <InvoiceForm 
            invoice={selectedInvoice}
            patients={patients}
            onSubmit={(data) => handleUpdateInvoice(selectedInvoice.id, data)}
            onCancel={() => handleViewChange("details", selectedInvoice)}
            actionLoading={actionLoading}
          />
        );
      case "details":
        return (
          <InvoiceDetails 
            invoice={selectedInvoice}
            onBack={() => handleViewChange("list")}
            onEdit={() => handleViewChange("edit", selectedInvoice)}
            onDelete={() => handleDeleteInvoice(selectedInvoice.id)}
            onMarkAsPaid={handleMarkAsPaid}
            onSendByEmail={() => handleSendByEmail(selectedInvoice.id)}
            onGeneratePdf={() => handleGeneratePdf(selectedInvoice.id)}
            actionLoading={actionLoading}
          />
        );
      default:
        return (
          <InvoiceList 
            invoices={filteredInvoices}
            statistics={statistics}
            filters={filters}
            patients={patients}
            onFilterChange={handleFilterChange}
            onResetFilters={resetFilters}
            onCreateClick={() => handleViewChange("create")}
            onViewDetails={(invoice) => handleViewChange("details", invoice)}
            onDeleteClick={handleDeleteInvoice}
            onMarkAsPaid={handleMarkAsPaid}
            actionLoading={actionLoading}
          />
        );
    }
  };

  return (
    <div className="invoices-management">
      {renderContent()}
    </div>
  );
};

export default InvoicesManagement;