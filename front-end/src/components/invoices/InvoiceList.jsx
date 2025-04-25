// src/components/invoices/InvoiceList.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import { useNavigate } from "react-router-dom";

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    patient_id: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.patient_id) params.patient_id = filters.patient_id;

      const response = await axios.get("/api/invoices", {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setInvoices(response.data.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des factures:", err);
      setError("Impossible de charger les factures. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleViewInvoice = (id) => {
    navigate(`/invoices/${id}`);
  };

  const handleCreateInvoice = () => {
    navigate("/invoices/create");
  };

  // Formater un montant en devise
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Traduction des statuts
  const getStatusLabel = (status) => {
    const statuses = {
      pending: "En attente",
      paid: "Payée",
      cancelled: "Annulée",
      overdue: "En retard",
    };
    return statuses[status] || status;
  };

  // Classes pour les badges de statut
  const getStatusClass = (status) => {
    switch (status) {
      case "paid":
        return "status-badge-success";
      case "pending":
        return "status-badge-warning";
      case "cancelled":
        return "status-badge-danger";
      case "overdue":
        return "status-badge-danger";
      default:
        return "status-badge-secondary";
    }
  };

  if (loading) return <div className="loading-spinner">Chargement...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="invoice-list-container">
      <div className="list-header">
        <h2>Gestion des factures</h2>
        <button className="btn-primary" onClick={handleCreateInvoice}>
          <i className="fas fa-plus"></i> Nouvelle facture
        </button>
      </div>

      <div className="filters-panel">
        <div className="filter-item">
          <label htmlFor="status">Statut</label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="paid">Payées</option>
            <option value="cancelled">Annulées</option>
            <option value="overdue">En retard</option>
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="patient_id">Patient</label>
          <select
            id="patient_id"
            name="patient_id"
            value={filters.patient_id}
            onChange={handleFilterChange}
          >
            <option value="">Tous les patients</option>
            {/* Option: Ajouter ici la liste des patients */}
          </select>
        </div>

        <button className="btn-outline" onClick={() => setFilters({ status: "", patient_id: "" })}>
          <i className="fas fa-sync"></i> Réinitialiser
        </button>
      </div>

      {invoices.length > 0 ? (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Patient</th>
                <th>Date</th>
                <th>Échéance</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.number}</td>
                  <td>{invoice.patient ? invoice.patient.name : "N/A"}</td>
                  <td>{new Date(invoice.date).toLocaleDateString()}</td>
                  <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                  <td>{formatCurrency(invoice.total_amount)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="btn-icon"
                      title="Voir les détails"
                      onClick={() => handleViewInvoice(invoice.id)}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-file-invoice-dollar"></i>
          <h3>Aucune facture trouvée</h3>
          <p>Créez une nouvelle facture ou modifiez vos critères de recherche</p>
          <button className="btn-primary" onClick={handleCreateInvoice}>
            <i className="fas fa-plus"></i> Créer une facture
          </button>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;