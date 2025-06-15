// src/components/invoices/InvoiceForm.jsx - Version corrigée
import React, { useState, useEffect } from "react";
import axios from "../../axios";

const InvoiceForm = ({ onSuccess, onCancel, invoice = null }) => {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const defaultDueDate = thirtyDaysLater.toISOString().split("T")[0];

  // États
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);

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

  const [formData, setFormData] = useState(initialFormState);

  // Calculer les totaux
  const [totals, setTotals] = useState({
    subtotal: 0,
    tax: 0,
    total: 0,
  });

  // Charger les patients au chargement du composant
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoadingPatients(true);
        console.log("🔄 Chargement des patients pour le formulaire de facture...");
        
        const response = await axios.get("/api/admin/patients", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        
        const patientsData = response.data.patients || [];
        setPatients(patientsData);
        console.log(`✅ ${patientsData.length} patients chargés pour le formulaire`);
        
      } catch (err) {
        console.error("❌ Erreur lors du chargement des patients:", err);
        setErrors(prev => ({ ...prev, global: "Impossible de charger la liste des patients" }));
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, []);

  // Populer le formulaire avec les données d'une facture existante
  useEffect(() => {
    if (invoice && patients.length > 0) {
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

  // Récupérer les rendez-vous du patient - VERSION CORRIGÉE
  const fetchPatientAppointments = async (patientId) => {
    if (!patientId) {
      setAppointments([]);
      return;
    }
    
    setLoadingAppointments(true);
    
    try {
      console.log(`🔄 Chargement des rendez-vous pour le patient ${patientId}...`);
      
      // Essayer d'abord avec l'endpoint admin spécifique
      let response;
      try {
        response = await axios.get(`/api/admin/patients/${patientId}/appointments`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        
        setAppointments(response.data.appointments || []);
        console.log(`✅ ${response.data.appointments?.length || 0} rendez-vous trouvés pour le patient`);
        
      } catch (adminError) {
        console.warn("⚠️ Endpoint admin spécifique non disponible, essai avec l'endpoint général...");
        
        // Si l'endpoint spécifique n'existe pas, récupérer tous les rendez-vous et filtrer
        try {
          response = await axios.get("/api/admin/appointments", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });
          
          const allAppointments = response.data.appointments || [];
          const patientAppointments = allAppointments.filter(
            apt => apt.patient_id === parseInt(patientId)
          );
          
          setAppointments(patientAppointments);
          console.log(`✅ ${patientAppointments.length} rendez-vous filtrés pour le patient`);
          
        } catch (generalError) {
          console.warn("⚠️ Endpoint admin général non disponible, essai avec l'endpoint doctor...");
          
          // Dernier recours : essayer avec l'endpoint doctor
          try {
            response = await axios.get("/api/doctor/appointments", {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            
            const allAppointments = response.data.appointments || [];
            const patientAppointments = allAppointments.filter(
              apt => apt.patient_id === parseInt(patientId)
            );
            
            setAppointments(patientAppointments);
            console.log(`✅ ${patientAppointments.length} rendez-vous filtrés depuis l'endpoint doctor`);
            
          } catch (doctorError) {
            console.error("❌ Aucun endpoint disponible pour récupérer les rendez-vous:", doctorError);
            setAppointments([]);
          }
        }
      }
      
    } catch (err) {
      console.error("❌ Erreur lors de la récupération des rendez-vous:", err);
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
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
      ? value === "" ? "" : parseFloat(value) || 0
      : value;
    
    newItems[index][name] = newValue;
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  // Ajouter un nouvel élément
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unit_price: 0 }]
    }));
  };

  // Supprimer un élément
  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  // Calculer les totaux
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
    
    const taxPercent = parseFloat(formData.tax_percent) || 0;
    const tax = (subtotal * taxPercent) / 100;
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
        patient_id: parseInt(formData.patient_id),
        appointment_id: formData.appointment_id ? parseInt(formData.appointment_id) : null,
        date: formData.date,
        due_date: formData.due_date,
        tax_percent: parseFloat(formData.tax_percent) || 0,
        status: formData.status,
        payment_method: formData.payment_method || null,
        payment_date: formData.payment_date || null,
        notes: formData.notes || null,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price)
        }))
      };
      
      let response;
      
      if (invoice && invoice.id) {
        // Mise à jour d'une facture existante
        response = await axios.put(`/api/invoices/${invoice.id}`, apiData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        console.log("✅ Facture mise à jour:", response.data);
      } else {
        // Création d'une nouvelle facture
        response = await axios.post("/api/invoices", apiData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        console.log("✅ Nouvelle facture créée:", response.data);
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
    } catch (err) {
      console.error("❌ Erreur lors de la soumission:", err);
      
      if (err.response?.status === 422) {
        // Erreurs de validation
        const validationErrors = err.response.data.errors || {};
        setErrors(validationErrors);
      } else {
        setErrors({
          global: err.response?.data?.message || "Une erreur est survenue lors de la sauvegarde"
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Annuler et fermer le formulaire
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (loadingPatients) {
    return (
      <div className="invoice-form-loading">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Chargement...</span>
          </div>
          <p className="mt-2">Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-form">
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {invoice ? "Modifier la facture" : "Nouvelle facture"}
            </h3>
          </div>
          
          <div className="card-body">
            {errors.global && (
              <div className="alert alert-danger">
                {errors.global}
              </div>
            )}
            
            {/* Informations générales */}
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
                        {patient.first_name} {patient.last_name} ({patient.email})
                      </option>
                    ))}
                  </select>
                  {errors.patient_id && <div className="invalid-feedback">{errors.patient_id}</div>}
                  {patients.length === 0 && (
                    <small className="form-text text-muted">
                      Veuillez d'abord créer des patients dans la section "Patients".
                    </small>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="appointment_id">Rendez-vous lié (optionnel)</label>
                  <select
                    id="appointment_id"
                    name="appointment_id"
                    className="form-control"
                    value={formData.appointment_id}
                    onChange={handleChange}
                    disabled={!formData.patient_id || actionLoading || loadingAppointments}
                  >
                    <option value="">
                      {loadingAppointments ? "Chargement..." : "Aucun"}
                    </option>
                    {appointments.map(appointment => (
                      <option key={appointment.id} value={appointment.id}>
                        {appointment.date} - {appointment.doctor_name || "Docteur"}
                      </option>
                    ))}
                  </select>
                  {loadingAppointments && (
                    <small className="form-text text-muted">
                      <i className="fa fa-spinner fa-spin"></i> Chargement des rendez-vous...
                    </small>
                  )}
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
                    <option value="overdue">En retard</option>
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
                    step="0.01"
                    disabled={actionLoading}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Notes (optionnel)</label>
                <textarea
                  id="notes"
                  name="notes"
                  className="form-control"
                  rows="3"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Notes ou informations supplémentaires..."
                  disabled={actionLoading}
                />
              </div>
            </div>

            {/* Éléments de la facture */}
            <div className="form-section">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Éléments de la facture</h4>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={addItem}
                  disabled={actionLoading}
                >
                  <i className="fa fa-plus"></i> Ajouter un élément
                </button>
              </div>
              
              {errors.items && (
                <div className="alert alert-danger">
                  {errors.items}
                </div>
              )}
              
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead className="thead-light">
                    <tr>
                      <th>Description</th>
                      <th width="100">Quantité</th>
                      <th width="120">Prix unitaire</th>
                      <th width="120">Total</th>
                      <th width="60">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="text"
                            name="description"
                            className={`form-control ${errors[`items.${index}.description`] ? "is-invalid" : ""}`}
                            value={item.description}
                            onChange={(e) => handleItemChange(index, e)}
                            placeholder="Description du service..."
                            disabled={actionLoading}
                          />
                          {errors[`items.${index}.description`] && (
                            <div className="invalid-feedback">
                              {errors[`items.${index}.description`]}
                            </div>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            name="quantity"
                            className={`form-control ${errors[`items.${index}.quantity`] ? "is-invalid" : ""}`}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, e)}
                            min="0"
                            step="1"
                            disabled={actionLoading}
                          />
                          {errors[`items.${index}.quantity`] && (
                            <div className="invalid-feedback">
                              {errors[`items.${index}.quantity`]}
                            </div>
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
                            <div className="invalid-feedback">
                              {errors[`items.${index}.unit_price`]}
                            </div>
                          )}
                        </td>
                        <td className="text-right">
                          {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)} €
                        </td>
                        <td className="text-center">
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removeItem(index)}
                              disabled={actionLoading}
                            >
                              <i className="fa fa-trash"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Totaux */}
              <div className="row">
                <div className="col-md-6 offset-md-6">
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td className="text-right"><strong>Sous-total:</strong></td>
                        <td className="text-right">{totals.subtotal} €</td>
                      </tr>
                      <tr>
                        <td className="text-right"><strong>TVA ({formData.tax_percent}%):</strong></td>
                        <td className="text-right">{totals.tax} €</td>
                      </tr>
                      <tr className="table-primary">
                        <td className="text-right"><strong>Total:</strong></td>
                        <td className="text-right"><strong>{totals.total} €</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card-footer">
            <div className="d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-secondary mr-2"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <i className="fa fa-spinner fa-spin"></i>
                    {invoice ? " Mise à jour..." : " Création..."}
                  </>
                ) : (
                  <>
                    <i className="fa fa-save"></i>
                    {invoice ? " Mettre à jour" : " Créer la facture"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;