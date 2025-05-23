{{-- resources/views/pdf/invoice.blade.php --}}
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture {{ $invoice->number ?? $invoice->id }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.4;
            font-size: 12px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #2c5282;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .clinic-info {
            width: 60%;
        }
        
        .clinic-name {
            font-size: 24px;
            font-weight: bold;
            color: #2c5282;
            margin-bottom: 5px;
        }
        
        .clinic-details {
            font-size: 11px;
            line-height: 1.3;
            color: #666;
        }
        
        .invoice-info {
            width: 35%;
            text-align: right;
        }
        
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #2c5282;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .invoice-number {
            font-size: 16px;
            font-weight: bold;
            color: #666;
            margin-bottom: 5px;
        }
        
        .invoice-date {
            font-size: 12px;
            color: #888;
        }
        
        .parties-section {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
        }
        
        .party-box {
            width: 45%;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            background-color: #f8f9fa;
        }
        
        .party-title {
            font-weight: bold;
            font-size: 14px;
            color: #2c5282;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        
        .party-details {
            font-size: 11px;
            line-height: 1.4;
        }
        
        .party-details strong {
            color: #333;
        }
        
        .invoice-details {
            margin: 30px 0;
        }
        
        .details-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .detail-item {
            text-align: center;
            padding: 10px;
            background-color: #f1f5f9;
            border-radius: 5px;
            min-width: 120px;
        }
        
        .detail-label {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .detail-value {
            font-size: 12px;
            font-weight: bold;
            color: #333;
        }
        
        .items-section {
            margin: 30px 0;
        }
        
        .items-title {
            font-size: 18px;
            font-weight: bold;
            color: #2c5282;
            margin-bottom: 15px;
            text-align: center;
            border-bottom: 2px solid #2c5282;
            padding-bottom: 10px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .items-table th {
            background-color: #2c5282;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .items-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #ddd;
            font-size: 11px;
        }
        
        .items-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .items-table tr:hover {
            background-color: #e3f2fd;
        }
        
        .quantity-col, .price-col, .total-col {
            text-align: right;
            width: 15%;
        }
        
        .description-col {
            width: 55%;
        }
        
        .totals-section {
            margin-top: 30px;
            border-top: 2px solid #ddd;
            padding-top: 20px;
        }
        
        .totals-table {
            width: 100%;
            max-width: 400px;
            margin-left: auto;
        }
        
        .totals-table td {
            padding: 8px 15px;
            font-size: 12px;
        }
        
        .totals-table .label {
            text-align: right;
            font-weight: 500;
            color: #666;
            border-bottom: 1px solid #eee;
        }
        
        .totals-table .value {
            text-align: right;
            font-weight: bold;
            color: #333;
            border-bottom: 1px solid #eee;
            min-width: 100px;
        }
        
        .total-final {
            background-color: #2c5282;
            color: white !important;
            font-size: 14px !important;
            border: none !important;
        }
        
        .payment-info {
            margin: 30px 0;
            padding: 15px;
            background-color: #e8f5e8;
            border-left: 4px solid #4caf50;
            border-radius: 5px;
        }
        
        .payment-info.unpaid {
            background-color: #fff3cd;
            border-left-color: #ffc107;
        }
        
        .payment-info.overdue {
            background-color: #f8d7da;
            border-left-color: #dc3545;
        }
        
        .payment-title {
            font-weight: bold;
            color: #2e7d32;
            margin-bottom: 10px;
            font-size: 13px;
        }
        
        .payment-info.unpaid .payment-title {
            color: #856404;
        }
        
        .payment-info.overdue .payment-title {
            color: #721c24;
        }
        
        .payment-details {
            font-size: 11px;
            line-height: 1.4;
        }
        
        .payment-methods {
            margin: 20px 0;
            padding: 15px;
            background-color: #f0f8ff;
            border-radius: 5px;
            border: 1px solid #b3d9ff;
        }
        
        .methods-title {
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
            font-size: 13px;
        }
        
        .method-item {
            margin-bottom: 8px;
            font-size: 11px;
            display: flex;
            justify-content: space-between;
        }
        
        .notes-section {
            margin: 30px 0;
            padding: 15px;
            background-color: #fff8e1;
            border-left: 4px solid #ff9800;
            border-radius: 5px;
        }
        
        .notes-title {
            font-weight: bold;
            color: #ef6c00;
            margin-bottom: 10px;
            font-size: 13px;
        }
        
        .notes-content {
            font-size: 11px;
            line-height: 1.4;
            color: #333;
        }
        
        .footer {
            margin-top: 40px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            font-size: 10px;
            color: #666;
            text-align: center;
        }
        
        .footer-section {
            margin-bottom: 15px;
        }
        
        .legal-mentions {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 9px;
            line-height: 1.3;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-paid {
            background-color: #e8f5e8;
            color: #2e7d32;
            border: 1px solid #4caf50;
        }
        
        .status-unpaid {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffc107;
        }
        
        .status-overdue {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #dc3545;
        }
        
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 60px;
            color: rgba(220, 53, 69, 0.1);
            z-index: -1;
            font-weight: bold;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 10px;
            }
            
            .parties-section {
                display: block;
            }
            
            .party-box {
                width: 100%;
                margin-bottom: 15px;
            }
        }
    </style>
</head>
<body>
    {{-- Watermark pour factures impayées --}}
    @if($invoice->status === 'overdue')
        <div class="watermark">EN RETARD</div>
    @elseif($invoice->status === 'cancelled')
        <div class="watermark">ANNULÉE</div>
    @endif

    {{-- En-tête de la facture --}}
    <div class="header">
        <div class="clinic-info">
            <div class="clinic-name">{{ $clinicInfo['name'] }}</div>
            <div class="clinic-details">
                {{ $clinicInfo['address'] }}<br>
                Tél: {{ $clinicInfo['phone'] }} | Email: {{ $clinicInfo['email'] }}<br>
                SIRET: {{ $clinicInfo['siret'] }} | TVA: {{ $clinicInfo['tva'] }}
            </div>
        </div>
        
        <div class="invoice-info">
            <div class="invoice-title">Facture</div>
            <div class="invoice-number">{{ $invoice->number ?? 'INV' . str_pad($invoice->id, 6, '0', STR_PAD_LEFT) }}</div>
            <div class="invoice-date">{{ \Carbon\Carbon::parse($invoice->date)->format('d/m/Y') }}</div>
            <div style="margin-top: 10px;">
                @if($invoice->status === 'paid')
                    <span class="status-badge status-paid">Payée</span>
                @elseif($invoice->status === 'overdue')
                    <span class="status-badge status-overdue">En retard</span>
                @else
                    <span class="status-badge status-unpaid">Non payée</span>
                @endif
            </div>
        </div>
    </div>

    {{-- Informations des parties --}}
    <div class="parties-section">
        <div class="party-box">
            <div class="party-title">Facturer à</div>
            <div class="party-details">
                <strong>{{ $patient->name }}</strong><br>
                {{ $patient->email }}<br>
                @if($patientProfile && $patientProfile->phone)
                    Tél: {{ $patientProfile->phone }}<br>
                @endif
                @if($patientProfile && $patientProfile->address)
                    {{ $patientProfile->address }}
                @endif
            </div>
        </div>
        
        <div class="party-box">
            <div class="party-title">Détails de facturation</div>
            <div class="party-details">
                <strong>Date d'émission:</strong> {{ \Carbon\Carbon::parse($invoice->date)->format('d/m/Y') }}<br>
                <strong>Date d'échéance:</strong> {{ \Carbon\Carbon::parse($invoice->due_date)->format('d/m/Y') }}<br>
                @if($invoice->payment_date)
                    <strong>Date de paiement:</strong> {{ \Carbon\Carbon::parse($invoice->payment_date)->format('d/m/Y') }}<br>
                @endif
                @if($invoice->payment_method)
                    <strong>Mode de paiement:</strong> {{ $invoice->payment_method }}
                @endif
            </div>
        </div>
    </div>

    {{-- Section des prestations --}}
    <div class="items-section">
        <h2 class="items-title">Détail des prestations</h2>
        
        <table class="items-table">
            <thead>
                <tr>
                    <th class="description-col">Description</th>
                    <th class="quantity-col">Qté</th>
                    <th class="price-col">Prix unitaire</th>
                    <th class="total-col">Total</th>
                </tr>
            </thead>
            <tbody>
                @if($items && $items->count() > 0)
                    @foreach($items as $item)
                    <tr>
                        <td class="description-col">{{ $item->description }}</td>
                        <td class="quantity-col">{{ number_format($item->quantity, 0, ',', ' ') }}</td>
                        <td class="price-col">{{ number_format($item->unit_price, 2, ',', ' ') }} €</td>
                        <td class="total-col">{{ number_format($item->quantity * $item->unit_price, 2, ',', ' ') }} €</td>
                    </tr>
                    @endforeach
                @else
                    <tr>
                        <td colspan="4" style="text-align: center; font-style: italic; color: #666;">
                            Aucun détail d'article disponible
                        </td>
                    </tr>
                @endif
            </tbody>
        </table>
    </div>

    {{-- Section des totaux --}}
    <div class="totals-section">
        <table class="totals-table">
            <tr>
                <td class="label">Sous-total HT:</td>
                <td class="value">{{ number_format($subtotal, 2, ',', ' ') }} €</td>
            </tr>
            <tr>
                <td class="label">TVA ({{ $invoice->tax_percent ?? 20 }}%):</td>
                <td class="value">{{ number_format($taxAmount, 2, ',', ' ') }} €</td>
            </tr>
            <tr>
                <td class="label total-final">Total TTC:</td>
                <td class="value total-final">{{ number_format($total, 2, ',', ' ') }} €</td>
            </tr>
        </table>
    </div>

    {{-- Informations de paiement --}}
    @if($invoice->status === 'paid')
        <div class="payment-info">
            <div class="payment-title">✓ Facture réglée</div>
            <div class="payment-details">
                Cette facture a été réglée le {{ \Carbon\Carbon::parse($invoice->payment_date)->format('d/m/Y') }}
                @if($invoice->payment_method)
                    par {{ $invoice->payment_method }}.
                @endif
                Merci pour votre confiance.
            </div>
        </div>
    @else
        <div class="payment-info {{ $invoice->status === 'overdue' ? 'overdue' : 'unpaid' }}">
            <div class="payment-title">
                @if($invoice->status === 'overdue')
                    ⚠ Facture en retard de paiement
                @else
                    💳 Modalités de paiement
                @endif
            </div>
            <div class="payment-details">
                @if($invoice->status === 'overdue')
                    Cette facture était due le {{ \Carbon\Carbon::parse($invoice->due_date)->format('d/m/Y') }}.
                    Veuillez procéder au règlement dans les plus brefs délais.
                @else
                    Cette facture est à régler avant le {{ \Carbon\Carbon::parse($invoice->due_date)->format('d/m/Y') }}.
                @endif
            </div>
        </div>
        
        <div class="payment-methods">
            <div class="methods-title">Moyens de paiement acceptés</div>
            <div class="method-item">
                <span>• Carte bancaire</span>
                <span>En ligne ou sur place</span>
            </div>
            <div class="method-item">
                <span>• Virement bancaire</span>
                <span>IBAN: FR76 1234 5678 9012 3456 7890 123</span>
            </div>
            <div class="method-item">
                <span>• Chèque</span>
                <span>À l'ordre de "{{ $clinicInfo['name'] }}"</span>
            </div>
            <div class="method-item">
                <span>• Espèces</span>
                <span>Paiement sur place uniquement</span>
            </div>
        </div>
    @endif

    {{-- Notes de la facture --}}
    @if($invoice->notes)
        <div class="notes-section">
            <div class="notes-title">📝 Notes</div>
            <div class="notes-content">{{ $invoice->notes }}</div>
        </div>
    @endif

    {{-- Mentions légales --}}
    <div class="legal-mentions">
        <strong>Mentions légales:</strong> 
        En cas de retard de paiement, des pénalités de retard seront appliquées au taux de 3 fois le taux d'intérêt légal.
        Une indemnité forfaitaire de recouvrement de 40€ sera due en cas de retard de paiement.
        Aucun escompte ne sera accordé en cas de paiement anticipé.
        En cas de litige, seuls les tribunaux de [Ville] sont compétents.
    </div>

    {{-- Pied de page --}}
    <div class="footer">
        <div class="footer-section">
            Document généré le {{ $dateGeneration }}
        </div>
        <div class="footer-section">
            {{ $clinicInfo['name'] }} - {{ $clinicInfo['address'] }}
        </div>
        <div class="footer-section">
            Cette facture a été générée électroniquement et est valide sans signature.
        </div>
    </div>
</body>
</html>