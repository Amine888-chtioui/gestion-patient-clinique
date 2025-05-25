// src/utils/invoicePdfGenerator.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateInvoicePDF = (invoice, clinicInfo = null) => {
  // Créer une nouvelle instance PDF
  const doc = new jsPDF();
  
  // Configuration des couleurs
  const primaryColor = [106, 27, 154]; // Purple
  const secondaryColor = [128, 128, 128]; // Gray
  const textColor = [0, 0, 0]; // Black
  
  // Configuration de la police
  doc.setFont('helvetica');
  
  // === EN-TÊTE DE LA FACTURE ===
  // Logo et nom de la clinique (côté gauche)
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.text(clinicInfo?.name || 'Clinique Médicale', 20, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(...secondaryColor);
  doc.text(clinicInfo?.address || '123 Rue de la Santé', 20, 32);
  doc.text(clinicInfo?.city || '12345 Ville, Pays', 20, 37);
  doc.text(`Tél: ${clinicInfo?.phone || '01 23 45 67 89'}`, 20, 42);
  doc.text(`Email: ${clinicInfo?.email || 'contact@clinique.com'}`, 20, 47);
  
  // Titre FACTURE (côté droit)
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.text('FACTURE', 150, 25);
  
  // Numéro de facture et dates (côté droit)
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.text(`Numéro: ${invoice.number || 'N/A'}`, 150, 35);
  doc.text(`Date d'émission: ${formatDate(invoice.date)}`, 150, 42);
  doc.text(`Date d'échéance: ${formatDate(invoice.due_date)}`, 150, 49);
  
  // === LIGNE DE SÉPARATION ===
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, 55, 190, 55);
  
  // === INFORMATIONS CLIENT ===
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('FACTURÉ À:', 20, 70);
  
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  const patientName = invoice.patient?.name || invoice.patient_name || 'N/A';
  const patientEmail = invoice.patient?.email || 'Email non disponible';
  const patientPhone = invoice.patient?.phone || '';
  const patientAddress = invoice.patient?.address || 'Adresse non disponible';
  
  doc.text(patientName, 20, 80);
  doc.text(patientEmail, 20, 87);
  if (patientPhone) {
    doc.text(`Tél: ${patientPhone}`, 20, 94);
  }
  doc.text(patientAddress, 20, patientPhone ? 101 : 94);
  
  // === STATUT DE LA FACTURE ===
  const statusY = 70;
  const statusText = getStatusText(invoice.status);
  const statusColor = getStatusColor(invoice.status);
  
  doc.setFontSize(12);
  doc.setTextColor(...statusColor);
  doc.text(`STATUT: ${statusText}`, 150, statusY);
  
  // Si payée, afficher les informations de paiement
  if (invoice.status === 'paid' && invoice.payment_date) {
    doc.setFontSize(10);
    doc.setTextColor(...secondaryColor);
    doc.text(`Payée le: ${formatDate(invoice.payment_date)}`, 150, statusY + 10);
    if (invoice.payment_method) {
      doc.text(`Méthode: ${getPaymentMethodText(invoice.payment_method)}`, 150, statusY + 17);
    }
  }
  
  // === TABLEAU DES ARTICLES ===
  const tableStartY = 120;
  
  // Préparer les données du tableau
  const tableData = [];
  
  if (invoice.items && invoice.items.length > 0) {
    invoice.items.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const total = quantity * unitPrice;
      
      tableData.push([
        item.description || 'Description non disponible',
        quantity.toString(),
        formatCurrency(unitPrice),
        formatCurrency(total)
      ]);
    });
  } else {
    // Si pas d'items détaillés, créer une ligne générique
    tableData.push([
      'Consultation médicale',
      '1',
      formatCurrency(invoice.subtotal_amount || invoice.total_amount || 0),
      formatCurrency(invoice.subtotal_amount || invoice.total_amount || 0)
    ]);
  }
  
  // Créer le tableau avec jsPDF-AutoTable
  doc.autoTable({
    head: [['Description', 'Quantité', 'Prix unitaire', 'Total']],
    body: tableData,
    startY: tableStartY,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor
    },
    columnStyles: {
      0: { cellWidth: 80 }, // Description
      1: { cellWidth: 25, halign: 'center' }, // Quantité
      2: { cellWidth: 35, halign: 'right' }, // Prix unitaire
      3: { cellWidth: 35, halign: 'right' } // Total
    },
    margin: { left: 20, right: 20 }
  });
  
  // === CALCULS TOTAUX ===
  const finalY = doc.lastAutoTable.finalY + 10;
  const rightX = 155;
  
  // Calculer les totaux
  const subtotal = parseFloat(invoice.subtotal_amount) || parseFloat(invoice.amount) || 0;
  const taxRate = parseFloat(invoice.tax_percent) || 20;
  const taxAmount = parseFloat(invoice.tax_amount) || (subtotal * taxRate / 100);
  const total = parseFloat(invoice.total_amount) || (subtotal + taxAmount);
  
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  
  // Sous-total
  doc.text('Sous-total:', rightX, finalY);
  doc.text(formatCurrency(subtotal), rightX + 25, finalY);
  
  // TVA
  doc.text(`TVA (${taxRate}%):`, rightX, finalY + 7);
  doc.text(formatCurrency(taxAmount), rightX + 25, finalY + 7);
  
  // Ligne de séparation
  doc.setDrawColor(...secondaryColor);
  doc.setLineWidth(0.3);
  doc.line(rightX, finalY + 12, rightX + 35, finalY + 12);
  
  // Total
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('TOTAL:', rightX, finalY + 20);
  doc.text(formatCurrency(total), rightX + 25, finalY + 20);
  
  // === NOTES ===
  if (invoice.notes) {
    const notesY = finalY + 35;
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text('NOTES:', 20, notesY);
    
    doc.setTextColor(...textColor);
    const splitNotes = doc.splitTextToSize(invoice.notes, 170);
    doc.text(splitNotes, 20, notesY + 7);
  }
  
  // === PIED DE PAGE ===
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 30;
  
  doc.setFontSize(8);
  doc.setTextColor(...secondaryColor);
  doc.text('Merci pour votre confiance !', 20, footerY);
  doc.text(`Facture générée le ${formatDate(new Date().toISOString())}`, 20, footerY + 5);
  
  // === TÉLÉCHARGEMENT ===
  const fileName = `Facture_${invoice.number || 'sans_numero'}_${patientName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

// === FONCTIONS UTILITAIRES ===

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount || 0);
};

const getStatusText = (status) => {
  const statusMap = {
    'paid': 'PAYÉE',
    'unpaid': 'NON PAYÉE',
    'pending': 'EN ATTENTE',
    'overdue': 'EN RETARD',
    'cancelled': 'ANNULÉE',
    'draft': 'BROUILLON',
    'sent': 'ENVOYÉE'
  };
  return statusMap[status] || status?.toUpperCase() || 'INCONNU';
};

const getStatusColor = (status) => {
  const colorMap = {
    'paid': [40, 167, 69], // Vert
    'unpaid': [220, 53, 69], // Rouge
    'pending': [255, 193, 7], // Jaune
    'overdue': [220, 53, 69], // Rouge
    'cancelled': [108, 117, 125], // Gris
    'draft': [108, 117, 125], // Gris
    'sent': [23, 162, 184] // Bleu
  };
  return colorMap[status] || [0, 0, 0]; // Noir par défaut
};

const getPaymentMethodText = (method) => {
  const methodMap = {
    'cash': 'Espèces',
    'card': 'Carte bancaire',
    'transfer': 'Virement',
    'check': 'Chèque',
    'insurance': 'Assurance'
  };
  return methodMap[method] || method;
};

export default generateInvoicePDF;