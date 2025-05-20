import React, { useState, useEffect } from "react";
import axios from "../../axios";

const InvoiceForm = ({ onSuccess, onCancel, invoice = null, patients = [], actionLoading, setActionLoading }) => {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const defaultDueDate = thirtyDaysLater.toISOString().split("T")[0];

  // État initial du formulaire
  const initialFormState = {
    patient_id: "",
    appointment_id: "",
    date: today,
    due_date: defaultDueDate,
    tax_percent: 20,
    status: "draft",
    payment_method: "",
    payment_date: "",
    notes: "",
    items: [
      {
        description: "",
        quantity: 1,
        unit_price: 0,
      },
    ],
  };

  // État du formulaire
  const [formData, setFormData] = useState(initialFormState);
  const [appointments, setAppointments] = useState([]);
  const [errors, setErrors] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Calculer les totaux
  const [totals, setTotals] = useState({
    subtotal: 0,
    tax: 0,
    total: 0,
  });

  // Populer le formulaire avec les données d'une facture existante
  useEffect(() => {
    if (invoice) {
      setFormData({
        patient_id: invoice.patient_id.toString(),
        appointment_id: invoice.appointment_id ? invoice.appointment_id.toString() : "",
        date: invoice.date,
        due_date: invoice.due_date,
        tax_percent: invoice.tax_percent || 20,
        status: invoice.status || "draft",
        payment_method: invoice.payment_method || "",
        payment_date: invoice.payment_date || "",
        notes: invoice.notes || "",
        items: invoice.items && invoice.items.length > 0 
          ? invoice.items.map(item => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
            }))
          : [{ description: "", quantity: 1, unit_price: 0 }],
      });
      
      if (invoice.patient_id) {
        fetchPatientAppointments(invoice.patient_id);
        setSelectedPatient(patients.find(p => p.id === invoice.patient_id));
      }
    }
  }, [invoice, patients]);

  // Calculer les totaux à chaque changement des éléments
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.tax_percent]);

  // Récupérer les rendez-vous du patient
  const fetchPatientAppointments = async (patientId) => {
    if (!patientId) return;
    
    try {
      const response = await axios.get(`/api/patients/${patientId}/appointments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setAppointments(response.data.appointments || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des rendez-vous:", err);
      setAppointments([]);
    }
  };

  // Gérer les changements dans le formulaire principal
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "patient_id" && value !== formData.patient_id) {
      fetchPatientAppointments(value);
      setSelectedPatient(patients.find(p => p.id === parseInt(value)));
      setFormData(prev => ({
        ...prev,
        [name]: value,
        appointment_id: "" // Réinitialiser le rendez-vous
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Gérer les changements dans les éléments de la facture
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];
    
    // Convertir en nombre si nécessaire
    const newValue = name === "quantity" || name === "unit_price" 
      ? value === "" ? "" : parseFloat(value) 
      : value;
    
    newItems[index] = {
      ...newItems[index],
      [name]: newValue
    };
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[`items.${index}.${name}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`items.${index}.${name}`];
        return newErrors;
      });
    }
  };

  // Ajouter un nouvel élément
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { description: "", quantity: 1, unit_price: 0 }
      ]
    }));
  };

  // Supprimer un élément
  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  // Calculer les totaux
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
      return sum + itemTotal;
    }, 0);
    
    const taxRate = parseFloat(formData.tax_percent) / 100;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    setTotals({
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2)
    });
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.patient_id) {
      newErrors.patient_id = "Le patient est requis";
    }
    
    if (!formData.date) {
      newErrors.date = "La date est requise";
    }
    
    if (!formData.due_date) {
      newErrors.due_date = "La date d'échéance est requise";
    }
    
    if (formData.items.length === 0) {
      newErrors.items = "Au moins un élément est requis";
    } else {
      formData.items.forEach((item, index) => {
        if (!item.description) {
          newErrors[`items.${index}.description`] = "La description est requise";
        }
        
        if (!item.quantity) {
          newErrors[`items.${index}.quantity`] = "La quantité est requise";
        } else if (isNaN(parseFloat(item.quantity)) || parseFloat(item.quantity) <= 0) {
          newErrors[`items.${index}.quantity`] = "La quantité doit être un nombre positif";
        }
        
        if (!item.unit_price && item.unit_price !== 0) {
          newErrors[`items.${index}.unit_price`] = "Le prix unitaire est requis";
        } else if (isNaN(parseFloat(item.unit_price)) || parseFloat(item.unit_price) < 0) {
          newErrors[`items.${index}.unit_price`] = "Le prix unitaire doit être un nombre positif ou zéro";
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setActionLoading(true);
    
    try {
      // Préparer les données pour l'API
      const apiData = {
        ...formData,
        tax_percent: parseFloat(formData.tax_percent),
        items: formData.items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
        }))
      };
      
      // Supprimer les champs vides
      if (!apiData.appointment_id) delete apiData.appointment_id;
      if (!apiData.payment_method) delete apiData.payment_method;
      if (!apiData.payment_date) delete apiData.payment_date;
      if (!apiData.notes) delete apiData.notes;
      
      let response;
      
      if (invoice) {
        // Mise à jour d'une facture existante
        response = await axios.put(`/api/invoices/${invoice.id}`, apiData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
      } else {
        // Création d'une nouvelle facture
        response = await axios.post("/api/invoices", apiData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
      }
      
      // Appeler la fonction de succès
      if (onSuccess) {
        onSuccess(response.data);
      }
      
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la facture:", err);
      
      // Traiter les erreurs de validation du serveur
      if (err.response && err.response.status === 422 && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({
          global: err.response?.data?.message || "Une erreur est survenue lors de l'enregistrement de la facture"
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Formater un montant en euros
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR"
    }).format(amount);
  };

  return (
    <div className="invoice-form">
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h4>Informations générales</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="patient_id">Patient *</label>
              <select
                id="patient_id"
                name="patient_id"
                className={`form-control ${errors.patient_id ? "is-invalid" : ""}`}
                value={formData.patient_id}
                onChange={handleChange}
                disabled={actionLoading}
              >
                <option value="">Sélectionner un patient</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
              {errors.patient_id && <div className="invalid-feedback">{errors.patient_id}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="appointment_id">Rendez-vous lié (optionnel)</label>
              <select
                id="appointment_id"
                name="appointment_id"
                className="form-control"
                value={formData.appointment_id}
                onChange={handleChange}
                disabled={!formData.patient_id || actionLoading}
              >
                <option value="">Aucun</option>
                {appointments.map(appointment => (
                  <option key={appointment.id} value={appointment.id}>
                    {appointment.date} - {appointment.doctor}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date de facturation *</label>
              <input
                type="date"
                id="date"
                name="date"
                className={`form-control ${errors.date ? "is-invalid" : ""}`}
                value={formData.date}
                onChange={handleChange}
                disabled={actionLoading}
              />
              {errors.date && <div className="invalid-feedback">{errors.date}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="due_date">Date d'échéance *</label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                className={`form-control ${errors.due_date ? "is-invalid" : ""}`}
                value={formData.due_date}
                onChange={handleChange}
                disabled={actionLoading}
              />
              {errors.due_date && <div className="invalid-feedback">{errors.due_date}</div>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Statut</label>
              <select
                id="status"
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleChange}
                disabled={actionLoading}
              >
                <option value="draft">Brouillon</option>
                <option value="sent">Envoyée</option>
                <option value="paid">Payée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="tax_percent">TVA (%)</label>
              <input
                type="number"
                id="tax_percent"
                name="tax_percent"
                className="form-control"
                value={formData.tax_percent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                disabled={actionLoading}
              />
            </div>
          </div>
          
          {formData.status === "paid" && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="payment_method">Méthode de paiement</label>
                <select
                  id="payment_method"
                  name="payment_method"
                  className="form-control"
                  value={formData.payment_method}
                  onChange={handleChange}
                  disabled={actionLoading}
                >
                  <option value="">Sélectionner</option>
                  <option value="cash">Espèces</option>
                  <option value="card">Carte bancaire</option>
                  <option value="transfer">Virement</option>
                  <option value="check">Chèque</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="payment_date">Date de paiement</label>
                <input
                  type="date"
                  id="payment_date"
                  name="payment_date"
                  className="form-control"
                  value={formData.payment_date}
                  onChange={handleChange}
                  disabled={actionLoading}
                />
              </div>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="notes">Notes (optionnel)</label>
            <textarea
              id="notes"
              name="notes"
              className="form-control"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              disabled={actionLoading}
              placeholder="Notes ou informations supplémentaires..."
            ></textarea>
          </div>
        </div>
        
        <div className="form-section">
          <div className="section-header">
            <h4>Éléments de la facture</h4>
            <button
              type="button"
              className="btn-outline"
              onClick={addItem}
              disabled={actionLoading}
            >
              <i className="fas fa-plus"></i> Ajouter un élément
            </button>
          </div>
          
          {errors.items && typeof errors.items === "string" && (
            <div className="alert alert-danger">{errors.items}</div>
          )}
          
          <div className="invoice-items">
            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th style={{ width: "50%" }}>Description</th>
                  <th style={{ width: "15%" }}>Quantité</th>
                  <th style={{ width: "15%" }}>Prix unitaire</th>
                  <th style={{ width: "15%" }}>Total</th>
                  <th style={{ width: "5%" }}></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => {
                  const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
                  return (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          name="description"
                          className={`form-control ${errors[`items.${index}.description`] ? "is-invalid" : ""}`}
                          value={item.description}
                          onChange={(e) => handleItemChange(index, e)}
                          placeholder="Description de l'acte ou du service"
                          disabled={actionLoading}
                        />
                        {errors[`items.${index}.description`] && (
                          <div className="invalid-feedback">{errors[`items.${index}.description`]}</div>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          name="quantity"
                          className={`form-control ${errors[`items.${index}.quantity`] ? "is-invalid" : ""}`}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, e)}
                          min="1"
                          step="1"
                          disabled={actionLoading}
                        />
                        {errors[`items.${index}.quantity`] && (
                          <div className="invalid-feedback">{errors[`items.${index}.quantity`]}</div>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          name="unit_price"
                          className={`form-control ${errors[`items.${index}.unit_price`] ? "is-invalid" : ""}`}
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, e)}
                          min="0"
                          step="0.01"
                          disabled={actionLoading}
                        />
                        {errors[`items.${index}.unit_price`] && (
                          <div className="invalid-feedback">{errors[`items.${index}.unit_price`]}</div>
                        )}
                      </td>
                      <td className="item-total">
                        {formatCurrency(itemTotal)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon danger"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1 || actionLoading}
                          title="Supprimer cet élément"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="invoice-summary">
            <div className="summary-row">
              <div className="summary-label">Sous-total:</div>
              <div className="summary-value">{formatCurrency(totals.subtotal)}</div>
            </div>
            <div className="summary-row">
              <div className="summary-label">TVA ({formData.tax_percent}%):</div>
              <div className="summary-value">{formatCurrency(totals.tax)}</div>
            </div>
            <div className="summary-row total">
              <div className="summary-label">Total:</div>
              <div className="summary-value">{formatCurrency(totals.total)}</div>
            </div>
          </div>
        </div>
        
        {errors.global && (
          <div className="alert alert-danger">{errors.global}</div>
        )}
        
        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={actionLoading}
          >
            {actionLoading ? (
              <span><i className="loading-spinner"></i> Traitement...</span>
            ) : (
              <span><i className="fas fa-save"></i> {invoice ? "Mettre à jour" : "Enregistrer"}</span>
            )}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={actionLoading}
          >
            <i className="fas fa-times"></i> Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;