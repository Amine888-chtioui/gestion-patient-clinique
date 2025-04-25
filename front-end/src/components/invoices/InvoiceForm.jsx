// src/components/invoices/InvoiceForm.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../axios";

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patient_id: "",
    date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
    items: [{ description: "", quantity: 1, unit_price: 0 }],
  });

  useEffect(() => {
    fetchPatients();
    if (isEditMode) {
      fetchInvoiceData();
    }
  }, [id]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get("/api/patients", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setPatients(response.data.patients || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des patients:", err);
    }
  };

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      const invoice = response.data.data;
      setFormData({
        patient_id: invoice.patient_id.toString(),
        date: invoice.date,
        due_date: invoice.due_date,
        notes: invoice.notes || "",
        items: invoice.items && invoice.items.length > 0 
          ? invoice.items.map(item => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price
            }))
          : [{ description: "", quantity: 1, unit_price: 0 }],
      });
    } catch (err) {
      console.error("Erreur lors de la récupération des données de la facture:", err);
      setError("Impossible de charger les données de la facture. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const parsedValue = field === "quantity" || field === "unit_price" 
      ? parseFloat(value) || 0 
      : value;
    
    updatedItems[index] = { ...updatedItems[index], [field]: parsedValue };
    setFormData({ ...formData, items: updatedItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, unit_price: 0 }],
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData({ ...formData, items: updatedItems });
  };

  const calculateItemTotal = (item) => {
    return item.quantity * item.unit_price;
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      
      // Validation de base
      if (!formData.patient_id) {
        alert("Veuillez sélectionner un patient");
        setLoading(false);
        return;
      }

      if (!formData.items.every(item => item.description && item.quantity > 0)) {
        alert("Veuillez compléter tous les champs des éléments de facture");
        setLoading(false);
        return;
      }

      const endpoint = isEditMode 
        ? `/api/invoices/${id}` 
        : "/api/invoices";
      
      const method = isEditMode ? "put" : "post";

      const response = await axios[method](
        endpoint,
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      navigate(`/invoices/${response.data.data.id}`);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la facture:", err);
      setError("Impossible d'enregistrer la facture. " + (err.response?.data?.message || "Veuillez réessayer plus tard."));
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) return <div className="loading-spinner">Chargement...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="invoice-form-container">
      <div className="form-header">
        <h2>{isEditMode ? "Modifier la facture" : "Créer une nouvelle facture"}</h2>
        <button className="btn-secondary" onClick={() => navigate("/invoices")}>
          <i className="fas fa-times"></i> Annuler
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-sections">
          <div className="form-section">
            <h3>Informations générales</h3>
            
            <div className="form-group">
              <label htmlFor="patient_id">Patient*</label>
              <select
                id="patient_id"
                name="patient_id"
                value={formData.patient_id}
                onChange={handleChange}
                required
                disabled={isEditMode}
              >
                <option value="">Sélectionnez un patient</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} ({patient.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Date de facture*</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
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
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
              />
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>Éléments de la facture</h3>
              <button type="button" className="btn-outline" onClick={addItem}>
                <i className="fas fa-plus"></i> Ajouter un élément
              </button>
            </div>

            <div className="invoice-items">
              {formData.items.map((item, index) => (
                <div key={index} className="invoice-item">
                  <div className="item-header">
                    <h4>Élément #{index + 1}</h4>
                    <button
                      type="button"
                      className="btn-icon danger"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length <= 1}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`item-description-${index}`}>Description*</label>
                    <input
                      type="text"
                      id={`item-description-${index}`}
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      required
                      placeholder="Ex: Consultation médicale"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`item-quantity-${index}`}>Quantité*</label>
                      <input
                        type="number"
                        id={`item-quantity-${index}`}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        min="1"
                        step="1"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor={`item-price-${index}`}>Prix unitaire (€)*</label>
                      <input
                        type="number"
                        id={`item-price-${index}`}
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, "unit_price", e.target.value)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Total</label>
                      <div className="calculated-value">
                        {calculateItemTotal(item).toFixed(2)} €
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="invoice-summary">
              <div className="summary-row">
                <div className="summary-label">Sous-total:</div>
                <div className="summary-value">{calculateTotal().toFixed(2)} €</div>
              </div>
              <div className="summary-row">
                <div className="summary-label">TVA (20%):</div>
                <div className="summary-value">{(calculateTotal() * 0.2).toFixed(2)} €</div>
              </div>
              <div className="summary-row total">
                <div className="summary-label">Total:</div>
                <div className="summary-value">{(calculateTotal() * 1.2).toFixed(2)} €</div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span><i className="fas fa-spinner fa-spin"></i> Enregistrement...</span>
            ) : (
              <span><i className="fas fa-save"></i> {isEditMode ? "Mettre à jour" : "Créer la facture"}</span>
            )}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate("/invoices")}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;