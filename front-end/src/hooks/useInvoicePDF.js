// src/hooks/useInvoicePDF.js
import { useState } from 'react';
import axios from '../axios';
import { generateInvoicePDF } from '../utils/invoicePdfGenerator';

export const useInvoicePDF = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Configuration par défaut de la clinique
  const defaultClinicInfo = {
    name: "Clinique Médicale Excellence",
    address: "123 Avenue de la Santé",
    city: "75001 Paris, France",
    phone: "01 23 45 67 89",
    email: "contact@clinique-excellence.fr"
  };

  // Fonction pour afficher un message de succès
  const showSuccessMessage = (message = "PDF téléchargé avec succès !") => {
    // Vérifier si un message existe déjà
    const existingMessage = document.querySelector('.pdf-success-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const successDiv = document.createElement('div');
    successDiv.className = 'pdf-success-message';
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      animation: slideInRight 0.3s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    successDiv.innerHTML = `
      <i class="fas fa-check-circle"></i>
      ${message}
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (successDiv && successDiv.parentNode) {
        successDiv.remove();
      }
    }, 3000);
  };

  // Fonction pour afficher un message d'erreur
  const showErrorMessage = (message = "Erreur lors de la génération du PDF") => {
    const existingMessage = document.querySelector('.pdf-error-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'pdf-error-message';
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #dc3545;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      animation: slideInRight 0.3s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    errorDiv.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      ${message}
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv && errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 4000);
  };

  // Générer PDF à partir d'un objet facture complet
  const generatePDFFromInvoice = async (invoice, clinicInfo = null) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      console.log(`🔄 Génération du PDF pour la facture ${invoice.number}...`);
      
      // Utiliser les infos de clinique fournies ou les valeurs par défaut
      const clinic = clinicInfo || defaultClinicInfo;
      
      // Générer le PDF
      generateInvoicePDF(invoice, clinic);
      
      console.log("✅ PDF généré avec succès");
      showSuccessMessage();
      
      return true;
      
    } catch (err) {
      console.error("❌ Erreur lors de la génération du PDF:", err);
      const errorMessage = err.message || "Erreur lors de la génération du PDF";
      setError(errorMessage);
      showErrorMessage(errorMessage);
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  // Générer PDF en récupérant d'abord les détails de la facture
  const generatePDFFromId = async (invoiceId, clinicInfo = null) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      console.log(`🔄 Récupération des détails de la facture ${invoiceId}...`);
      
      // Récupérer les détails complets de la facture
      const response = await axios.get(`/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      const invoiceData = response.data.data;
      console.log("📄 Données de la facture récupérées");
      
      // Générer le PDF
      return await generatePDFFromInvoice(invoiceData, clinicInfo);
      
    } catch (err) {
      console.error("❌ Erreur lors de la récupération de la facture:", err);
      let errorMessage = "Erreur lors de la récupération de la facture";
      
      if (err.response?.status === 404) {
        errorMessage = "Facture non trouvée";
      } else if (err.response?.status === 403) {
        errorMessage = "Accès non autorisé à cette facture";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      showErrorMessage(errorMessage);
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  // Générer des PDFs en lot (pour plusieurs factures)
  const generateBatchPDFs = async (invoiceIds, clinicInfo = null) => {
    const results = [];
    let successCount = 0;
    
    for (const id of invoiceIds) {
      const result = await generatePDFFromId(id, clinicInfo);
      results.push({ id, success: result });
      if (result) successCount++;
      
      // Délai entre chaque génération pour éviter de surcharger le serveur
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Message de résumé
    if (successCount === invoiceIds.length) {
      showSuccessMessage(`${successCount} PDF${successCount > 1 ? 's' : ''} téléchargé${successCount > 1 ? 's' : ''} avec succès !`);
    } else if (successCount > 0) {
      showSuccessMessage(`${successCount}/${invoiceIds.length} PDF${successCount > 1 ? 's' : ''} téléchargé${successCount > 1 ? 's' : ''}`);
    } else {
      showErrorMessage("Aucun PDF n'a pu être généré");
    }
    
    return results;
  };

  // Fonction utilitaire pour vérifier si jsPDF est disponible
  const checkPDFSupport = () => {
    try {
      require('jspdf');
      return true;
    } catch (err) {
      console.error("jsPDF n'est pas disponible:", err);
      showErrorMessage("La génération PDF n'est pas disponible. Veuillez contacter l'administrateur.");
      return false;
    }
  };

  return {
    // État
    isGenerating,
    error,
    
    // Fonctions principales
    generatePDFFromInvoice,
    generatePDFFromId,
    generateBatchPDFs,
    
    // Fonctions utilitaires
    checkPDFSupport,
    showSuccessMessage,
    showErrorMessage,
    
    // Configuration
    defaultClinicInfo
  };
};

export default useInvoicePDF;