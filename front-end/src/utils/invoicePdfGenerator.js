// src/utils/invoicePdfGenerator.js - Version CORRIGÉE
import jsPDF from 'jspdf';

// Import correct pour autoTable
import autoTable from 'jspdf-autotable';

/**
 * Génère et télécharge un PDF pour une facture
 * @param {Object} invoice - Données de la facture
 * @param {Object} clinicInfo - Informations de la clinique
 */
export const generateInvoicePDF = (invoice, clinicInfo) => {
  try {
    console.log('🔄 Début de la génération PDF...');
    console.log('📄 Données facture:', invoice);
    
    // Créer un nouveau document PDF
    const doc = new jsPDF();
    
    // Configuration des couleurs
    const primaryColor = [106, 27, 154]; // Violet admin
    const secondaryColor = [108, 117, 125]; // Gris
    const successColor = [40, 167, 69]; // Vert
    const dangerColor = [220, 53, 69]; // Rouge
    
    // Configuration des polices
    doc.setFont('helvetica');
    
    // Marges et dimensions
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = pageWidth - (margin * 2);
    
    let currentY = margin;
    
    // === EN-TÊTE DE LA CLINIQUE ===
    doc.setFontSize(20);
    doc.setTextColor(...primaryColor);
    doc.text(clinicInfo.name || 'Clinique Médicale', margin, currentY);
    currentY += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(...secondaryColor);
    doc.text(clinicInfo.address || '123 Avenue de la Santé', margin, currentY);
    currentY += 5;
    doc.text(clinicInfo.city || '75001 Paris, France', margin, currentY);
    currentY += 5;
    doc.text(`Tél: ${clinicInfo.phone || '01 23 45 67 89'}`, margin, currentY);
    currentY += 5;
    doc.text(`Email: ${clinicInfo.email || 'contact@clinique.fr'}`, margin, currentY);
    currentY += 20;
    
    // === TITRE FACTURE ===
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text('FACTURE', pageWidth - margin - 50, margin + 5);
    
    doc.setFontSize(12);
    doc.setTextColor(...secondaryColor);
    doc.text(`N° ${invoice.number}`, pageWidth - margin - 50, margin + 15);
    
    // === INFORMATIONS PATIENT ===
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Facturé à:', pageWidth - margin - 80, currentY);
    currentY += 8;
    
    doc.setFontSize(11);
    const patientName = invoice.patient?.name || 'Patient non spécifié';
    doc.text(patientName, pageWidth - margin - 80, currentY);
    currentY += 6;
    
    if (invoice.patient?.email) {
      doc.text(invoice.patient.email, pageWidth - margin - 80, currentY);
      currentY += 6;
    }
    
    if (invoice.patient?.phone) {
      doc.text(`Tél: ${invoice.patient.phone}`, pageWidth - margin - 80, currentY);
      currentY += 6;
    }
    
    if (invoice.patient?.address) {
      doc.text(invoice.patient.address, pageWidth - margin - 80, currentY);
    }
    
    currentY += 15;
    
    // === INFORMATIONS FACTURE ===
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
    
    // Dates et informations
    const infoData = [
      ['Date de facturation:', formatDate(invoice.date || invoice.issue_date)],
      ['Date d\'échéance:', formatDate(invoice.due_date)],
      ['Statut:', getStatusText(invoice.status)]
    ];
    
    if (invoice.payment_date) {
      infoData.push(['Date de paiement:', formatDate(invoice.payment_date)]);
    }
    
    if (invoice.payment_method) {
      infoData.push(['Méthode de paiement:', getPaymentMethodText(invoice.payment_method)]);
    }
    
    // Afficher les informations en deux colonnes
    doc.setFontSize(10);
    infoData.forEach((info, index) => {
      const yPos = currentY + (index * 6);
      doc.setTextColor(...secondaryColor);
      doc.text(info[0], margin, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(info[1], margin + 50, yPos);
    });
    
    currentY += (infoData.length * 6) + 15;
    
    // === TABLEAU DES PRESTATIONS ===
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('Détail des prestations', margin, currentY);
    currentY += 10;
    
    // Préparer les données du tableau
    const tableData = [];
    let subtotal = 0;
    
    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach(item => {
        const quantity = parseFloat(item.quantity) || 1;
        const unitPrice = parseFloat(item.unit_price) || 0;
        const total = quantity * unitPrice;
        subtotal += total;
        
        tableData.push([
          item.description || 'Service',
          quantity.toString(),
          formatCurrency(unitPrice),
          formatCurrency(total)
        ]);
      });
    } else {
      // Fallback si pas d'items détaillés
      subtotal = parseFloat(invoice.amount) || parseFloat(invoice.total_amount) || parseFloat(invoice.subtotal_amount) || 0;
      tableData.push([
        'Consultation médicale',
        '1',
        formatCurrency(subtotal),
        formatCurrency(subtotal)
      ]);
    }
    
    // CORRECTION IMPORTANTE: Utiliser autoTable correctement
    autoTable(doc, {
      startY: currentY,
      head: [['Description', 'Qté', 'Prix unitaire', 'Total']],
      body: tableData,
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });
    
    // Récupérer la position Y après le tableau
    currentY = doc.lastAutoTable.finalY + 15;
    
    // === TOTAUX ===
    const taxPercent = parseFloat(invoice.tax_percent) || parseFloat(invoice.tax_rate) || 20;
    const taxAmount = parseFloat(invoice.tax_amount) || (subtotal * (taxPercent / 100));
    const totalAmount = parseFloat(invoice.total_amount) || (subtotal + taxAmount);
    
    // Ligne de séparation
    doc.setDrawColor(...secondaryColor);
    doc.line(pageWidth - margin - 120, currentY - 5, pageWidth - margin, currentY - 5);
    
    // Sous-total
    doc.setFontSize(11);
    doc.setTextColor(...secondaryColor);
    doc.text('Sous-total:', pageWidth - margin - 80, currentY);
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(subtotal), pageWidth - margin - 30, currentY, { align: 'right' });
    currentY += 8;
    
    // TVA
    doc.setTextColor(...secondaryColor);
    doc.text(`TVA (${taxPercent}%):`, pageWidth - margin - 80, currentY);
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(taxAmount), pageWidth - margin - 30, currentY, { align: 'right' });
    currentY += 8;
    
    // Total
    doc.setDrawColor(...primaryColor);
    doc.line(pageWidth - margin - 120, currentY - 2, pageWidth - margin, currentY - 2);
    currentY += 5;
    
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('TOTAL:', pageWidth - margin - 80, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(totalAmount), pageWidth - margin - 30, currentY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    currentY += 15;
    
    // === STATUT DE PAIEMENT ===
    if (invoice.status === 'paid') {
      doc.setFontSize(12);
      doc.setTextColor(...successColor);
      doc.text('✓ FACTURE PAYÉE', pageWidth - margin - 80, currentY);
      if (invoice.payment_date) {
        doc.setFontSize(10);
        doc.text(`Payée le ${formatDate(invoice.payment_date)}`, pageWidth - margin - 80, currentY + 8);
      }
    } else if (invoice.status === 'overdue') {
      doc.setTextColor(...dangerColor);
      doc.text('⚠ FACTURE EN RETARD', pageWidth - margin - 80, currentY);
    } else if (invoice.status === 'unpaid') {
      doc.setTextColor(...dangerColor);
      doc.text('EN ATTENTE DE PAIEMENT', pageWidth - margin - 80, currentY);
    }
    
    currentY += 20;
    
    // === NOTES ===
    if (invoice.notes) {
      doc.setFontSize(10);
      doc.setTextColor(...secondaryColor);
      doc.text('Notes:', margin, currentY);
      currentY += 8;
      
      doc.setTextColor(0, 0, 0);
      const noteLines = doc.splitTextToSize(invoice.notes, contentWidth - 20);
      doc.text(noteLines, margin, currentY);
      currentY += (noteLines.length * 6);
    }
    
    // === PIED DE PAGE ===
    const footerY = pageHeight - 30;
    doc.setDrawColor(...secondaryColor);
    doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
    
    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    doc.text('Merci de votre confiance - Facture générée automatiquement', margin, footerY);
    doc.text(`Générée le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin - 60, footerY);
    
    // === TÉLÉCHARGEMENT ===
    const fileName = `Facture_${invoice.number}_${invoice.patient?.name?.replace(/\s+/g, '_') || 'Patient'}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF généré et téléchargé avec succès:', fileName);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF:', error);
    throw new Error(`Erreur de génération PDF: ${error.message}`);
  }
};

// === FONCTIONS UTILITAIRES ===

/**
 * Formate une date au format français
 */
const formatDate = (dateString) => {
  if (!dateString) return 'Non spécifiée';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  } catch (error) {
    return dateString;
  }
};

/**
 * Formate un montant en euros
 */
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(num);
};

/**
 * Convertit le statut en texte français
 */
const getStatusText = (status) => {
  const statusMap = {
    'paid': 'Payée',
    'unpaid': 'Non payée',
    'pending': 'En attente',
    'overdue': 'En retard',
    'cancelled': 'Annulée',
    'draft': 'Brouillon',
    'sent': 'Envoyée'
  };
  return statusMap[status] || status;
};

/**
 * Convertit la méthode de paiement en texte français
 */
const getPaymentMethodText = (method) => {
  const methodMap = {
    'card': 'Carte bancaire',
    'cash': 'Espèces',
    'transfer': 'Virement',
    'check': 'Chèque',
    'insurance': 'Assurance'
  };
  return methodMap[method] || method;
};

export default generateInvoicePDF;