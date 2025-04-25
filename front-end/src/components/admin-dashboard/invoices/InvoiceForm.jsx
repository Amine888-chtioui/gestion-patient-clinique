// src/components/admin-dashboard/invoices/InvoiceForm.jsx
import React, { useState, useEffect } from "react";

const InvoiceForm = ({
  invoice = null,
  patients = [],
  onSubmit,
  onCancel,
  actionLoading
}) => {
  const [formData, setFormData] = useState({
    patient_id: "",
    appointment_id: "",
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tax_percent: "20",
    notes: "",
    payment_method: "",
    payment_date: "",
    items: [
      { description: "", quantity: 1, unit_price: 0 }
    ]
  });
  
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Initialiser le formulaire avec les données de la facture si elle existe
  useEffect(() => {
    if (invoice) {
      const invoiceData = {
        patient_id: invoice.patient_id.toString(),
        appointment_id: invoice.appointment_id ? invoice.appointment_id.toString() : "",
        date: invoice.date,
        due_date: invoice.due_date,
        tax_percent: invoice.tax_percent.toString(),
        notes: invoice.notes || "",
        payment_method: invoice.payment_method || "",
        payment_date: invoice.payment_date || "",
        items: invoice.items && invoice.items.length > 0 
          ? invoice.items.map(item => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price
            }))
          : [{ description: "", quantity: 1, unit_price: 0 }]
      };
      
      setFormData(invoiceData);
      
      if (invoice.patient_id) {
        fetchPatientAppointments(invoice.patient_id);
      }
    }
  }, [invoice]);

  // Gérer le changement des champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Si le patient change, réinitialiser le rendez-vous et charger les rendez-vous du patient
    if (name === "patient_id" && value) {
      setFormData(prev => ({ ...prev, appointment_id: "" }));
      fetchPatientAppointments(value);
    }
  };

  // Gérer le changement des éléments de facture
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  // Ajouter un nouvel élément de facture
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unit_price: 0 }]
    }));
  };

  // Supprimer un élément de facture
  const removeItem = (index) => {
    if (formData.items.length === 1) {
      return; // Garder au moins un élément
    }
    
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  // Calculer le total d'un élément
  const calculateItemTotal = (quantity, unitPrice) => {
    return quantity * unitPrice;
  };

  // Calculer le sous-total de la facture
  const calculateSubtotal = () => {
    return formData.items.reduce((total, item) => {
      return total + calculateItemTotal(item.quantity, item.unit_price);
    }, 0);
  };

  // Calculer la TVA
  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * (parseFloat(formData.tax_percent) / 100);
  };

  // Calculer le total de la facture
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    return subtotal + tax;
  };

  // Formater un montant en devise
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Récupérer les rendez-vous d'un patient
  const fetchPatientAppointments = async (patientId) => {
    try {
      setLoadingAppointments(true);
      // Ici, vous devriez appeler votre API pour récupérer les rendez-vous du patient
      // Pour cet exemple, nous utilisons des données fictives
      // const response = await axios.get(`/api/admin/patients/${patientId}/appointments`);
      // setAppointments(response.data.appointments);
      
      // Données fictives pour l'exemple
      setTimeout(() => {
        const mockAppointments = [
          { id: 1, date: '2023-05-01', time: '09:00', status: 'confirmé' },
          { id: 2, date: '2023-05-15', time: '14:30', status: 'confirmé' },
          { id: 3, date: '2023-05-30', time: '11:00', status: 'confirmé' }
        ];
        setAppointments(mockAppointments);
        setLoadingAppointments(false);
      }, 500);
      
    } catch (err) {
      console.error("Erreur lors de la récupération des rendez-vous:", err);
      setAppointments([]);
      setLoadingAppointments(false);
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation des éléments de facture
    const validItems = formData.items.filter(item => 
      item.description.trim() !== "" && 
      item.quantity > 0 && 
      item.unit_price > 0
    );
    
    if (validItems.length === 0) {
      alert("Veuillez ajouter au moins un élément valide à la facture.");
      return;
    }
    
    const dataToSubmit = {
      ...formData,
      items: validItems,
      // Convertir les valeurs de chaîne en nombre
      tax_percent: parseFloat(formData.tax_percent),
      patient_id: parseInt(formData.patient_id),
      appointment_id: formData.appointment_id ? parseInt(formData.appointment_id) : null
    };
    
    onSubmit(dataToSubmit);
  };

  return (
    <div className="invoice-form-container">
      <div className="form-header">
        <h2>{invoice ? "Modifier la facture" : "Créer une nouvelle facture"}</h2>
        <button 
          className="btn-secondary"
          onClick={onCancel}
          disabled={actionLoading}
        >
          <i className="fas fa-times"></i> Annuler
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-section">
            <h3>Informations générales</h3>
            
            <div className="form-group">
              <label htmlFor="patient_id">Patient *</label>
              <select
                id="patient_id"
                name="patient_id"
                className="form-control"
                value={formData.patient_id}
                onChange={handleChange}
                required
                disabled={actionLoading || (invoice && invoice.status === 'paid')}
              >
                <option value="">Sélectionner un patient</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} ({patient.email})
                  </option>
                ))}
              </select>
            </div>

            {formData.patient_id && (
              <div className="form-group">
                <label htmlFor="appointment_id">Rendez-vous associé</label>
                <select
                  id="appointment_id"
                  name="appointment_id"
                  className="form-control"
                  value={formData.appointment_id}
                  onChange={handleChange}
                  disabled={actionLoading || loadingAppointments || (invoice && invoice.status === 'paid')}
                >
                  <option value="">Aucun rendez-vous</option>
                  {loadingAppointments ? (
                    <option value="" disabled>Chargement des rendez-vous...</option>
                  ) : (
                    appointments.map(appointment => (
                      <option key={appointment.id} value={appointment.id}>
                        {new Date(appointment.date).toLocaleDateString()} à {appointment.time}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Date de facture *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  className="form-control"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  disabled={actionLoading || (invoice && invoice.status === 'paid')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="due_date">Date d'échéance *</label>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  className="form-control"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                  disabled={actionLoading || (invoice && invoice.status === 'paid')}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tax_percent">TVA (%) *</label>
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
                required
                disabled={actionLoading || (invoice && invoice.status === 'paid')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                className="form-control"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                disabled={actionLoading || (invoice && invoice.status === 'paid')}
              ></textarea>
            </div>

            {/* Champs de paiement (visibles uniquement pour les nouvelles factures) */}
            {!invoice && (
              <div className="payment-section">
                <h4>Informations de paiement (optionnel)</h4>
                <p className="form-help">Remplissez ces champs uniquement si la facture est déjà payée.</p>
                
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
                    <option value="">Non payée</option>
                    <option value="cash">Espèces</option>
                    <option value="card">Carte bancaire</option>
                    <option value="transfer">Virement bancaire</option>
                    <option value="check">Chèque</option>
                    <option value="insurance">Assurance</option>
                  </select>
                </div>

                {formData.payment_method && (
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
                )}
              </div>
            )}
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>Éléments de la facture</h3>
              <button
                type="button"
                className="btn-outline"
                onClick={addItem}
                disabled={actionLoading || (invoice && invoice.status === 'paid')}
              >
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
                      disabled={actionLoading || formData.items.length <= 1 || (invoice && invoice.status === 'paid')}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                  <div className="form-row">
                    <div className="form-group item-description">
                      <label htmlFor={`item-description-${index}`}>Description *</label>
                      <input
                        type="text"
                        id={`item-description-${index}`}
                        className="form-control"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        required
                        disabled={actionLoading || (invoice && invoice.status === 'paid')}
                      />
                    </div>
                    <div className="form-group item-quantity">
                      <label htmlFor={`item-quantity-${index}`}>Quantité *</label>
                      <input
                        type="number"
                        id={`item-quantity-${index}`}
                        className="form-control"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value))}
                        min="1"
                        required
                        disabled={actionLoading || (invoice && invoice.status === 'paid')}
                      />
                    </div>
                    <div className="form-group item-price">
                      <label htmlFor={`item-unit-price-${index}`}>Prix unitaire *</label>
                      <input
                        type="number"
                        id={`item-unit-price-${index}`}
                        className="form-control"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, "unit_price", parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        required
                        disabled={actionLoading || (invoice && invoice.status === 'paid')}
                      />
                    </div>
                    <div className="form-group item-total">
                      <label>Total</label>
                      <div className="calculated-value">
                        {formatCurrency(calculateItemTotal(item.quantity, item.unit_price))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="invoice-totals">
              <div className="total-row">
                <span>Sous-total:</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="total-row">
                <span>TVA ({formData.tax_percent}%):</span>
                <span>{formatCurrency(calculateTax())}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={actionLoading || (invoice && invoice.status === 'paid')}
          >
            {actionLoading ? (
              <><i className="fas fa-spinner fa-spin"></i> Traitement en cours...</>
            ) : (
              <><i className="fas fa-save"></i> {invoice ? "Mettre à jour" : "Créer la facture"}</>
            )}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={actionLoading}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;