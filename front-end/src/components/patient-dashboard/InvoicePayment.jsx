// src/components/patient-dashboard/InvoicePayment.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../axios";

const InvoicePayment = () => {
  const [invoice, setInvoice] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();
  
  // Fetch invoice details and available payment methods
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch both invoice and payment methods in parallel
        const [invoiceResponse, methodsResponse] = await Promise.all([
          axios.get(`/api/patient/invoices/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }),
          axios.get("/api/patient/payment-methods", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          })
        ]);
        
        setInvoice(invoiceResponse.data.invoice);
        setPaymentMethods(methodsResponse.data.payment_methods || []);
        
        // Auto-select first payment method if available
        if (methodsResponse.data.payment_methods?.length > 0) {
          setSelectedMethod(methodsResponse.data.payment_methods[0].id);
        }
      } catch (err) {
        console.error("Error loading payment data:", err);
        setError("Unable to load payment information. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Initialize payment process
  const handleInitiatePayment = async (e) => {
    e.preventDefault();
    
    if (!selectedMethod) {
      setError("Please select a payment method");
      return;
    }
    
    setProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.post(`/api/patient/invoices/${id}/payment/initialize`, 
        { payment_method_id: selectedMethod },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      
      setSuccess("Processing payment...");
      
      // In a real implementation, you would redirect to a payment gateway
      // For demo purposes, we'll simulate a successful payment after a short delay
      setTimeout(() => {
        processPayment(response.data.payment_session);
      }, 2000);
      
    } catch (err) {
      console.error("Error initializing payment:", err);
      setError(err.response?.data?.message || "Unable to initialize payment. Please try again later.");
      setProcessing(false);
    }
  };
  
  // Complete the payment process
  const processPayment = async (paymentSession) => {
    try {
      await axios.post('/api/patient/payments/process', 
        {
          invoice_id: id,
          payment_method_id: selectedMethod,
          payment_session_id: paymentSession.id
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      
      setSuccess("Payment successful! You will be redirected to your invoice details.");
      
      // Redirect to invoice details after successful payment
      setTimeout(() => {
        navigate(`/patient-invoices/${id}`);
      }, 2000);
      
    } catch (err) {
      console.error("Error processing payment:", err);
      setError(err.response?.data?.message || "Payment failed. Please try again later.");
      setProcessing(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading payment information...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="error-container">
        <i className="fas fa-exclamation-circle"></i>
        <h3>Invoice not found</h3>
        <p>The invoice you're trying to pay does not exist or has been deleted.</p>
        <button className="btn-primary" onClick={() => navigate("/patient-invoices")}>
          Return to invoices
        </button>
      </div>
    );
  }

  // If the invoice is already paid
  if (invoice.status === 'paid') {
    return (
      <div className="success-container">
        <i className="fas fa-check-circle"></i>
        <h3>Invoice already paid</h3>
        <p>This invoice has already been paid on {new Date(invoice.payment_date).toLocaleDateString()}.</p>
        <button className="btn-primary" onClick={() => navigate(`/patient-invoices/${id}`)}>
          View invoice details
        </button>
      </div>
    );
  }

  return (
    <div className="payment-interface-container">
      <div className="payment-header">
        <button className="btn-secondary" onClick={() => navigate(`/patient-invoices/${id}`)}>
          <i className="fas fa-arrow-left"></i> Back to invoice
        </button>
        <h1>Payment for invoice #{invoice.number}</h1>
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i> {success}
        </div>
      )}

      <div className="payment-content">
        <div className="invoice-summary-card">
          <h3>Invoice summary</h3>
          <div className="summary-details">
            <div className="summary-row">
              <div className="summary-label">Invoice number:</div>
              <div className="summary-value">{invoice.number}</div>
            </div>
            <div className="summary-row">
              <div className="summary-label">Date:</div>
              <div className="summary-value">{new Date(invoice.date).toLocaleDateString()}</div>
            </div>
            <div className="summary-row">
              <div className="summary-label">Due date:</div>
              <div className="summary-value">{new Date(invoice.due_date).toLocaleDateString()}</div>
            </div>
            <div className="summary-row">
              <div className="summary-label">Subtotal:</div>
              <div className="summary-value">{formatCurrency(invoice.amount)}</div>
            </div>
            <div className="summary-row">
              <div className="summary-label">VAT ({invoice.tax_percent}%):</div>
              <div className="summary-value">{formatCurrency(invoice.tax_amount)}</div>
            </div>
            <div className="summary-row total">
              <div className="summary-label">Total amount to pay:</div>
              <div className="summary-value">{formatCurrency(invoice.total_amount)}</div>
            </div>
          </div>
        </div>

        <div className="payment-methods-card">
          <h3>Choose your payment method</h3>

          {paymentMethods.length === 0 ? (
            <div className="empty-payment-methods">
              <i className="fas fa-exclamation-triangle"></i>
              <p>No payment methods are currently available. Please contact the administration.</p>
            </div>
          ) : (
            <form onSubmit={handleInitiatePayment}>
              <div className="payment-methods-list">
                {paymentMethods.map(method => (
                  <div className="payment-method-option" key={method.id}>
                    <label>
                      <input
                        type="radio"
                        name="payment_method"
                        value={method.id}
                        checked={selectedMethod === method.id}
                        onChange={() => setSelectedMethod(method.id)}
                        disabled={processing}
                      />
                      <div className="payment-method-details">
                        <div className="payment-method-name">{method.name}</div>
                        {method.description && (
                          <div className="payment-method-description">{method.description}</div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="payment-actions">
                <button 
                  type="submit" 
                  className="btn-primary btn-lg" 
                  disabled={processing || !selectedMethod}
                >
                  {processing ? (
                    <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                  ) : (
                    <><i className="fas fa-credit-card"></i> Pay now {formatCurrency(invoice.total_amount)}</>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => navigate(`/patient-invoices/${id}`)}
                  disabled={processing}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="payment-info-section">
        <div className="info-header">
          <i className="fas fa-shield-alt"></i>
          <h3>Secure payment</h3>
        </div>
        <p>
          All our transactions are secured with SSL encryption. Your payment information is never stored on our servers.
        </p>
      </div>
    </div>
  );
};

export default InvoicePayment;