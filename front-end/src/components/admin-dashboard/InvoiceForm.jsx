// src/components/admin-dashboard/invoice/InvoiceForm.jsx
import React, { useState, useEffect } from "react";

const InvoiceForm = ({
  invoice = null,
  patients = [],
  doctors = [],
  services = [],
  onSubmit,
  onCancel,
  actionLoading
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Si aucun service n'est fourni, utiliser ces services par défaut
  const defaultServices = services.length > 0 ? services : [
    { id: 1, name: "Consultation standard", price: 50 },
    { id: 2, name: "Consultation spécialiste", price: 70 },
    { id: 3, name: "Examen médical", price: 120 },
    { id: 4, name: "Intervention chirurgicale mineure", price: 250 },
    { id: 5, name: "Radiographie", price: 85 },
    { id: 6, name: "Analyse de sang", price: 45 },
  ];
  
  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    date: today,
    due_date: calculateDueDate(today, 30), // Échéance par défaut : 30 jours
    invoice_number: generateInvoiceNumber(),
    status: "draft",
    payment_method: "card",
    items: [{ service_id: "", description: "", quantity: 1, unit_price: 0, discount: 0 }],
    notes: "",
    terms: "Paiement attendu dans les 30 jours suivant la date de facturation. Des frais de retard peuvent s'appliquer pour tout paiement reçu après la date d'échéance."
  });
  
  // Initialiser le formulaire avec les données d'une facture existante
  useEffect(() => {
    if (invoice) {
      setFormData({
        patient_id: invoice.patient_id || "",
        doctor_id: invoice.doctor_id || "",
        date: invoice.date || today,
        due_date: invoice.due_date || calculateDueDate(today, 30),
        invoice_number: invoice.invoice_number || generateInvoiceNumber(),
        status: invoice.status || "draft",
        payment_method: invoice.payment_method || "card",
        items: invoice.items && invoice.items.length > 0 
          ? invoice.items 
          : [{ service_id: "", description: "", quantity: 1, unit_price: 0, discount: 0 }],
        notes: invoice.notes || "",
        terms: invoice.terms || "Paiement attendu dans les 30 jours suivant la date de facturation. Des frais de retard peuvent s'appliquer pour tout paiement reçu après la date d'échéance."
      });
    }
  }, [invoice]);
  
  // Gérer les changements dans le formulaire principal
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Recalculer la date d'échéance si la date de facturation change
    if (name === 'date') {
      setFormData({
        ...formData,
        date: value,
        due_date: calculateDueDate(value, 30)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Gérer les changements dans les éléments de facturation
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    
    if (field === 'service_id') {
      // Si un service est sélectionné, mettre à jour la description et le prix
      const selectedService = defaultServices.find(s => s.id.toString() === value);
      if (selectedService) {
        updatedItems[index] = {
          ...updatedItems[index],
          service_id: value,
          description: selectedService.name,
          unit_price: selectedService.price
        };
      } else {
        updatedItems[index] = {
          ...updatedItems[index],
          service_id: value
        };
      }
    } else {
      // Pour les autres champs
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: field === 'quantity' || field === 'unit_price' || field === 'discount' 
          ? parseFloat(value) || 0 
          : value
      };
    }
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };
  
  // Ajouter un nouvel élément à la facture
  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { service_id: "", description: "", quantity: 1, unit_price: 0, discount: 0 }
      ]
    });
  };
  
  // Supprimer un élément de la facture
  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = [...formData.items];
      updatedItems.splice(index, 1);
      
      setFormData({
        ...formData,
        items: updatedItems
      });
    }
  };
  
  // Calculer le montant d'un élément
  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.unit_price;
    const discount = subtotal * (item.discount / 100);
    return subtotal - discount;
  };
  
  // Calculer le sous-total de la facture
  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };
  
  // Calculer la TVA
  const calculateTax = () => {
    return calculateSubtotal() * 0.20; // TVA à 20%
  };
  
  // Calculer le total de la facture
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };
  
  // Soumettre le formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Préparer les données pour l'envoi
    const invoiceData = {
      ...formData,
      sub_total: calculateSubtotal(),
      tax_amount: calculateTax(),
      total_amount: calculateTotal()
    };
    
    onSubmit(invoiceData);
  };

  return (
    <form onSubmit={handleSubmit} className="invoice-form">
      <div className="form-header">
        <h3>{invoice ? "Modifier la facture" : "Créer une nouvelle facture"}</h3>
      </div>
      
      <div className="form-sections">
        <div className="form-section">
          <h4>Informations générales</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="invoice_number">Numéro de facture*</label>
              <input
                type="text"
                id="invoice_number"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                required
                disabled={actionLoading || (invoice && invoice.status !== "draft")}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Statut</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={actionLoading || (invoice && invoice.status === "paid")}
              >
                <option value="draft">Brouillon</option>
                <option value="pending">En attente</option>
                <option value="paid">Payée</option>
                <option value="overdue">En retard</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date de facturation*</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                disabled={actionLoading || (invoice && invoice.status !== "draft")}
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
                disabled={actionLoading || (invoice && invoice.status !== "draft")}
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h4>Client et prestataire</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="patient_id">Patient*</label>
              <select
                id="patient_id"
                name="patient_id"
                value={formData.patient_id}
                onChange={handleChange}
                required
                disabled={actionLoading || (invoice && invoice.status !== "draft")}
              >
                <option value="">Sélectionner un patient</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="doctor_id">Médecin</label>
              <select
                id="doctor_id"
                name="doctor_id"
                value={formData.doctor_id}
                onChange={handleChange}
                disabled={actionLoading || (invoice && invoice.status !== "draft")}
              >
                <option value="">Sélectionner un médecin</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <div className="section-header">
            <h4>Détails de facturation</h4>
            <button 
              type="button" 
              className="btn-outline"
              onClick={addItem}
              disabled={actionLoading || (invoice && invoice.status !== "draft")}
            >
              <i className="fas fa-plus"></i> Ajouter un élément
            </button>
          </div>
          
          <div className="invoice-items">
            <div className="invoice-items-header">
              <div className="item-service">Service</div>
              <div className="item-description">Description</div>
              <div className="item-quantity">Quantité</div>
              <div className="item-price">Prix unitaire (€)</div>
              <div className="item-discount">Remise (%)</div>
              <div className="item-total">Total (€)</div>
              <div className="item-actions">Actions</div>
            </div>
            
            {formData.items.map((item, index) => (
              <div key={index} className="invoice-item">
                <div className="item-service">
                  <select
                    value={item.service_id}
                    onChange={(e) => handleItemChange(index, 'service_id', e.target.value)}
                    disabled={actionLoading || (invoice && invoice.status !== "draft")}
                  >
                    <option value="">Sélectionner un service</option>
                    {defaultServices.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="item-description">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Description"
                    disabled={actionLoading || (invoice && invoice.status !== "draft")}
                  />
                </div>
                
                <div className="item-quantity">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    min="1"
                    step="1"
                    disabled={actionLoading || (invoice && invoice.status !== "draft")}
                  />
                </div>
                
                <div className="item-price">
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                    min="0"
                    step="0.01"
                    disabled={actionLoading || (invoice && invoice.status !== "draft")}
                  />
                </div>
                
                <div className="item-discount">
                  <input
                    type="number"
                    value={item.discount}
                    onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                    min="0"
                    max="100"
                    step="1"
                    disabled={actionLoading || (invoice && invoice.status !== "draft")}
                  />
                </div>
                
                <div className="item-total">
                  {calculateItemTotal(item).toFixed(2)}
                </div>
                
                <div className="item-actions">
                  <button
                    type="button"
                    className="btn-icon danger"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length <= 1 || actionLoading || (invoice && invoice.status !== "draft")}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="invoice-summary">
            <div className="summary-row">
              <div className="summary-label">Sous-total</div>
              <div className="summary-value">{calculateSubtotal().toFixed(2)} €</div>
            </div>
            <div className="summary-row">
              <div className="summary-label">TVA (20%)</div>
              <div className="summary-value">{calculateTax().toFixed(2)} €</div>
            </div>
            <div className="summary-row total">
              <div className="summary-label">Total</div>
              <div className="summary-value">{calculateTotal().toFixed(2)} €</div>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h4>Paiement et notes</h4>
          
          <div className="form-group">
            <label htmlFor="payment_method">Méthode de paiement</label>
            <select
              id="payment_method"
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              disabled={actionLoading || (invoice && invoice.status !== "draft")}
            >
              <option value="card">Carte bancaire</option>
              <option value="transfer">Virement bancaire</option>
              <option value="check">Chèque</option>
              <option value="cash">Espèces</option>
              <option value="insurance">Assurance</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Notes additionnelles pour cette facture"
              disabled={actionLoading}
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="terms">Conditions de paiement</label>
            <textarea
              id="terms"
              name="terms"
              value={formData.terms}
              onChange={handleChange}
              rows="3"
              disabled={actionLoading || (invoice && invoice.status !== "draft")}
            ></textarea>
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <button 
          type="submit" 
          className="btn-primary"
          disabled={actionLoading}
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
          <i className="fas fa-times"></i> Annuler
        </button>
      </div>
    </form>
  );
};

// Générer un numéro de facture
function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `INV-${year}${month}-${random}`;
}

// Calculer la date d'échéance
function calculateDueDate(dateString, daysToAdd) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
}

export default InvoiceForm;