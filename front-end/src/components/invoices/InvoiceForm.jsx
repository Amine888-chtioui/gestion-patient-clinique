// src/components/invoices/InvoiceForm.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../axios";
import UnifiedLoadingSpinner from "../../components/common/UnifiedLoadingSpinner";
import ErrorDisplay from "../../components/common/ErrorDisplay";

const InvoiceForm = ({ onInvoiceAction }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(id ? true : false);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    patient_id: "",
    issue_date: new Date().toISOString().split('T')[0],
    due_date: "",
    items: [{ description: "", unit_price: 0, quantity: 1, total: 0 }],
    subtotal_amount: 0,
    tax_rate: 20,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    status: "unpaid",
    notes: ""
  });
  
  // Chargement des patients
  useEffect(() => {
    fetchPatients();
    
    // Si c'est une modification, charger les données de la facture
    if (id) {
      fetchInvoice();
    } else {
      // Définir la date d'échéance par défaut (aujourd'hui + 30 jours)
      const today = new Date();
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + 30);
      
      setFormData(prev => ({
        ...prev,
        due_date: dueDate.toISOString().split('T')[0]
      }));
    }
  }, [id]);
  
  // Mettre à jour le sous-total lorsque les articles changent
  useEffect(() => {
    updateTotals();
  }, [formData.items, formData.tax_rate, formData.discount_amount]);
  
  const fetchPatients = async () => {
    try {
      setPatientsLoading(true);
      const response = await axios.get("/api/admin/patients", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setPatients(response.data.patients || []);
      setPatientsLoading(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des patients:", err);
      setPatientsLoading(false);
    }
  };
  
  const fetchInvoice = async () => {
    try {
      setInitialLoading(true);
      const response = await axios.get(`/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Formater les données pour le formulaire
      const invoice = response.data.data;
      setFormData({
        patient_id: invoice.patient_id || "",
        issue_date: invoice.issue_date || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date || "",
        items: invoice.items || [{ description: "", unit_price: 0, quantity: 1, total: 0 }],
        subtotal_amount: invoice.subtotal_amount || 0,
        tax_rate: invoice.tax_rate || 20,
        tax_amount: invoice.tax_amount || 0,
        discount_amount: invoice.discount_amount || 0,
        total_amount: invoice.total_amount || 0,
        status: invoice.status || "unpaid",
        notes: invoice.notes || ""
      });
      
      setInitialLoading(false);
    } catch (err) {
      console.error("Erreur lors de la récupération de la facture:", err);
      setError("Impossible de charger la facture pour modification.");
      setInitialLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Calculer le total de la ligne si le prix ou la quantité change
    if (field === "unit_price" || field === "quantity") {
      newItems[index].total = newItems[index].unit_price * newItems[index].quantity;
    }
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };
  
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", unit_price: 0, quantity: 1, total: 0 }]
    }));
  };
  
  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        items: newItems
      }));
    }
  };
  
  const updateTotals = () => {
    // Calculer le sous-total
    const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    
    // Calculer la TVA
    const taxAmount = (subtotal * (parseFloat(formData.tax_rate) || 0)) / 100;
    
    // Calculer le total
    const total = subtotal + taxAmount - (parseFloat(formData.discount_amount) || 0);
    
    setFormData(prev => ({
      ...prev,
      subtotal_amount: subtotal,
      tax_amount: taxAmount,
      total_amount: total
    }));
  };
  
  // Gérer l'annulation du formulaire
  const handleCancel = (e) => {
    e.preventDefault();
    if (onInvoiceAction) {
      onInvoiceAction('list');
    } else {
      // Fallback si onInvoiceAction n'est pas disponible
      navigate('/admin/dashboard/invoices');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (id) {
        // Mise à jour d'une facture existante
        await axios.put(`/api/invoices/${id}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
      } else {
        // Création d'une nouvelle facture
        await axios.post("/api/invoices", formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
      }
      
      // Rediriger vers la liste des factures
      if (onInvoiceAction) {
        onInvoiceAction('list');
      } else {
        navigate('/admin/dashboard/invoices');
      }
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la facture:", err);
      setError(err.response?.data?.message || "Une erreur est survenue lors de l'enregistrement de la facture.");
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };
  
  if (initialLoading) {
    return <UnifiedLoadingSpinner size="medium" text="Chargement du formulaire..." />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  return (
    <div className="invoice-form-container">
      <div className="invoice-form-header">
        <h2>{id ? "Modifier la facture" : "Créer une nouvelle facture"}</h2>
        <button className="btn-outline" onClick={handleCancel}>
          <i className="fas fa-times"></i> Annuler
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Informations générales</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="patient_id">Patient*</label>
              {patientsLoading ? (
                <div className="select-loading">Chargement des patients...</div>
              ) : (
                <select
                  id="patient_id"
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleChange}
                  required
                  className="form-control"
                  disabled={loading}
                >
                  <option value="">Sélectionner un patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Statut*</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="form-control"
                disabled={loading}
              >
                <option value="unpaid">Non payée</option>
                <option value="paid">Payée</option>
                <option value="pending">En attente</option>
                <option value="overdue">En retard</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="issue_date">Date d'émission*</label>
              <input
                type="date"
                id="issue_date"
                name="issue_date"
                value={formData.issue_date}
                onChange={handleChange}
                required
                className="form-control"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="due_date">Date d'échéance*</label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
                className="form-control"
                disabled={loading}
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Prestations</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Prix unitaire</th>
                <th>Quantité</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      placeholder="Description de la prestation"
                      className="form-control"
                      required
                      disabled={loading}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, "unit_price", parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="form-control"
                      required
                      disabled={loading}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                      min="1"
                      className="form-control"
                      required
                      disabled={loading}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={formatCurrency(item.total)}
                      readOnly
                      className="form-control-plaintext"
                      disabled
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-icon danger"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length <= 1 || loading}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button
            type="button"
            className="btn-outline add-item"
            onClick={addItem}
            disabled={loading}
          >
            <i className="fas fa-plus"></i> Ajouter une prestation
          </button>
        </div>
        
        <div className="form-section">
          <div className="invoice-totals">
            <div className="totals-group">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tax_rate">Taux de TVA (%)</label>
                  <input
                    type="number"
                    id="tax_rate"
                    name="tax_rate"
                    value={formData.tax_rate}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="form-control"
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="discount_amount">Remise</label>
                  <input
                    type="number"
                    id="discount_amount"
                    name="discount_amount"
                    value={formData.discount_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="form-control"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="totals-summary">
                <div className="summary-row">
                  <span className="summary-label">Sous-total:</span>
                  <span className="summary-value">{formatCurrency(formData.subtotal_amount)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">TVA ({formData.tax_rate}%):</span>
                  <span className="summary-value">{formatCurrency(formData.tax_amount)}</span>
                </div>
                {formData.discount_amount > 0 && (
                  <div className="summary-row">
                    <span className="summary-label">Remise:</span>
                    <span className="summary-value">-{formatCurrency(formData.discount_amount)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span className="summary-label">Total:</span>
                  <span className="summary-value">{formatCurrency(formData.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Notes</h3>
          <div className="form-group">
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="form-control"
              placeholder="Notes ou instructions supplémentaires (optionnel)"
              disabled={loading}
            ></textarea>
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Enregistrement...</>
            ) : (
              <><i className="fas fa-save"></i> {id ? "Mettre à jour" : "Créer la facture"}</>
            )}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;